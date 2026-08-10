import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Audio Remove Unwanted Languages',
  description: 'Audio Remove Unwanted Languages, Define the languages you want to keep.'
  + ' All others will be removed. If there is only one audio stream plugin will be skipped.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Keep Languages',
      name: 'langTags',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Choose the languages you want to keep.  Three letter format.'
        + 'Seperate additional tags with commas eng,jpn,kor  ',
    },
    {
      label: 'Keep Undefined',
      name: 'keepUndefined',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Keeps the Undefined Audio Streams',
    },
    {
      label: 'Keep Native, Requires API keys to check this if enabled.',
      name: 'keepNative',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to enable setting keep native. ',
    },
    {
      label: 'Priority, Check Radarr or Sonarr First',
      name: 'priority',
      type: 'string',
      defaultValue: 'Radarr',
      inputUI: {
        type: 'dropdown',
        options: [
          'Radarr',
          'Sonarr',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the audio bitrate for newly added channels',
    },
    {
      label: 'TMDB api key, It is recomended to add this under Tools Global Variables as api_key',
      name: 'api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your TMDB api (v3) key here. (https://www.themoviedb.org/), or use api_key as a global variable.',
    },
    {
      label: 'Radarr api key, It is recomended to add this under Tools Global Variables as radarr_api_key',
      name: 'radarr_api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.radarr_api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your Radarr api key here, or use radarr_api_key as a global variable.',
    },
    {
      label: 'Radarr url, It is recomended to add this under Tools Global Variables as radarr_url',
      name: 'radarr_url',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.radarr_url}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Input your Radarr url here. (With the http://), do include the port,'
        + 'or use radarr_url as a global variable.',
    },
    {
      label: 'Sonarr api key, It is recomended to add this under Tools Global Variables as sonarr_api_key',
      name: 'sonarr_api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.sonarr_api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your Sonarr api key here, or use sonarr_api_key as a global variable.',
    },
    {
      label: 'Sonarr url, It is recomended to add this under Tools Global Variables as sonarr_url',
      name: 'sonarr_url',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.sonarr_url}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Input your Sonarr url here. (With the http://), do include the port,'
        + 'or use sonarr_url as a global variable.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const tmdbApi = async (filename :string, api_key :string, args :IpluginInputArgs) => {
  let fileName = '';
  // If filename begins with tt, it's already an imdb id
  if (filename) {
    if (filename.slice(0, 2) === 'tt') {
      fileName = filename;
    } else {
      const idRegex = /(tt\d{7,8})/;
      const fileMatch = filename.match(idRegex);
      // eslint-disable-next-line prefer-destructuring
      if (fileMatch) fileName = fileMatch[1];
    }
  }
  if (fileName) {
    const result = await args.deps.axios
      .get(
        `https://api.themoviedb.org/3/find/${fileName}?api_key=`
        + `${api_key}&language=en-US&external_source=imdb_id`,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((resp :any) => (resp.data.movie_results.length > 0
        ? resp.data.movie_results[0]
        : resp.data.tv_results[0]));
    if (!result) {
      return null;
    }
    return result;
  }
  return null;
};
interface Body {
  movie: {
    imdbId: string,
  }
  series: {
    imdbId: string,
  }
}
const parseArrResponse = (body :Body, arr :string) => {
  switch (arr) {
    case 'radarr':
      return body.movie;
    case 'sonarr':
      return body.series;
    default:
      throw new Error('This should never happen');
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tmdbFetchResult = async (args :IpluginInputArgs, languages :any) => {
  const priority = String(args.inputs.priority);
  const api_key = String(args.inputs.api_key);
  const radarr_api_key = String(args.inputs.radarr_api_key);
  const radarr_url = String(args.inputs.radarr_url);
  const sonarr_api_key = String(args.inputs.sonarr_api_key);
  const sonarr_url = String(args.inputs.sonarr_url);
  interface tmdbResult {
    original_language: string,
  }
  let tmdbResult :null|tmdbResult = null;
  let prio = ['radarr', 'sonarr'];
  if (priority === 'sonarr') {
    prio = ['sonarr', 'radarr'];
  }
  interface arrResult {
    imdbId: string,
    originalLanguage?: {
      name?: string,
    }
  }
  let radarrResult :null|arrResult = null;
  let sonarrResult :null|arrResult = null;
  if (args.inputFileObj.meta?.FileName) {
    const fileNameEncoded = encodeURIComponent(args.inputFileObj.meta.FileName);
    // eslint-disable-next-line no-restricted-syntax
    for (const arr of prio) {
      let imdbId = '';
      switch (arr) {
        case 'radarr':
          if (tmdbResult) break;
          if (radarr_api_key) {
            // eslint-disable-next-line no-await-in-loop
            radarrResult = await parseArrResponse(
              // eslint-disable-next-line no-await-in-loop
              await args.deps.axios
                .get(
                  `${radarr_url}/api/v3/parse?apikey=${radarr_api_key}&title=${fileNameEncoded}`,
                ).then((resp :unknown) => {
                  if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
                    return resp.data;
                  }
                  return null;
                }),
              'radarr',
            );
            if (radarrResult) {
              imdbId = radarrResult.imdbId;
              args.jobLog(`Grabbed ID (${imdbId}) from Radarr `);
              tmdbResult = { original_language: languages.getAlpha2Code(radarrResult.originalLanguage?.name, 'en') };
            } else {
              imdbId = fileNameEncoded;
            }
          }
          break;
        case 'sonarr':
          if (tmdbResult) break;
          if (sonarr_api_key) {
            // eslint-disable-next-line no-await-in-loop
            sonarrResult = await parseArrResponse(
              // eslint-disable-next-line no-await-in-loop
              await args.deps.axios.get(
                `${sonarr_url}/api/v3/parse?apikey=${sonarr_api_key}&title=${fileNameEncoded}`,
              ).then((resp :unknown) => {
                if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
                  return resp.data;
                }
                return null;
              }),
              'sonarr',
            );
            if (sonarrResult) {
              imdbId = sonarrResult.imdbId;
              args.jobLog(`Grabbed ID (${imdbId}) from Sonarr `);
            } else {
              imdbId = fileNameEncoded;
            }
            // eslint-disable-next-line no-await-in-loop
            tmdbResult = await tmdbApi(imdbId, api_key, args);
          }
          break;
        default:
          throw new Error('This should never happen');
      }
    }
    if (tmdbResult) {
      return tmdbResult;
    }
    args.jobLog('Couldn\'t find the IMDB id of this file. I do not know what the native language is.');
  }
  return null;
};

const findNumberOfAudioStream = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const number = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;
    return number;
  }
  return 0;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refineLangTags = (languages :any, langTags :string[]) => {
  const master = langTags;
  langTags.forEach((element) => {
    const lang = languages.alpha3BToAlpha2(element);
    master.push(lang);
  });
  return master;
};

const removeUnwanted = (
  args :IpluginInputArgs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  languages :any,
  numberOfAudioStreams :number,
  nativeLang :string,
  nativeLangBool :boolean,
) => {
  const langTagsUnTrimmed = String(args.inputs.langTags).toLowerCase().split(',');
  const langTags: Array<string> = [];
  langTagsUnTrimmed.forEach((element) => {
    const trimedElement = element.trim();
    langTags.push(trimedElement);
  });
  const keepUndefined = Boolean(args.inputs.keepUndefined);

  if (numberOfAudioStreams >= 2) {
    const langTagsMaster = refineLangTags(languages, langTags);
    let audioStreamsRemoved = 0;
    args.variables.ffmpegCommand.streams.forEach((stream) => {
      if (stream.codec_type !== 'audio') {
        return;
      }
      if (keepUndefined) {
        if ((!stream.tags || !stream.tags.language || stream.tags.language.toLowerCase().includes('und'))) {
          return;
        }
      }
      if (stream.tags && stream.tags.language && langTagsMaster.includes(stream.tags.language.toLowerCase())) {
        return;
      }
      if (nativeLangBool) {
        if (stream.tags?.language?.toLowerCase().includes(nativeLang)) {
          return;
        }
      }
      args.jobLog(`Removing Stream ${stream.index} is unwanted`);
      // eslint-disable-next-line no-param-reassign
      stream.removed = true;
      audioStreamsRemoved += 1;
    });
    if (audioStreamsRemoved === numberOfAudioStreams) {
      throw new Error('All audio streams would be removed.');
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const dependencies = ['@cospired/i18n-iso-languages'];
  await args.installClassicPluginDeps(dependencies);
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  const keepNative = Boolean(args.inputs.keepNative);
  let nativeLang = '';
  let nativeLangBool = false;
  const numberOfAudioStreams = Number(findNumberOfAudioStream(args));

  if (numberOfAudioStreams === 1) {
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  if (keepNative) {
    if (args.inputFileObj.ffProbeData.streams) {
      const tmdbResult = await tmdbFetchResult(args, languages);
      if (tmdbResult) {
        const langsTemp :string = tmdbResult.original_language === 'cn' ? 'zh' : tmdbResult.original_language;
        const originalLang :string = (languages.alpha2ToAlpha3B(langsTemp));
        nativeLang = originalLang;
        nativeLangBool = true;
        args.jobLog(`Found ${langsTemp} using code ${nativeLang}`);
      }
    }
  }

  removeUnwanted(args, languages, numberOfAudioStreams, nativeLang, nativeLangBool);

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
