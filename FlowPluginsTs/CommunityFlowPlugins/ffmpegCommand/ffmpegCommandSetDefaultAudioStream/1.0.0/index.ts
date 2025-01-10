import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Default Audio Track',
  description: 'Sets the default audio track based on channels count and Radarr or SOnnar',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Use Radarr or Sonarr to get original language',
      name: 'useRadarrOrSonarr',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Should the language of the default audio track be read from Radarr or Sonarr ? If yes, the Arr, Arr API Key and Arr Host properties are mandatory and the Language property will be ignored. If no, please indicate the language to use in the Language property.',
    },
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
    {
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify what language to use in the ISO 639-2 format.'
        + '\\nExample:\\n'
        + 'eng\\n'
        + 'fre\\n',
    },
    {
      label: 'Use the highest number of channels as default',
      name: 'useHightestNumberOfChannels',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set as the default audio stream ? If yes, the Channels property will be ignored. If no, please indicate the channels to use in the Channels property.',
    },
    {
      label: 'Channels ',
      name: 'channels',
      type: 'string',
      defaultValue: '5.1',
      inputUI: {
        type: 'dropdown',
        options: ['7.1', '5.1', '2.0'],
      },
      tooltip: 'Specify what number of channels should be used as the default channel.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}
interface IFileInfo {
  languageName: string,
}
interface IOriginalLanguage {
  id: number,
  name: string,
}
interface ILookupResponse {
  data: [{ originalLanguage?: IOriginalLanguage }],
}
interface IParseResponse {
  data: {
    movie?: { originalLanguage?: IOriginalLanguage },
    series?: { originalLanguage?: IOriginalLanguage },
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
  }
}
interface ILanguage {
  alpha3_b: string;
}
interface ILanguagesResponse {
  total_count: number,
  results: ILanguage[]
}

const getFileInfoFromLookup = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
)
  : Promise<IFileInfo> => {
  let fInfo: IFileInfo = { languageName: '' };
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.at(0) ?? '';
  if (imdbId !== '') {
    const lookupResponse: ILookupResponse = await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
      headers: arrApp.headers,
    });
    fInfo = arrApp.delegates.getFileInfoFromLookupResponse(lookupResponse, fileName);
    args.jobLog(`${arrApp.content} ${fInfo.languageName !== '' ? `'${fInfo.languageName}' found` : 'not found'}`
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
  let fInfo: IFileInfo = { languageName: '' };
  const parseResponse: IParseResponse = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
    headers: arrApp.headers,
  });
  fInfo = arrApp.delegates.getFileInfoFromParseResponse(parseResponse);
  args.jobLog(`${arrApp.content} ${fInfo.languageName !== '' ? `'${fInfo.languageName}' found` : 'not found'}`
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
  return (fInfo.languageName === '')
    ? getFileInfoFromParse(args, arrApp, fileName)
    : fInfo;
};

const getLanguageCode = async (
  args: IpluginInputArgs,
  languageName: string)
  : Promise<string | null> => {
  const response = await fetch(`https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/iso-language-codes-639-1-and-639-2@public/records?select=alpha3_b&where=english%20%3D%20%22${languageName}%22&limit=1`);
  if (!response.ok) {
    args.jobLog('Failed to fetch language data');
    return null;
  }

  const languages: ILanguagesResponse = await response.json();
  if (languages.total_count !== 1) {
    args.jobLog('Failed to fetch language data');
    return null;
  }

  return (languages.results[0]?.alpha3_b) ?? null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  // const streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
  const streams: IffmpegCommandStream[] = args.variables.ffmpegCommand.streams;

  let isSuccessful = false;
  var shouldProcess = false;
  var defaultSet = false;

  // Sets the language code used to determine the default audio stream
  let languageCode = args.inputs.language;
  if (args.inputs.useRadarrOrSonarr) {
    const arr = String(args.inputs.arr);
    const arr_host = String(args.inputs.arr_host).trim();
    const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
    const originalFileName = args.originalLibraryFile?._id ?? '';
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
            (lookupResponse) => ({ languageName: String(lookupResponse?.data?.at(0)?.originalLanguage?.name ?? "") }),
          getFileInfoFromParseResponse:
            (parseResponse) => ({ languageName: String(parseResponse?.data?.movie?.originalLanguage?.name ?? "") }),
        },
      }
      : {
        name: arr,
        host: arrHost,
        headers,
        content: 'Serie',
        delegates: {
          getFileInfoFromLookupResponse:
            (lookupResponse) => ({ languageName: String(lookupResponse?.data?.at(0)?.originalLanguage?.name ?? "") }),
          getFileInfoFromParseResponse:
            (parseResponse) => ({ languageName: String(parseResponse?.data?.series?.originalLanguage?.name ?? "") }),
        },
      };

    languageCode = await getLanguageCode(args, (await getFileInfo(args, arrApp, originalFileName))?.languageName);
  }

  // Sets the channels used to determine the default audio stream
  const channels = args.inputs.useHightestNumberOfChannels ?
    streams
      .filter((stream) => stream.codec_type === "audio" && (stream.tags?.language ?? '' === languageCode))
      ?.sort((stream1, stream2) => (stream1.channels ?? 0) > (stream2.channels ?? 0) ? 1 : -1)
      ?.at(0)
      ?.channels
    ?? 0
    : args.inputs.channels;

  streams.forEach((stream, index) => {
    if (stream.codec_type === "audio") {
      if ((stream.tags?.language ?? '') === languageCode
        && (stream.channels ?? 0) == channels
        && !defaultSet) {
        stream.outputArgs.push(`-disposition:${index}`, 'default');
        defaultSet = true;
      } else
        stream.outputArgs.push(`-disposition:${index}`, '0F');
    }
  });

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};