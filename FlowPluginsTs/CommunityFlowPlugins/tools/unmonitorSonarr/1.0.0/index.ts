import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Unmonitor in Sonarr',
  description: 'Unmonitor episode in Sonarr after successful transcode to prevent re-downloading',
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faEyeSlash',
  inputs: [
    {
      label: 'Sonarr API Key',
      name: 'sonarr_api_key',
      type: 'string',
      defaultValue: 'Your-API-Key-Here',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your Sonarr API key here',
    },
    {
      label: 'Sonarr Host',
      name: 'sonarr_host',
      type: 'string',
      defaultValue: 'http://192.168.1.1:8989',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your Sonarr host here.'
        + '\\nExample:\\n'
        + 'http://192.168.1.1:8989\\n'
        + 'https://sonarr.domain.com\\n',
    },
    {
      label: 'Unmonitor Series If No Episodes Remain',
      name: 'unmonitor_series',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Also unmonitor the series if no monitored episodes remain',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Episode unmonitored successfully',
    },
    {
      number: 2,
      tooltip: 'Episode not found or already unmonitored',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}

interface ISeries {
  id: number,
  title: string,
  monitored: boolean,
  path: string
}

interface IEpisode {
  id: number,
  seriesId: number,
  title: string,
  seasonNumber: number,
  episodeNumber: number,
  monitored: boolean,
  hasFile: boolean,
  episodeFile?: {
    id: number,
    path: string
  }
}

interface IParseResponse {
  data: {
    series?: { id: number },
    parsedEpisodeInfo?: {
      episodeNumbers: number[],
      seasonNumber: number
    },
  },
}

interface IEpisodeInfo {
  seriesId: number,
  series?: ISeries,
  episode?: IEpisode,
  seasonNumber: number,
  episodeNumber: number
}

const getEpisodeInfo = async (
  args: IpluginInputArgs,
  host: string,
  headers: IHTTPHeaders,
  fileName: string,
): Promise<IEpisodeInfo> => {
  const info: IEpisodeInfo = { seriesId: -1, seasonNumber: -1, episodeNumber: -1 };

  // First try by IMDB ID
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.at(0) ?? '';
  if (imdbId !== '') {
    try {
      const lookupResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/series/lookup?term=imdb:${imdbId}`,
        headers,
      });
      const series = lookupResponse.data?.at(0);
      if (series) {
        info.seriesId = series.id;
        info.series = series;

        // Extract season and episode from filename
        const seasonEpisodeMatch = /\bS(\d{1,3})E(\d{1,4})\b/i.exec(fileName);
        if (seasonEpisodeMatch) {
          info.seasonNumber = parseInt(seasonEpisodeMatch[1], 10);
          info.episodeNumber = parseInt(seasonEpisodeMatch[2], 10);
        }

        args.jobLog(`Series '${series.title}' (ID: ${series.id}) found for IMDB '${imdbId}'`);
      }
    } catch (error) {
      args.jobLog(`Error looking up IMDB ${imdbId}: ${error}`);
    }
  }

  // If not found by IMDB or missing episode info, try parse API
  if (info.seriesId === -1 || info.seasonNumber === -1 || info.episodeNumber === -1) {
    try {
      const parseResponse: IParseResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
        headers,
      });

      if (parseResponse?.data?.series?.id) {
        info.seriesId = parseResponse.data.series.id;
        info.seasonNumber = parseResponse.data.parsedEpisodeInfo?.seasonNumber ?? 1;
        info.episodeNumber = parseResponse.data.parsedEpisodeInfo?.episodeNumbers?.at(0) ?? 1;

        // Get series details
        const seriesResponse = await args.deps.axios({
          method: 'get',
          url: `${host}/api/v3/series/${info.seriesId}`,
          headers,
        });
        info.series = seriesResponse.data;

        const seriesTitle = info.series?.title ?? 'Unknown';
        const episodeRef = `S${info.seasonNumber}E${info.episodeNumber}`;
        args.jobLog(`Series '${seriesTitle}' found for '${getFileName(fileName)}' - ${episodeRef}`);
      }
    } catch (error) {
      args.jobLog(`Error parsing filename: ${error}`);
    }
  }

  // If still not found, try to find by file path
  if (info.seriesId === -1) {
    try {
      args.jobLog('Attempting to find episode by file path...');

      // Get all series first
      const allSeriesResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/series`,
        headers,
      });

      const allSeries: ISeries[] = allSeriesResponse.data || [];
      const fileDir = fileName.substring(0, fileName.lastIndexOf('/'));

      // Find series by path
      const series = allSeries.find((s: ISeries) => {
        if (!s.path) return false;
        return fileName.startsWith(s.path) || fileDir.startsWith(s.path);
      });

      if (series) {
        info.seriesId = series.id;
        info.series = series;

        // Get all episodes for this series
        const episodesResponse = await args.deps.axios({
          method: 'get',
          url: `${host}/api/v3/episode?seriesId=${series.id}`,
          headers,
        });

        const episodes: IEpisode[] = episodesResponse.data || [];
        const episode = episodes.find((e: IEpisode) => e.hasFile && e.episodeFile?.path === fileName);

        if (episode) {
          info.episode = episode;
          info.seasonNumber = episode.seasonNumber;
          info.episodeNumber = episode.episodeNumber;
          const episodeRef = `S${episode.seasonNumber}E${episode.episodeNumber}`;
          args.jobLog(`Episode found: ${series.title} - ${episodeRef} - ${episode.title}`);
        }
      }
    } catch (error) {
      args.jobLog(`Error searching by file path: ${error}`);
    }
  }

  // If we have series but not the specific episode, try to get it
  if (info.seriesId !== -1 && info.seasonNumber !== -1 && info.episodeNumber !== -1 && !info.episode) {
    try {
      const episodesResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/episode?seriesId=${info.seriesId}&seasonNumber=${info.seasonNumber}`,
        headers,
      });

      const episodes: IEpisode[] = episodesResponse.data || [];
      info.episode = episodes.find((e: IEpisode) => e.episodeNumber === info.episodeNumber);
    } catch (error) {
      args.jobLog(`Error fetching episode details: ${error}`);
    }
  }

  return info;
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Variables initialization
  const sonarr_host = String(args.inputs.sonarr_host).trim();
  const sonarrHost = sonarr_host.endsWith('/') ? sonarr_host.slice(0, -1) : sonarr_host;
  const originalFileName = args.originalLibraryFile?._id ?? '';
  const currentFileName = args.inputFileObj?._id ?? '';
  const unmonitorSeries = Boolean(args.inputs.unmonitor_series);
  const headers: IHTTPHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.sonarr_api_key),
    Accept: 'application/json',
  };

  args.jobLog('Attempting to unmonitor episode in Sonarr');
  args.jobLog(`Checking file: ${currentFileName}`);

  // Get episode info
  let episodeInfo = await getEpisodeInfo(args, sonarrHost, headers, originalFileName);

  // Try with current filename if original didn't work
  if (episodeInfo.seriesId === -1 && currentFileName !== originalFileName) {
    episodeInfo = await getEpisodeInfo(args, sonarrHost, headers, currentFileName);
  }

  // Check if episode was found
  if (episodeInfo.episode && episodeInfo.episode.monitored) {
    try {
      // Unmonitor the episode
      const updatedEpisode = { ...episodeInfo.episode, monitored: false };
      await args.deps.axios({
        method: 'put',
        url: `${sonarrHost}/api/v3/episode/${episodeInfo.episode.id}`,
        headers,
        data: updatedEpisode,
      });

      const episodeTitle = episodeInfo.episode.title;
      const episodeRef = `S${episodeInfo.seasonNumber}E${episodeInfo.episodeNumber}`;
      args.jobLog(`✅ Episode '${episodeTitle}' (${episodeRef}) successfully unmonitored`);

      // Check if we should unmonitor the series
      if (unmonitorSeries && episodeInfo.series) {
        try {
          // Get all episodes for the series
          const allEpisodesResponse = await args.deps.axios({
            method: 'get',
            url: `${sonarrHost}/api/v3/episode?seriesId=${episodeInfo.seriesId}`,
            headers,
          });

          const allEpisodes: IEpisode[] = allEpisodesResponse.data || [];
          const currentEpisodeId = episodeInfo.episode?.id;
          const filteredEpisodes = allEpisodes.filter((e: IEpisode) => {
            const isDifferentEpisode = e.id !== currentEpisodeId;
            return isDifferentEpisode && e.monitored && e.hasFile;
          });
          const remainingMonitored = filteredEpisodes.length;

          if (remainingMonitored === 0 && episodeInfo.series.monitored) {
            // Unmonitor the series
            const updatedSeries = { ...episodeInfo.series, monitored: false };
            await args.deps.axios({
              method: 'put',
              url: `${sonarrHost}/api/v3/series/${episodeInfo.seriesId}`,
              headers,
              data: updatedSeries,
            });

            const seriesTitle = episodeInfo.series.title;
            const message = `✅ Series '${seriesTitle}' also unmonitored (no monitored episodes with files remain)`;
            args.jobLog(message);
          }
        } catch (error) {
          args.jobLog(`Warning: Could not check/unmonitor series: ${error}`);
        }
      }

      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
      };
    } catch (error) {
      args.jobLog(`❌ Error unmonitoring episode: ${error}`);
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 2,
        variables: args.variables,
      };
    }
  } else if (episodeInfo.episode && !episodeInfo.episode.monitored) {
    args.jobLog('Episode is already unmonitored');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog('Episode not found in Sonarr');
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
