import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Apply Radarr or Sonarr naming policy',
  description:
    'Apply Radarr or Sonarr naming policy to a file. Has to be used after the "Set Flow Variables From '
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
      tooltip: 'Input your arr host here.'
        + '\\nExample:\\n'
        + 'http://192.168.1.1:7878\\n'
        + 'http://192.168.1.1:8989\\n'
        + 'https://radarr.domain.com\\n'
        + 'https://sonarr.domain.com\\n',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Radarr or Sonarr notified',
    },
    {
      number: 2,
      tooltip: 'Radarr or Sonarr do not know this file',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}
interface IFileInfo {
  id: string,
  seasonNumber?: number,
  episodeNumber?: number
}
interface IFileToRename {
  newPath: string,
  episodeNumbers?: number[]
}
interface IPreviewRenameResponse {
  data: IFileToRename[]
}
interface IArrApp {
  name: string,
  host: string,
  headers: IHTTPHeaders,
  content: string,
  delegates: {
    buildPreviewRenameResquestUrl:
    (fileInfo: IFileInfo) => string,
    getFileToRenameFromPreviewRenameResponse:
    (previewRenameResponse: IPreviewRenameResponse, fileInfo: IFileInfo) => IFileToRename | undefined
  }
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let newPath = '';
  let isSuccessful = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const currentFileName = args.inputFileObj?._id ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.arr_api_key),
    Accept: 'application/json',
  };

  const arrApp: IArrApp = arr === 'radarr'
    ? {
      name: arr,
      host: arrHost,
      headers,
      content: 'Movie',
      delegates: {
        buildPreviewRenameResquestUrl:
          (fInfo) => `${arrHost}/api/v3/rename?movieId=${fInfo.id}`,
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse) => previewRenameResponse.data?.at(0),
      },
    }
    : {
      name: arr,
      host: arrHost,
      headers,
      content: 'Serie',
      delegates: {
        buildPreviewRenameResquestUrl:
          (fInfo) => `${arrHost}/api/v3/rename?seriesId=${fInfo.id}&seasonNumber=${fInfo.seasonNumber}`,
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse, fInfo) => previewRenameResponse.data
            ?.find((episodeFile) => episodeFile.episodeNumbers?.at(0) === fInfo.episodeNumber),
      },
    };

  args.jobLog('Going to apply new name');
  args.jobLog(`Renaming ${arrApp.name}...`);

  // Retrieving movie or serie id, plus season and episode number for serie
  const fInfo: IFileInfo = {
    id: args.variables.user.ArrId ?? '',
    seasonNumber: Number(args.variables.user.ArrId ?? -1),
    episodeNumber: Number(args.variables.user.ArrId ?? -1),
  };

  // Checking that the file has been found
  if (fInfo.id !== '-1') {
    // Using rename endpoint to get ids of all the files that need renaming
    const previewRenameRequestResult = await args.deps.axios({
      method: 'get',
      url: arrApp.delegates.buildPreviewRenameResquestUrl(fInfo),
      headers,
    });
    const fileToRename = arrApp.delegates
      .getFileToRenameFromPreviewRenameResponse(previewRenameRequestResult, fInfo);

    // Only if there is a rename to execute
    if (fileToRename !== undefined) {
      newPath = `${getFileAbosluteDir(currentFileName)
      }/${getFileName(fileToRename.newPath)
      }.${getContainer(fileToRename.newPath)}`;

      isSuccessful = await fileMoveOrCopy({
        operation: 'move',
        sourcePath: currentFileName,
        destinationPath: newPath,
        args,
      });
    } else {
      isSuccessful = true;
      args.jobLog('✔ No rename necessary.');
    }
  }

  return {
    outputFileObj:
      isSuccessful && newPath !== ''
        ? { ...args.inputFileObj, _id: newPath }
        : args.inputFileObj,
    outputNumber: isSuccessful ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
