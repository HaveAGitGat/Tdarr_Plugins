import path from 'path';
import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer,
  getFileAbosluteDir,
  getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Apply Radarr or Sonarr naming policy',
  description: 'Apply Radarr or Sonarr naming policy to a file. Has to be used after the "Set Flow Variables From '
    + 'Radarr Or Sonarr" plugin and after the original file has been replaced and Radarr or Sonarr has '
    + 'been notified. Radarr or Sonarr should also be notified after this plugin.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faPenToSquare',
  inputs: [
    {
      label: 'Arr',
      name: 'arr',
      type: 'string',
      defaultValue: 'radarr',
      inputUI: {
        type: 'dropdown',
        options: ['radarr', 'sonarr'],
      },
      tooltip: 'Specify which arr to use',
    },
    {
      label: 'Arr API Key',
      name: 'arr_api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr api key here',
    },
    {
      label: 'Arr Host',
      name: 'arr_host',
      type: 'string',
      defaultValue: 'http://192.168.1.1:7878',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr host here.\nExample:\n'
        + 'http://192.168.1.1:7878\n'
        + 'http://192.168.1.1:8989\n'
        + 'https://radarr.domain.com\n'
        + 'https://sonarr.domain.com',
    },
  ],
  outputs: [
    { number: 1, tooltip: 'Radarr or Sonarr notified' },
    { number: 2, tooltip: 'Radarr or Sonarr do not know this file' },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string;
  'X-Api-Key': string;
  Accept: string;
}

interface IFileInfo {
  id: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface IFileToRename {
  newPath: string;
  episodeNumbers?: number[];
}

interface IPreviewRenameResponse {
  data: IFileToRename[];
}

interface IArrConfig {
  content: string;
  buildPreviewRenameUrl: (fileInfo: IFileInfo, host: string) => string;
  getFileToRename: (response: IPreviewRenameResponse, fileInfo: IFileInfo) => IFileToRename | undefined;
}

const API_VERSION = 'v3';
const CONTENT_TYPE = 'application/json';

const arrConfigs: Record<'radarr' | 'sonarr', IArrConfig> = {
  radarr: {
    content: 'Movie',
    buildPreviewRenameUrl: (fileInfo, host) => `${host}/api/${API_VERSION}/rename?movieId=${fileInfo.id}`,
    getFileToRename: (response) => response.data?.at(0),
  },
  sonarr: {
    content: 'Serie',
    // eslint-disable-next-line max-len
    buildPreviewRenameUrl: (fileInfo, host) => `${host}/api/${API_VERSION}/rename?seriesId=${fileInfo.id}&seasonNumber=${fileInfo.seasonNumber}`,
    // eslint-disable-next-line max-len
    getFileToRename: (response, fileInfo) => response.data?.find((file) => file.episodeNumbers?.at(0) === fileInfo.episodeNumber),
  },
} as const;

const normalizeHost = (host: string): string => {
  const trimmedHost = host.trim();
  return trimmedHost.endsWith('/') ? trimmedHost.slice(0, -1) : trimmedHost;
};

const createHeaders = (apiKey: string): IHTTPHeaders => ({
  'Content-Type': CONTENT_TYPE,
  'X-Api-Key': apiKey,
  Accept: CONTENT_TYPE,
});

const buildNewPath = (currentFileName: string, fileToRename: IFileToRename): string => {
  const directory = getFileAbosluteDir(currentFileName);
  const fileName = getFileName(fileToRename.newPath);
  const container = getContainer(fileToRename.newPath);
  return path.join(directory, `${fileName}.${container}`);
};

const previewRename = async (
  args: IpluginInputArgs,
  host: string,
  headers: IHTTPHeaders,
  fileInfo: IFileInfo,
  config: IArrConfig,
): Promise<IFileToRename | undefined> => {
  try {
    const response: IPreviewRenameResponse = await args.deps.axios({
      method: 'get',
      url: config.buildPreviewRenameUrl(fileInfo, host),
      headers,
    });

    return config.getFileToRename(response, fileInfo);
  } catch (error) {
    throw new Error(`Failed to preview rename: ${(error as Error).message}`);
  }
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key, arr_host } = args.inputs as {
    arr: 'radarr' | 'sonarr';
    arr_api_key: string;
    arr_host: string;
  };
  const host = normalizeHost(arr_host);
  const headers = createHeaders(arr_api_key);
  const config = arrConfigs[arr];
  const currentFileName = args.inputFileObj?._id ?? '';

  args.jobLog('Going to apply new name');
  args.jobLog(`Renaming ${arr}...`);

  let newPath = '';
  let isSuccessful = false;

  try {
    const fileInfo = {
      id: args.variables.user.ArrId ?? '',
      seasonNumber: Number(args.variables.user.ArrSeasonNumber ?? -1),
      episodeNumber: Number(args.variables.user.ArrEpisodeNumber ?? -1),
    };
    args.jobLog(`ArrId ${fileInfo.id} read from flow variables`);
    args.jobLog(`ArrSeasonNumber ${fileInfo.seasonNumber} read from flow variables`);
    args.jobLog(`ArrEpisodeNumber ${fileInfo.episodeNumber} read from flow variables`);

    if (fileInfo.id === '-1') {
      args.jobLog('❌ Invalid file ID');
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 2,
        variables: args.variables,
      };
    }

    const fileToRename = await previewRename(args, host, headers, fileInfo, config);

    if (!fileToRename) {
      args.jobLog('✔ No rename necessary.');
      isSuccessful = true;
    } else {
      newPath = buildNewPath(currentFileName, fileToRename);
      isSuccessful = await fileMoveOrCopy({
        operation: 'move',
        sourcePath: currentFileName,
        destinationPath: newPath,
        args,
      });

      if (isSuccessful) {
        args.jobLog(`✔ File renamed to: ${newPath}`);
      }
    }
  } catch (error) {
    args.jobLog(`❌ Error during rename: ${(error as Error).message}`);
    isSuccessful = false;
  }

  return {
    outputFileObj: isSuccessful && newPath !== ''
      ? { ...args.inputFileObj, _id: newPath }
      : args.inputFileObj,
    outputNumber: isSuccessful ? 1 : 2,
    variables: args.variables,
  };
};

export { details, plugin };
