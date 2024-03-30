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
    'Apply Radarr or Sonarr naming policy to a file. This plugin should be called after the original file has been '
    + 'replaced and Radarr or Sonarr has been notified. Radarr or Sonarr should also be notified after this plugin.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faBell',
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
      tooltip: 'Radarr or Sonnar notified',
    },
    {
      number: 2,
      tooltip: 'Radarr or Sonnar do not know this file',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}
interface IFileDetails {
  data: {
    movie?: { id: number },
    series?: { id: number },
    parsedEpisodeInfo?: {
      episodeNumbers: number[],
      seasonNumber: number
    },
  },
}
interface IFileDetailsWrapper {
  id: string
  fileDetails?: IFileDetails
}
interface IFileToRename {
  newPath: string
  episodeNumbers?: number[]
}
interface IPreviewRenameResponse {
  data: IFileToRename[]
}
interface IRenameType {
  appName: string,
  content: string,
  delegates: {
    getIdFromParseResponse:
    (fileDetailsWrapper: IFileDetailsWrapper) => string,
    buildPreviewRenameResquestUrl:
    (fileDetailsWrapper: IFileDetailsWrapper) => string,
    getFileToRenameFromPreviewRenameResponse:
    (previewRenameResponse: IPreviewRenameResponse) => IFileToRename | undefined
  }
}

const getMovieId = async (
  args: IpluginInputArgs,
  arrHost: string,
  headers: IHTTPHeaders,
  fileName: string,
  getNewPathType: IRenameType,
)
  : Promise<string> => {
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)?.at(0) ?? '';
  const id = (imdbId !== '')
    ? String(
      (await args.deps.axios({
        method: 'get',
        url: `${arrHost}/api/v3/movie/lookup?term=imdb:${imdbId}`,
        headers,
      })).data?.at(0)?.id ?? -1,
    )
    : '-1';
  args.jobLog(`${getNewPathType.content} ${id !== '-1' ? `${id} found` : 'not found'} for imdb '${imdbId}'`);
  return id;
};

const getFileDetailsWrapper = async (
  args: IpluginInputArgs,
  arr: string,
  arrHost: string,
  headers: IHTTPHeaders,
  fileName: string,
  renameType: IRenameType,
)
  : Promise<IFileDetailsWrapper> => {
  const fdw: IFileDetailsWrapper = {
    id: arr === 'radarr' ? await getMovieId(args, arrHost, headers, fileName, renameType) : '-1',
    fileDetails: undefined,
  };
  if (fdw.id === '-1') {
    fdw.fileDetails = await args.deps.axios({
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
      headers,
    });
    fdw.id = renameType.delegates.getIdFromParseResponse(fdw);
    args.jobLog(`${renameType.content} ${fdw.id !== '-1' ? `${fdw.id} found` : 'not found'} for '`
      + `${getFileName(fileName)}'`);
  }
  return fdw;
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let newPath = '';
  let isSuccessful = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const originalFileName = args.originalLibraryFile?._id ?? '';
  const currentFileName = args.inputFileObj?._id ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.arr_api_key),
    Accept: 'application/json',
  };

  let episodeNumber = 0;
  const renameType: IRenameType = arr === 'radarr'
    ? {
      appName: 'Radarr',
      content: 'Movie',
      delegates: {
        getIdFromParseResponse:
          (fileDetailsWrapper) => String(fileDetailsWrapper.fileDetails?.data?.movie?.id ?? -1),
        buildPreviewRenameResquestUrl:
          (fileDetailsWrapper) => `${arrHost}/api/v3/rename?movieId=${fileDetailsWrapper.id}`,
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse) => previewRenameResponse.data?.at(0),
      },
    }
    : {
      appName: 'Sonarr',
      content: 'Serie',
      delegates: {
        getIdFromParseResponse:
          (fileDetailsWrapper) => String(fileDetailsWrapper.fileDetails?.data?.series?.id ?? -1),
        buildPreviewRenameResquestUrl:
          (fileDetailsWrapper) => {
            [episodeNumber] = fileDetailsWrapper.fileDetails?.data.parsedEpisodeInfo?.episodeNumbers ?? [1];
            return `${arrHost}/api/v3/rename?seriesId=${fileDetailsWrapper.id}&seasonNumber=`
              + `${fileDetailsWrapper.fileDetails?.data.parsedEpisodeInfo?.seasonNumber ?? 1}`;
          },
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse) => previewRenameResponse.data
            ?.find((episodeFile) => episodeFile.episodeNumbers?.at(0) === episodeNumber),
      },
    };

  args.jobLog('Going to apply new name');
  args.jobLog(`Renaming ${renameType.appName}...`);

  let fileDetailsWrapper = await getFileDetailsWrapper(args, arr, arrHost, headers, originalFileName, renameType);
  // Useful in some edge cases
  if (fileDetailsWrapper.id === '-1' && currentFileName !== originalFileName) {
    fileDetailsWrapper = await getFileDetailsWrapper(args, arr, arrHost, headers, currentFileName, renameType);
  }

  // Checking that the file has been found
  if (fileDetailsWrapper.id !== '-1') {
    // Using rename endpoint to get ids of all the files that need renaming
    const previewRenameRequestResult = await args.deps.axios({
      method: 'get',
      url: renameType.delegates.buildPreviewRenameResquestUrl(fileDetailsWrapper),
      headers,
    });
    const fileToRename = renameType.delegates
      .getFileToRenameFromPreviewRenameResponse(previewRenameRequestResult);

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
      args.jobLog(`✔ ${renameType.content} ${fileDetailsWrapper.id} renamed : `
        + `'${originalFileName}' => '${newPath}'.`);
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
