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
interface IFileInfo {
  id: string,
  seasonNumber?: number,
  episodeNumber?: number
}
interface ILookupResponse {
  data: [{ id: number }],
}
interface IParseResponse {
  data: {
    movie?: { id: number },
    series?: { id: number },
    parsedEpisodeInfo?: {
      episodeNumbers: number[],
      seasonNumber: number
    },
  },
}
interface IFileToRename {
  newPath: string,
  episodeNumbers?: number[]
}
interface IPreviewRenameResponse {
  data: IFileToRename[]
}
interface IRenameType {
  appName: string,
  content: string,
  delegates: {
    getFileInfoFromLookupResponse:
    (lookupResponse: ILookupResponse, fileName: string) => IFileInfo,
    getFileInfoFromParseResponse:
    (parseResponse: IParseResponse) => IFileInfo,
    buildPreviewRenameResquestUrl:
    (fileInfo: IFileInfo) => string,
    getFileToRenameFromPreviewRenameResponse:
    (previewRenameResponse: IPreviewRenameResponse, fileInfo: IFileInfo) => IFileToRename | undefined
  }
}

const getFileInfoFromLookup = async (
  args: IpluginInputArgs,
  arr: string,
  arrHost: string,
  headers: IHTTPHeaders,
  fileName: string,
  renameType: IRenameType,
)
  : Promise<IFileInfo> => {
  let fInfo: IFileInfo = { id: '-1' };
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)?.at(0) ?? '';
  if (imdbId !== '') {
    const lookupResponse: ILookupResponse = await args.deps.axios({
      method: 'get',
      url: `${arrHost}/api/v3/${arr === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
      headers,
    });
    fInfo = renameType.delegates.getFileInfoFromLookupResponse(lookupResponse, fileName);
    args.jobLog(`${renameType.content} ${fInfo.id !== '-1' ? `'${fInfo.id}' found` : 'not found'}`
      + ` for imdb '${imdbId}'`);
  }
  return fInfo;
};

const getFileInfoFromParse = async (
  args: IpluginInputArgs,
  arr: string,
  arrHost: string,
  headers: IHTTPHeaders,
  fileName: string,
  renameType: IRenameType,
)
  : Promise<IFileInfo> => {
  let fInfo: IFileInfo = { id: '-1' };
  const parseResponse: IParseResponse = await args.deps.axios({
    method: 'get',
    url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
    headers,
  });
  fInfo = renameType.delegates.getFileInfoFromParseResponse(parseResponse);
  args.jobLog(`${renameType.content} ${fInfo.id !== '-1' ? `'${fInfo.id}' found` : 'not found'}`
    + ` for '${getFileName(fileName)}'`);
  return fInfo;
};

const getFileInfo = async (
  args: IpluginInputArgs,
  arr: string,
  arrHost: string,
  headers: IHTTPHeaders,
  fileName: string,
  renameType: IRenameType,
)
  : Promise<IFileInfo> => {
  const fInfo = await getFileInfoFromLookup(args, arr, arrHost, headers, fileName, renameType);
  return (fInfo.id === '-1' || (arr === 'sonarr' && (fInfo.seasonNumber === -1 || fInfo.episodeNumber === -1)))
    ? getFileInfoFromParse(args, arr, arrHost, headers, fileName, renameType)
    : fInfo;
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

  const renameType: IRenameType = arr === 'radarr'
    ? {
      appName: 'Radarr',
      content: 'Movie',
      delegates: {
        getFileInfoFromLookupResponse:
          (lookupResponse) => ({ id: String(lookupResponse?.data?.at(0)?.id ?? -1) }),
        getFileInfoFromParseResponse:
          (parseResponse) => ({ id: String(parseResponse?.data?.movie?.id ?? -1) }),
        buildPreviewRenameResquestUrl:
          (fInfo) => `${arrHost}/api/v3/rename?movieId=${fInfo.id}`,
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse) => previewRenameResponse.data?.at(0),
      },
    }
    : {
      appName: 'Sonarr',
      content: 'Serie',
      delegates: {
        getFileInfoFromLookupResponse:
          (lookupResponse, fileName) => {
            const fInfo: IFileInfo = { id: String(lookupResponse?.data?.at(0)?.id ?? -1) };
            if (fInfo.id !== '-1') {
              const seasonEpisodenumber = /\bS\d{1,3}E\d{1,4}\b/i.exec(fileName)?.at(0) ?? '';
              const episodeNumber = /\d{1,4}$/i.exec(seasonEpisodenumber)?.at(0) ?? '';
              fInfo.seasonNumber = Number(/\d{1,3}/i
                .exec(seasonEpisodenumber.slice(0, -episodeNumber.length))
                ?.at(0) ?? '-1');
              fInfo.episodeNumber = Number(episodeNumber !== '' ? episodeNumber : -1);
            }
            return fInfo;
          },
        getFileInfoFromParseResponse:
          (parseResponse) => ({
            id: String(parseResponse?.data?.series?.id ?? -1),
            seasonNumber: parseResponse?.data?.parsedEpisodeInfo?.seasonNumber ?? 1,
            episodeNumber: parseResponse?.data?.parsedEpisodeInfo?.episodeNumbers?.at(0) ?? 1,
          }),
        buildPreviewRenameResquestUrl:
          (fInfo) => `${arrHost}/api/v3/rename?seriesId=${fInfo.id}&seasonNumber=${fInfo.seasonNumber}`,
        getFileToRenameFromPreviewRenameResponse:
          (previewRenameResponse, fInfo) => previewRenameResponse.data
            ?.find((episodeFile) => episodeFile.episodeNumbers?.at(0) === fInfo.episodeNumber),
      },
    };

  args.jobLog('Going to apply new name');
  args.jobLog(`Renaming ${renameType.appName}...`);

  // Retrieving movie or serie id, plus season and episode number for serie
  let fInfo = await getFileInfo(args, arr, arrHost, headers, originalFileName, renameType);
  // Useful in some edge cases
  if (fInfo.id === '-1' && currentFileName !== originalFileName) {
    fInfo = await getFileInfo(args, arr, arrHost, headers, currentFileName, renameType);
  }

  // Checking that the file has been found
  if (fInfo.id !== '-1') {
    // Using rename endpoint to get ids of all the files that need renaming
    const previewRenameRequestResult = await args.deps.axios({
      method: 'get',
      url: renameType.delegates.buildPreviewRenameResquestUrl(fInfo),
      headers,
    });
    const fileToRename = renameType.delegates
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
