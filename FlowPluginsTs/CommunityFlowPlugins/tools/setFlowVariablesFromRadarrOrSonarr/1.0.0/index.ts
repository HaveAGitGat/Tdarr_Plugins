import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Flow Variables From Radarr Or Sonarr',
  description: 'Set Flow Variables From Radarr or Sonarr. The variables set are :'
    + '\\n  ArrId : internal id for Radarr or Sonarr;'
    + '\\n  ArrOriginalLanguageCode : code of the orignal language (ISO 639-2) as know by Radarr or Sonarr;'
    + '\\n  ArrSeasonNumber : the season number of the episode;'
    + '\\n  ArrEpisodeNumber : the episode number.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
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
      tooltip: 'Variables read from Radarr or Sonarr',
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
  episodeNumber?: number,
  languageCode?: string,
}
interface IOriginalLanguage {
  id: number,
  name: string,
}
interface ILookupResponse {
  data: [{
    id: number,
    originalLanguage?: IOriginalLanguage
  }],
}
interface IParseResponse {
  data: {
    movie?: {
      id: number,
      originalLanguage?: IOriginalLanguage
    },
    series?: {
      id: number,
      originalLanguage?: IOriginalLanguage
    },
    parsedEpisodeInfo?: {
      episodeNumbers: number[],
      seasonNumber: number,
    },
  },
}
interface IArrApp {
  name: string,
  host: string,
  headers: IHTTPHeaders,
  content: string,
  delegates: {
    getFileInfoFromLookupResponse:
    (lookupResponse: ILookupResponse, fileName: string) => IFileInfo,
    getFileInfoFromParseResponse:
    (parseResponse: IParseResponse) => IFileInfo,
    setFlowVariables:
    (fInfo: IFileInfo) => void
  }
}

const getFileInfoFromLookup = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
)
  : Promise<IFileInfo> => {
  let fInfo: IFileInfo = { id: '-1' };
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.at(0) ?? '';
  if (imdbId !== '') {
    const lookupResponse: ILookupResponse = await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
      headers: arrApp.headers,
    });
    fInfo = arrApp.delegates.getFileInfoFromLookupResponse(lookupResponse, fileName);
    args.jobLog(`${arrApp.content} ${fInfo.id !== '-1' ? `'${fInfo.id}' found` : 'not found'}`
      + ` for imdb '${imdbId}'`);
  }
  return fInfo;
};

const getFileInfoFromParse = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
)
  : Promise<IFileInfo> => {
  let fInfo: IFileInfo = { id: '-1' };
  const parseResponse: IParseResponse = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
    headers: arrApp.headers,
  });
  fInfo = arrApp.delegates.getFileInfoFromParseResponse(parseResponse);
  args.jobLog(`${arrApp.content} ${fInfo.id !== '-1' ? `'${fInfo.id}' found` : 'not found'}`
    + ` for '${getFileName(fileName)}'`);
  return fInfo;
};

const getFileInfo = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
)
  : Promise<IFileInfo> => {
  const fInfo = await getFileInfoFromLookup(args, arrApp, fileName);
  return (fInfo.id === '-1' || (arrApp.name === 'sonarr' && (fInfo.seasonNumber === -1 || fInfo.episodeNumber === -1)))
    ? getFileInfoFromParse(args, arrApp, fileName)
    : fInfo;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

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

  const arrApp: IArrApp = arr === 'radarr'
    ? {
      name: arr,
      host: arrHost,
      headers,
      content: 'Movie',
      delegates: {
        getFileInfoFromLookupResponse:
          (lookupResponse) => ({
            id: String(lookupResponse?.data?.at(0)?.id ?? -1),
            languageCode: lookupResponse?.data?.at(0)?.originalLanguage?.name ?? '',
          }),
        getFileInfoFromParseResponse:
          (parseResponse) => ({
            id: String(parseResponse?.data?.movie?.id ?? -1),
            languageCode: parseResponse?.data?.movie?.originalLanguage?.name ?? '',
          }),
        setFlowVariables:
          (fInfo) => {
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrId = fInfo.id;
            args.jobLog(`Setting variable ArrId to ${fInfo.id}`);
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrOriginalLanguageCode = fInfo.languageCode ?? '';
            args.jobLog(`Setting variable ArrOriginalLanguageCode to ${fInfo.languageCode ?? ''}`);
          },
      },
    }
    : {
      name: arr,
      host: arrHost,
      headers,
      content: 'Serie',
      delegates: {
        getFileInfoFromLookupResponse:
          (lookupResponse, fileName) => {
            const fInfo: IFileInfo = {
              id: String(lookupResponse?.data?.at(0)?.id ?? -1),
              languageCode: lookupResponse?.data?.at(0)?.originalLanguage?.name ?? '',
            };
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
            languageCode: parseResponse?.data?.series?.originalLanguage?.name ?? '',
          }),
        setFlowVariables:
          (fInfo) => {
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrId = fInfo.id;
            args.jobLog(`Setting variable ArrId to ${fInfo.id}`);
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrSeasonNumber = String(fInfo.seasonNumber ?? 0);
            args.jobLog(`Setting variable ArrSeasonNumber to ${String(fInfo.seasonNumber ?? 0)}`);
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrEpisodeNumber = String(fInfo.episodeNumber ?? 0);
            args.jobLog(`Setting variable ArrEpisodeNumber to ${fInfo.episodeNumber ?? 0}`);
            // eslint-disable-next-line no-param-reassign
            args.variables.user.ArrOriginalLanguageCode = fInfo.languageCode ?? '';
            args.jobLog(`Setting variable ArrOriginalLanguageCode to ${fInfo.languageCode ?? ''}`);
          },
      },
    };

  // Retrieving content variables
  let fInfo = await getFileInfo(args, arrApp, originalFileName);
  // Useful in some edge cases
  if (fInfo.id === '-1' && currentFileName !== originalFileName) {
    fInfo = await getFileInfo(args, arrApp, currentFileName);
  }

  // Checking that the file has been found
  if (fInfo.id !== '-1') {
    if (!args.variables.user) {
      // eslint-disable-next-line no-param-reassign
      args.variables.user = {};
    }

    arrApp.delegates.setFlowVariables(fInfo);
    isSuccessful = true;
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: isSuccessful ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
