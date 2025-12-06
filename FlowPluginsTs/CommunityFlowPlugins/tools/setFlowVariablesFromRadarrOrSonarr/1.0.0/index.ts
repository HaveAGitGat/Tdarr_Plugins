import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

// ===== CONSTANTS =====
const NOT_FOUND_ID = '-1';
const DEFAULT_SEASON = 1;
const DEFAULT_EPISODE = 1;
const DEFAULT_EPISODE_ID = '1';
const DEFAULT_LANGUAGE_CODE = 'und';
const LANGUAGE_API_TIMEOUT = 5000;
const ARR_API_TIMEOUT = 10000;

const API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

// eslint-disable-next-line max-len
const LANGUAGE_API_BASE_URL = 'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/iso-language-codes-639-1-and-639-2@public/records';

// ===== INTERFACES =====
interface IBaseResponse {
  id: number;
  originalLanguage?: {
    id: number;
    name: string;
  };
  episodes?: Array<{
    id: number;
  }>;
  qualityProfileId: number;
}

interface IEpisodeItemResponse {
  id: number;
  episodeNumber: number;
}

interface IRadarrFileInfo {
  type: 'radarr';
  id: string;
  originalLanguageName?: string;
  profileLanguageName?: string;
}

interface ISonarrFileInfo {
  type: 'sonarr';
  id: string;
  originalLanguageName?: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeId: string;
}

type IFileInfo = IRadarrFileInfo | ISonarrFileInfo | { type: 'unknown'; id: typeof NOT_FOUND_ID };

interface IArrConfig {
  name: 'radarr' | 'sonarr';
  host: string;
  apiKey: string;
}

const details = (): IpluginDetails => ({
  name: 'Set Flow Variables From Radarr Or Sonarr',
  description: 'Set Flow Variables From Radarr or Sonarr. The variables set are : '
    + 'ArrId (internal id for Radarr or Sonarr), '
    + 'ArrOriginalLanguageCode (code of the orignal language (ISO 639-2) as know by Radarr or Sonarr), '
    + 'ArrProfileLanguageCode (code of the orignal language (ISO 639-2) as know by Radarr or Sonarr), '
    + 'ArrSeasonNumber (the season number of the episode), '
    + 'ArrEpisodeNumber (the episode number).',
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

// ===== HELPER FUNCTIONS =====
const createHeaders = (apiKey: string) => ({
  ...API_HEADERS,
  'X-Api-Key': apiKey,
});

/**
 * Builds a search term from filename by extracting TVDB, TMDB, or IMDB IDs
 * Supports formats: tvdb-123, tvdbid-123, tmdb-456, tmdbid-456, imdb-tt123456, imdbid-tt123456
 * @param filePath - The file path to extract ID from
 * @returns Formatted search term or null if no ID found
 */
const buildTerm = (filePath: string): string | null => {
  // Match tvdb or tvdbid followed by numbers
  const tvdbMatch = filePath.match(/tvdb(?:id)?-(\d+)/i);
  if (tvdbMatch?.[1]) return `tvdb:${tvdbMatch[1]}`;

  // Match tmdb or tmdbid followed by numbers
  const tmdbMatch = filePath.match(/tmdb(?:id)?-(\d+)/i);
  if (tmdbMatch?.[1]) return `tmdb:${tmdbMatch[1]}`;

  // Match imdb or imdbid followed by IMDB ID format (tt, nm, co, ev, ch, ni + numbers)
  const imdbMatch = filePath.match(/imdb(?:id)?-((?:tt|nm|co|ev|ch|ni)\d+)/i);
  if (imdbMatch?.[1]) return `imdb:${imdbMatch[1]}`;

  return null;
};

/**
 * Extracts season and episode numbers from filename
 * Supports format: S01E01, S1E1, s01e01, etc.
 * @param fileName - The filename to parse
 * @returns Object with seasonNumber and episodeNumber
 */
const extractSeasonEpisodeInfo = (fileName: string): { seasonNumber: number; episodeNumber: number } => {
  const seasonEpisodeMatch = /\bS(\d{1,3})E(\d{1,4})\b/i.exec(fileName);
  return (seasonEpisodeMatch?.[1] && seasonEpisodeMatch?.[2])
    ? {
      seasonNumber: Number(seasonEpisodeMatch[1]),
      episodeNumber: Number(seasonEpisodeMatch[2]),
    }
    : {
      seasonNumber: -1,
      episodeNumber: -1,
    };
};

// ===== API INTERACTION FUNCTIONS =====
/**
 * Retrieves the language name from a quality profile
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param qualityProfileId - The quality profile ID to query
 * @returns Language name or undefined if not found or on error
 */
const getQualityProfileLanguageName = async (
  args: IpluginInputArgs,
  config: IArrConfig,
  qualityProfileId: number,
): Promise<string | undefined> => {
  try {
    const response = await args.deps.axios({
      method: 'get',
      url: `${config.host}/api/v3/qualityProfile/${qualityProfileId}`,
      headers: createHeaders(config.apiKey),
      timeout: ARR_API_TIMEOUT,
    });

    const { data } = response;
    return data?.language?.name;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Retrieve profile language name failed for profile ${qualityProfileId}: ${errorMessage}`);
    return undefined;
  }
};

/**
 * Fills in episode details for a Sonarr series
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param seriesId - The series ID
 * @param seasonNumber - The season number
 * @param episodeNumber - The episode number
 * @returns Episode ID or default value on error
 */
const getEpisodeId = async (
  args: IpluginInputArgs,
  config: IArrConfig,
  seriesId: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<string> => {
  try {
    const response = await args.deps.axios({
      method: 'get',
      url: `${config.host}/api/v3/episode?seriesId=${seriesId}&seasonNumber=${seasonNumber}`,
      headers: createHeaders(config.apiKey),
      timeout: ARR_API_TIMEOUT,
    });

    const episodesArray: IEpisodeItemResponse[] = response.data;

    if (!episodesArray || episodesArray.length === 0) {
      throw new Error(
        `No episodes found for series ${seriesId} season ${seasonNumber}`,
      );
    }

    const episodeItem = episodesArray.find((episode) => episode.episodeNumber === episodeNumber);

    if (!episodeItem) {
      throw new Error(
        `Episode ${episodeNumber} not found in series ${seriesId} season ${seasonNumber}. `
        + `Available episodes: ${episodesArray.map((e) => e.episodeNumber).join(', ')}`,
      );
    }

    return String(episodeItem.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Fill episode info failed: ${errorMessage}`);
    return DEFAULT_EPISODE_ID;
  }
};

/**
 * Looks up content in Radarr/Sonarr by external ID (TVDB, TMDB, IMDB)
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param fileName - The filename to extract ID from
 * @returns File information or not found indicator
 */
const lookupContent = async (
  args: IpluginInputArgs,
  config: IArrConfig,
  fileName: string,
): Promise<IFileInfo> => {
  const term = buildTerm(fileName);

  if (!term) {
    return { type: 'unknown', id: NOT_FOUND_ID };
  }

  args.jobLog(`Found ${term} in the file path`);

  try {
    const contentType = config.name === 'radarr' ? 'movie' : 'series';
    const response = await args.deps.axios({
      method: 'get',
      url: `${config.host}/api/v3/${contentType}/lookup?term=${encodeURIComponent(term)}`,
      headers: createHeaders(config.apiKey),
      timeout: ARR_API_TIMEOUT,
    });

    const contentArray: IBaseResponse[] = response.data;
    const content = contentArray?.[0];

    if (!content) {
      args.jobLog(`No content found for ${term}`);
      return { type: 'unknown', id: NOT_FOUND_ID };
    }

    const baseInfo = {
      id: String(content.id),
      originalLanguageName: content.originalLanguage?.name ?? '',
    };

    if (config.name === 'sonarr') {
      const { seasonNumber, episodeNumber } = extractSeasonEpisodeInfo(fileName);

      if (seasonNumber === -1 || episodeNumber === -1) {
        args.jobLog(`Could not extract season/episode info from filename: ${fileName}`);
        return { type: 'unknown', id: NOT_FOUND_ID };
      }

      const episodeId = await getEpisodeId(
        args,
        config,
        baseInfo.id,
        seasonNumber,
        episodeNumber,
      );

      return {
        type: 'sonarr',
        ...baseInfo,
        seasonNumber,
        episodeNumber,
        episodeId,
      };
    }

    if (config.name === 'radarr') {
      const profileLanguageName = await getQualityProfileLanguageName(
        args,
        config,
        content.qualityProfileId,
      );

      return {
        type: 'radarr',
        ...baseInfo,
        profileLanguageName,
      };
    }

    return { type: 'unknown', id: NOT_FOUND_ID };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Lookup failed for ${term}: ${errorMessage}`);
    return { type: 'unknown', id: NOT_FOUND_ID };
  }
};

/**
 * Parses filename to find content in Radarr/Sonarr
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param fileName - The filename to parse
 * @returns File information or not found indicator
 */
const parseContent = async (
  args: IpluginInputArgs,
  config: IArrConfig,
  fileName: string,
): Promise<IFileInfo> => {
  try {
    const { data } = await args.deps.axios({
      method: 'get',
      url: `${config.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
      headers: createHeaders(config.apiKey),
      timeout: ARR_API_TIMEOUT,
    });
    const content: IBaseResponse = config.name === 'radarr' ? data.movie : data.series;

    if (!content) {
      args.jobLog(`Parse did not return any ${config.name === 'radarr' ? 'movie' : 'series'} data`);
      return { type: 'unknown', id: NOT_FOUND_ID };
    }

    const baseInfo = {
      id: String(content.id),
      originalLanguageName: content.originalLanguage?.name ?? '',
    };

    if (config.name === 'sonarr') {
      return {
        type: 'sonarr',
        ...baseInfo,
        seasonNumber: data.parsedEpisodeInfo?.seasonNumber ?? DEFAULT_SEASON,
        episodeNumber: data.parsedEpisodeInfo?.episodeNumbers?.[0] ?? DEFAULT_EPISODE,
        episodeId: String(data.episodes?.[0]?.id ?? DEFAULT_EPISODE_ID),
      };
    }

    if (config.name === 'radarr') {
      const profileLanguageName = await getQualityProfileLanguageName(
        args,
        config,
        content.qualityProfileId,
      );

      return {
        type: 'radarr',
        ...baseInfo,
        profileLanguageName,
      };
    }

    return { type: 'unknown', id: NOT_FOUND_ID };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Parse failed for ${fileName}: ${errorMessage}`);
    return { type: 'unknown', id: NOT_FOUND_ID };
  }
};

const languageCodeCache = new Map<string, string>();

/**
 * Fetches ISO 639-2 language code from language name using external API
 * Implements caching to avoid redundant API calls
 * @param args - Plugin input arguments
 * @param languageName - The language name to look up
 * @returns ISO 639-2 (alpha3_b) language code or DEFAULT_LANGUAGE_CODE
 */
const getLanguageCode = async (args: IpluginInputArgs, languageName: string): Promise<string> => {
  if (!languageName || languageName.trim() === '') {
    return '';
  }

  args.jobLog(`Fetching language code for "${languageName}"`);
  const normalizedName = languageName.trim().toLowerCase();
  const cachedValue = languageCodeCache.get(normalizedName);
  if (cachedValue !== undefined) {
    args.jobLog(`From cache "${languageName}":"${cachedValue}"`);
    return cachedValue;
  }

  try {
    const url = `${LANGUAGE_API_BASE_URL}?select=alpha3_b&where=english%20%3D%20%22${
      encodeURIComponent(languageName)
    }%22&limit=1`;

    const { data } = await args.deps.axios({
      method: 'get',
      url,
      timeout: LANGUAGE_API_TIMEOUT,
    });
    const languageCode = data.results?.[0]?.alpha3_b ?? DEFAULT_LANGUAGE_CODE;
    args.jobLog(`From API "${languageName}":"${languageCode}"`);

    // Cache the result
    languageCodeCache.set(normalizedName, languageCode);

    return languageCode;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Failed to fetch language code for "${languageName}": ${errorMessage}`);
    return DEFAULT_LANGUAGE_CODE;
  }
};

/**
 * Sets flow variables based on file information from Radarr/Sonarr
 * Uses parallel language code fetching for better performance
 * @param args - Plugin input arguments
 * @param fileInfo - The file information to set variables from
 */
const setVariables = async (
  args: IpluginInputArgs,
  fileInfo: IFileInfo,
): Promise<void> => {
  // eslint-disable-next-line no-param-reassign
  args.variables.user = args.variables.user || {};

  // Set common variables
  // eslint-disable-next-line no-param-reassign
  args.variables.user.ArrId = fileInfo.id;
  args.jobLog(`Setting variable ArrId to ${args.variables.user.ArrId}`);

  if (fileInfo.type === 'sonarr') {
    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrOriginalLanguageCode = await getLanguageCode(args, fileInfo.originalLanguageName ?? '');
    args.jobLog(`Setting variable ArrOriginalLanguageCode to ${args.variables.user.ArrOriginalLanguageCode}`);

    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrSeasonNumber = String(fileInfo.seasonNumber);
    args.jobLog(`Setting variable ArrSeasonNumber to ${args.variables.user.ArrSeasonNumber}`);

    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrEpisodeNumber = String(fileInfo.episodeNumber);
    args.jobLog(`Setting variable ArrEpisodeNumber to ${args.variables.user.ArrEpisodeNumber}`);

    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrEpisodeId = fileInfo.episodeId;
    args.jobLog(`Setting variable ArrEpisodeId to ${args.variables.user.ArrEpisodeId}`);
  } else if (fileInfo.type === 'radarr') {
    let originalLanguageCode = '';
    let profileLanguageCode = '';

    switch ((fileInfo.profileLanguageName ?? '').toLowerCase()) {
      case 'original':
        args.jobLog('Profile language is "Original", using original language');
        originalLanguageCode = await getLanguageCode(args, fileInfo.originalLanguageName ?? '');
        profileLanguageCode = originalLanguageCode;
        break;
      case 'any':
        args.jobLog('Profile language is "Any", setting to "und" (undetermined)');
        originalLanguageCode = await getLanguageCode(args, fileInfo.originalLanguageName ?? '');
        profileLanguageCode = 'und';
        break;
      default:
        [originalLanguageCode, profileLanguageCode] = await Promise.all([
          getLanguageCode(args, fileInfo.originalLanguageName ?? ''),
          getLanguageCode(args, fileInfo.profileLanguageName ?? ''),
        ]);
        break;
    }

    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrOriginalLanguageCode = originalLanguageCode;
    args.jobLog(`Setting variable ArrOriginalLanguageCode to ${originalLanguageCode}`);
    // eslint-disable-next-line no-param-reassign
    args.variables.user.ArrProfileLanguageCode = profileLanguageCode;
    args.jobLog(`Setting variable ArrProfileLanguageCode to ${profileLanguageCode}`);
  }
};

// ===== MAIN PLUGIN FUNCTION =====
/**
 * Main plugin function that orchestrates the workflow
 * 1. Attempts to lookup content by external ID
 * 2. Falls back to parsing filename if lookup fails
 * 3. Tries both original and current filenames
 * 4. Sets flow variables if content is found
 */
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  try {
    const config: IArrConfig = {
      name: args.inputs.arr as 'radarr' | 'sonarr',
      host: String(args.inputs.arr_host).trim().replace(/\/$/, ''),
      apiKey: String(args.inputs.arr_api_key).trim(),
    };

    const originalFileName = args.originalLibraryFile?._id ?? '';
    const currentFileName = args.inputFileObj?._id ?? '';

    if (!originalFileName && !currentFileName) {
      args.jobLog('No filename available to process');
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 2,
        variables: args.variables,
      };
    }

    args.jobLog(`Processing file: ${originalFileName || currentFileName}`);
    args.jobLog(`Using ${config.name} at ${config.host}`);

    // Try to get file info from original filename first, then current filename
    let fileInfo = await lookupContent(args, config, originalFileName);
    if (fileInfo.id === NOT_FOUND_ID && currentFileName !== originalFileName && currentFileName) {
      args.jobLog('Lookup failed for original filename, trying current filename');
      fileInfo = await lookupContent(args, config, currentFileName);
    }

    // If lookup fails, try parsing
    if (fileInfo.id === NOT_FOUND_ID) {
      args.jobLog('Lookup failed, attempting to parse filename');
      fileInfo = await parseContent(args, config, originalFileName);
      if (fileInfo.id === NOT_FOUND_ID && currentFileName !== originalFileName && currentFileName) {
        args.jobLog('Parse failed for original filename, trying current filename');
        fileInfo = await parseContent(args, config, currentFileName);
      }
    }

    // Set variables if content was found
    if (fileInfo.id !== NOT_FOUND_ID && fileInfo.type !== 'unknown') {
      args.jobLog(`Successfully found content with ID: ${fileInfo.id}`);
      await setVariables(args, fileInfo);

      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
      };
    }

    args.jobLog(`${config.name} does not know this file`);
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    args.jobLog(`Plugin execution failed: ${errorMessage}`);

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }
};

export { details, plugin };
