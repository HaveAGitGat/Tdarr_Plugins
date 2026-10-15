import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change. '
    + 'Waits for the scan to complete before continuing. Optionally unmonitor the item afterwards.',
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
    {
      label: 'Unmonitor after refresh',
      name: 'unmonitor_after_refresh',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'If enabled: unmonitor the movie (Radarr) or episode (Sonarr) after refreshing.',
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
interface IParseResponse {
  data: {
    movie?: { id: number },
    series?: { id: number },
  },
}
interface IArrApp {
  name: string,
  host: string,
  headers: IHTTPHeaders,
  content: string,
  delegates: {
    getIdFromParseResponse: (parseResponse: IParseResponse) => number,
    buildRefreshRequestData: (id: number) => string,
  }
}

interface ICommandResponse {
  data: {
    id: number,
    status: string,
  },
}

interface IEpisode {
  id: number,
  seasonNumber: number,
  episodeNumber: number,
}

const POLL_INTERVAL_SECONDS = 5;
const TIMEOUT_SECONDS = 120;

const waitForCommand = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  commandId: number,
): Promise<boolean> => {
  const startTime = Date.now();
  const timeoutMs = TIMEOUT_SECONDS * 1000;
  const pollIntervalMs = POLL_INTERVAL_SECONDS * 1000;

  args.jobLog(`Waiting for command ${commandId} to complete (timeout: ${TIMEOUT_SECONDS}s)...`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      args.jobLog(`Command ${commandId} timed out after ${TIMEOUT_SECONDS}s.`);
      return false;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });

    // eslint-disable-next-line no-await-in-loop
    const res: ICommandResponse = await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/command/${commandId}`,
      headers: arrApp.headers,
    });

    const { status } = res.data;
    args.jobLog(`Command ${commandId} status: ${status}`);

    if (status === 'completed') {
      return true;
    }

    if (status === 'failed' || status === 'aborted' || status === 'cancelled') {
      args.jobLog(`Command ${commandId} ended with status: ${status}`);
      return false;
    }
  }
};

// Plex-style {tmdb-1234} (Radarr) / {tvdb-1234} (Sonarr) tag, else an imdb id anywhere in the path
// (which also covers {imdb-tt1234567}); '' means fall back to the parse API.
const getLookupTerm = (arrName: string, fileName: string): string => {
  const db = arrName === 'radarr' ? 'tmdb' : 'tvdb';
  const dbId = new RegExp(`\\{${db}-(\\d+)\\}`, 'i').exec(fileName)?.[1];
  if (dbId) {
    return `${db}:${dbId}`;
  }
  const imdbId = /\b(?:tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.[0];
  return imdbId ? `imdb:${imdbId}` : '';
};

const getId = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
): Promise<number> => {
  const term = getLookupTerm(arrApp.name, fileName);
  let id = (term !== '')
    ? Number((await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=${term}`,
      headers: arrApp.headers,
    })).data?.[0]?.id ?? -1)
    : -1;
  args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for '${term}'`);
  if (id === -1) {
    id = arrApp.delegates.getIdFromParseResponse(
      (await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
        headers: arrApp.headers,
      })),
    );
    args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for '${getFileName(fileName)}'`);
  }
  return id;
};

const unmonitorRadarr = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  movieId: number,
): Promise<void> => {
  // Editor endpoint only changes the monitored flag, avoiding a full-object PUT
  await args.deps.axios({
    method: 'put',
    url: `${arrApp.host}/api/v3/movie/editor`,
    headers: arrApp.headers,
    data: JSON.stringify({ movieIds: [movieId], monitored: false }),
  });
  args.jobLog(`✔ Radarr: movie id=${movieId} unmonitored`);
};

const unmonitorSonarrEpisode = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  seriesId: number,
  filePath: string,
): Promise<void> => {
  const sxe = /S(\d{1,2})E(\d{1,3})/i.exec(getFileName(filePath));
  if (!sxe) {
    args.jobLog(`Sonarr: cannot unmonitor – SxxEyy not detected in "${getFileName(filePath)}"`);
    return;
  }
  const season = Number(sxe[1]);
  const episode = Number(sxe[2]);

  const { data: episodes }: { data: IEpisode[] } = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/episode`,
    headers: arrApp.headers,
    params: { seriesId },
  });
  const match = episodes.find((e) => e.seasonNumber === season && e.episodeNumber === episode);
  if (!match) {
    args.jobLog(`Sonarr: episode S${season}E${episode} not found in seriesId ${seriesId}`);
    return;
  }

  await args.deps.axios({
    method: 'put',
    url: `${arrApp.host}/api/v3/episode/monitor`,
    headers: arrApp.headers,
    data: JSON.stringify({ monitored: false, episodeIds: [match.id] }),
  });
  args.jobLog(`✔ Sonarr: unmonitored S${season}E${episode} (episodeId=${match.id})`);
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let refreshed = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host);
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const unmonitorAfterRefresh = Boolean(args.inputs.unmonitor_after_refresh);
  const originalFileName = args.originalLibraryFile?._id ?? '';
  const currentFileName = args.inputFileObj?._id ?? '';
  const headers: IHTTPHeaders = {
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
        getIdFromParseResponse:
          (parseResponse: IParseResponse) => Number(parseResponse?.data?.movie?.id ?? -1),
        buildRefreshRequestData:
          (id) => JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }),
      },
    }
    : {
      name: arr,
      host: arrHost,
      headers,
      content: 'Serie',
      delegates: {
        getIdFromParseResponse:
          (parseResponse: IParseResponse) => Number(parseResponse?.data?.series?.id ?? -1),
        buildRefreshRequestData:
          (id) => JSON.stringify({ name: 'RefreshSeries', seriesId: id }),
      },
    };

  args.jobLog('Going to force scan');
  args.jobLog(`Refreshing ${arrApp.name}...`);

  let id = await getId(args, arrApp, originalFileName);
  if (id === -1 && currentFileName !== originalFileName) {
    id = await getId(args, arrApp, currentFileName);
  }

  if (id !== -1) {
    const commandResponse: ICommandResponse = await args.deps.axios({
      method: 'post',
      url: `${arrApp.host}/api/v3/command`,
      headers,
      data: arrApp.delegates.buildRefreshRequestData(id),
    });

    const commandId = commandResponse.data.id;
    args.jobLog(`${arrApp.content} '${id}' refresh queued in ${arrApp.name} (command ${commandId}).`);

    refreshed = await waitForCommand(args, arrApp, commandId);
    if (!refreshed) {
      args.jobLog(`⚠ ${arrApp.content} '${id}' scan did not complete within timeout.`);
    } else {
      args.jobLog(`✔ ${arrApp.content} '${id}' scan completed in ${arrApp.name}.`);

      if (unmonitorAfterRefresh) {
        try {
          if (arr === 'radarr') {
            await unmonitorRadarr(args, arrApp, id);
          } else {
            await unmonitorSonarrEpisode(args, arrApp, id, originalFileName || currentFileName);
          }
        } catch (e) {
          args.jobLog(`Unmonitor error (non-fatal): ${(e as Error)?.message || String(e)}`);
        }
      }
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: refreshed ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
