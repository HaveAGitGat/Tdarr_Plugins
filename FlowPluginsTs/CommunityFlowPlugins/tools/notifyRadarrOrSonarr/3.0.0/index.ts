import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* -------------- helpers -------------- */
const parseSxxEyy = (fileName: string): { season: number, episode: number } | null => {
  const m = getFileName(fileName).match(/S(\d{1,2})E(\d{1,3})/i);
  return m ? { season: Number(m[1]), episode: Number(m[2]) } : null;
};

/* -------------- plugin details -------------- */
const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description:
    'Notify Radarr or Sonarr to refresh after file change. Optionally unmonitor the item afterwards.',
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

/* -------------- interfaces -------------- */
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

/* -------------- getId (unchanged from 2.0.0) -------------- */
const getId = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
): Promise<number> => {
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.[0] ?? '';
  let id = (imdbId !== '')
    ? Number((await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
      headers: arrApp.headers,
    })).data?.[0]?.id ?? -1)
    : -1;
  args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for imdb '${imdbId}'`);
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

/* -------------- unmonitor helpers -------------- */
const unmonitorRadarr = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  movieId: number,
): Promise<void> => {
  const movie = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/movie/${movieId}`,
    headers: arrApp.headers,
  });
  await args.deps.axios({
    method: 'put',
    url: `${arrApp.host}/api/v3/movie/${movieId}`,
    headers: arrApp.headers,
    data: JSON.stringify({ ...movie.data, monitored: false }),
  });
  args.jobLog(`✔ Radarr: movie id=${movieId} unmonitored`);
};

const unmonitorSonarrEpisode = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  seriesId: number,
  season: number,
  episode: number,
): Promise<void> => {
  const eps = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/episode`,
    headers: arrApp.headers,
    params: { seriesId },
  });

  const match = Array.isArray(eps.data)
    ? eps.data.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => Number(e.seasonNumber) === season && Number(e.episodeNumber) === episode,
    )
    : null;

  if (!match) {
    args.jobLog(`Sonarr: episode S${season}E${episode} not found in seriesId ${seriesId}`);
    return;
  }

  try {
    await args.deps.axios({
      method: 'put',
      url: `${arrApp.host}/api/v3/episode/monitor`,
      headers: arrApp.headers,
      params: { includeImages: false },
      data: JSON.stringify({ monitored: false, episodeIds: [match.id] }),
    });
    args.jobLog(`✔ Sonarr: unmonitored S${season}E${episode} (episodeId=${match.id}) via PUT /episode/monitor`);
    return;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (e as any)?.response?.status;
    if (code !== 405 && code !== 404) throw e;
    args.jobLog(`Sonarr /episode/monitor unsupported (${code}), falling back to PUT /episode`);
  }

  const epFull = await args.deps.axios({
    method: 'get',
    url: `${arrApp.host}/api/v3/episode/${match.id}`,
    headers: arrApp.headers,
  });
  await args.deps.axios({
    method: 'put',
    url: `${arrApp.host}/api/v3/episode`,
    headers: arrApp.headers,
    data: JSON.stringify([{ ...epFull.data, monitored: false }]),
  });
  args.jobLog(`✔ Sonarr: unmonitored S${season}E${episode} (episodeId=${match.id}) via PUT /episode`);
};

/* -------------- main plugin -------------- */
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let refreshed = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const unmonitorAfterRefresh = args.inputs.unmonitor_after_refresh === true
    || args.inputs.unmonitor_after_refresh === 'true';
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
    await args.deps.axios({
      method: 'post',
      url: `${arrApp.host}/api/v3/command`,
      headers,
      data: arrApp.delegates.buildRefreshRequestData(id),
    });
    refreshed = true;
    args.jobLog(`✔ ${arrApp.content} '${id}' refreshed in ${arrApp.name}.`);

    if (unmonitorAfterRefresh) {
      try {
        if (arr === 'radarr') {
          await unmonitorRadarr(args, arrApp, id);
        } else {
          const srcPath = originalFileName || currentFileName;
          const sxe = parseSxxEyy(srcPath);
          if (sxe) {
            await unmonitorSonarrEpisode(args, arrApp, id, sxe.season, sxe.episode);
          } else {
            args.jobLog(`Sonarr: cannot unmonitor – SxxEyy not detected in "${getFileName(srcPath)}"`);
          }
        }
      } catch (e) {
        args.jobLog(`Unmonitor error (non-fatal): ${(e as Error)?.message || String(e)}`);
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
