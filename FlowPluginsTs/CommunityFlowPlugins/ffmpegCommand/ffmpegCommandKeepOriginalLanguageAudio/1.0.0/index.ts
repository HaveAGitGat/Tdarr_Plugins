import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Keep Original Language Audio',
  description: `Remove dubbed audio tracks. Keeps the languages you list plus the title's original
  language, which is looked up in Radarr or Sonarr, so foreign language titles keep their own audio.
  \\n\\n
  A fixed keep list cannot do this safely: keeping only English mutes a Japanese film, and adding
  Japanese to the list keeps the Japanese dub on every English film.
  \\n\\n
  Keep list codes match every variant of the same language, so eng also keeps en and en-US tracks.
  \\n\\n
  Fails open: if the lookup fails, the title is not found, the original language is unknown, or the
  result would remove every audio track, all audio is kept. Needs Radarr v3+ or Sonarr v4+ (Sonarr v3
  does not report an original language).`,
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
      label: 'Arr',
      name: 'arr',
      type: 'string',
      defaultValue: 'radarr',
      inputUI: {
        type: 'dropdown',
        options: ['radarr', 'sonarr'],
      },
      tooltip: 'Specify which arr to look the original language up in',
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
      label: 'Always Keep Languages',
      name: 'keepLanguages',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Comma separated language codes to keep in addition to the original language.'
        + ' Each code also matches the other codes for the same language (eng = en = en-US).'
        + '\\nExample:\\n'
        + 'eng\\n'
        + 'eng,fre',
    },
    {
      label: 'Keep Untagged Audio',
      name: 'keepUntagged',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Keep audio tracks with no language tag, or tagged und.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// Radarr/Sonarr language names -> language codes found in Matroska/MP4 tags
// (ISO 639-2/B, ISO 639-2/T and ISO 639-1).
const languageCodes: Record<string, string[]> = {
  afrikaans: ['afr', 'af'],
  albanian: ['alb', 'sqi', 'sq'],
  arabic: ['ara', 'ar'],
  azerbaijani: ['aze', 'az'],
  bengali: ['ben', 'bn'],
  bosnian: ['bos', 'bs'],
  bulgarian: ['bul', 'bg'],
  cantonese: ['chi', 'zho', 'zh', 'yue'],
  catalan: ['cat', 'ca'],
  chinese: ['chi', 'zho', 'zh', 'cmn', 'yue'],
  croatian: ['hrv', 'hr'],
  czech: ['cze', 'ces', 'cs'],
  danish: ['dan', 'da'],
  dutch: ['dut', 'nld', 'nl'],
  english: ['eng', 'en'],
  estonian: ['est', 'et'],
  finnish: ['fin', 'fi'],
  flemish: ['dut', 'nld', 'nl'],
  french: ['fre', 'fra', 'fr'],
  georgian: ['geo', 'kat', 'ka'],
  german: ['ger', 'deu', 'de'],
  greek: ['gre', 'ell', 'el'],
  hebrew: ['heb', 'he', 'iw'],
  hindi: ['hin', 'hi'],
  hungarian: ['hun', 'hu'],
  icelandic: ['ice', 'isl', 'is'],
  indonesian: ['ind', 'id'],
  italian: ['ita', 'it'],
  japanese: ['jpn', 'ja'],
  kannada: ['kan', 'kn'],
  kazakh: ['kaz', 'kk'],
  korean: ['kor', 'ko'],
  latvian: ['lav', 'lv'],
  lithuanian: ['lit', 'lt'],
  macedonian: ['mac', 'mkd', 'mk'],
  malay: ['may', 'msa', 'ms'],
  malayalam: ['mal', 'ml'],
  mandarin: ['chi', 'zho', 'zh', 'cmn'],
  marathi: ['mar', 'mr'],
  mongolian: ['mon', 'mn'],
  norwegian: ['nor', 'nob', 'nno', 'no', 'nb', 'nn'],
  persian: ['per', 'fas', 'fa'],
  polish: ['pol', 'pl'],
  portuguese: ['por', 'pt'],
  punjabi: ['pan', 'pa'],
  romanian: ['rum', 'ron', 'ro'],
  romansh: ['roh', 'rm'],
  russian: ['rus', 'ru'],
  serbian: ['srp', 'sr'],
  slovak: ['slo', 'slk', 'sk'],
  slovenian: ['slv', 'sl'],
  spanish: ['spa', 'es'],
  swedish: ['swe', 'sv'],
  tagalog: ['tgl', 'fil', 'tl'],
  tamil: ['tam', 'ta'],
  telugu: ['tel', 'te'],
  thai: ['tha', 'th'],
  turkish: ['tur', 'tr'],
  ukrainian: ['ukr', 'uk'],
  urdu: ['urd', 'ur'],
  uzbek: ['uzb', 'uz'],
  vietnamese: ['vie', 'vi'],
};

// 'Portuguese (Brazil)' -> 'portuguese', 'Spanish (Latino)' -> 'spanish'
const normaliseLanguageName = (name: string): string => name
  .toLowerCase()
  .replace(/\(.*?\)/g, '')
  .replace(/[^a-z]/g, '');

// Tags that name no single spoken language: undetermined, no linguistic content, multiple, uncoded.
const untaggedCodes = ['', 'und', 'zxx', 'mul', 'mis'];

// 'en-US' -> 'en', 'pt_BR' -> 'pt'
const primaryLanguageTag = (tag: string): string => tag.toLowerCase().trim().split(/[-_]/)[0];

// 'eng' -> ['eng', 'en'], so a keep list entry matches every tag variant of its language.
const expandLanguageCode = (code: string): string[] => {
  const variants = Object.values(languageCodes)
    .filter((codes) => codes.includes(code))
    .flat();
  return variants.length > 0 ? variants : [code];
};

interface IParseResponse {
  data?: {
    movie?: { originalLanguage?: { name?: string } },
    series?: { originalLanguage?: { name?: string } },
  },
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const result = {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };

  const audioStreams = args.variables.ffmpegCommand.streams
    .filter((stream) => stream.codec_type === 'audio' && !stream.removed);
  if (audioStreams.length <= 1) {
    args.jobLog('Fewer than two audio streams, nothing to remove');
    return result;
  }

  const arr = String(args.inputs.arr);
  const arrHostInput = String(args.inputs.arr_host).trim();
  const arrHost = arrHostInput.endsWith('/') ? arrHostInput.slice(0, -1) : arrHostInput;
  const fileName = getFileName(args.originalLibraryFile?._id || args.inputFileObj._id);

  let originalLanguage = '';
  try {
    const response: IParseResponse = await args.deps.axios({
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
      headers: {
        'X-Api-Key': String(args.inputs.arr_api_key),
        Accept: 'application/json',
      },
    });
    const media = arr === 'radarr' ? response?.data?.movie : response?.data?.series;
    if (!media) {
      args.jobLog(`'${fileName}' was not found in ${arr}, keeping all audio`);
      return result;
    }
    originalLanguage = String(media.originalLanguage?.name || '');
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    args.jobLog(`${arr} lookup failed (${status ? `HTTP ${status}` : (err as Error).message}),`
      + ' keeping all audio');
    return result;
  }

  if (!originalLanguage) {
    args.jobLog(`${arr} did not return an original language for '${fileName}', keeping all audio`);
    return result;
  }

  const originalCodes = languageCodes[normaliseLanguageName(originalLanguage)];
  if (!originalCodes) {
    args.jobLog(`No language codes known for original language '${originalLanguage}', keeping all audio`);
    return result;
  }

  const keep = new Set<string>(originalCodes);
  String(args.inputs.keepLanguages)
    .split(',')
    .map(primaryLanguageTag)
    .filter((code) => code !== '')
    .forEach((code) => expandLanguageCode(code).forEach((variant) => keep.add(variant)));
  const keepUntagged = args.inputs.keepUntagged === true || String(args.inputs.keepUntagged) === 'true';

  args.jobLog(`Original language is ${originalLanguage}, keeping: ${Array.from(keep).join(',')}`
    + `${keepUntagged ? ' and untagged audio' : ''}`);

  const isKept = (language: string): boolean => {
    if (untaggedCodes.includes(language)) {
      return keepUntagged;
    }
    return keep.has(language);
  };

  const toRemove = audioStreams.filter(
    (stream) => !isKept(primaryLanguageTag(String(stream.tags?.language || ''))),
  );

  if (toRemove.length === 0) {
    args.jobLog('All audio streams are wanted, nothing removed');
    return result;
  }

  if (toRemove.length === audioStreams.length) {
    args.jobLog('Removing these would leave no audio, keeping all audio instead');
    return result;
  }

  for (let i = 0; i < toRemove.length; i++) {
    const stream = toRemove[i];
    args.jobLog(`Removing audio stream ${stream.index} (${stream.tags?.language || 'untagged'},`
      + ` ${stream.codec_name})`);
    stream.removed = true;
  }
  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;
  args.jobLog(`Kept ${audioStreams.length - toRemove.length} of ${audioStreams.length} audio streams`);

  return result;
};

export {
  details,
  plugin,
};
