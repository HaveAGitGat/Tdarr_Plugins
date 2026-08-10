import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change',
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
    buildRefreshResquestData: (id: number) => string
  }
}

const getId = async (
    args: IpluginInputArgs,
    arrApp: IArrApp,
    fileName: string,
): Promise<number> => {
  // Helper to log axios errors without killing the flow
  const logAxiosErr = (label: string, e: any) => {
    args.jobLog(`${label} failed: ${String(e?.message ?? e)}`);
  };

  // 1) Existing behavior: try IMDb in fileName
  // Tightened to title IDs only (tt########)
  const imdbId = /\btt\d{7,10}\b/i.exec(fileName)?.at(0) ?? '';
  if (imdbId) {
    try {
      const lookupUrl = `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`;
      const res = await args.deps.axios({
        method: 'get',
        url: lookupUrl,
        headers: arrApp.headers,
        timeout: 15000,
      });

      const id = Number(res.data?.at(0)?.id ?? -1);
      args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for imdb '${imdbId}'`);
      if (id !== -1) return id;
    } catch (e: any) {
      logAxiosErr(`${arrApp.content} lookup by imdb '${imdbId}'`, e);
    }
  } else {
    args.jobLog(`${arrApp.content} not found for imdb ''`);
  }

  // 2) Radarr fallback — tmdb-##### tag in folder/file path
  // Example folder: "Movie Name (1992) [tmdb-812]"
  if (arrApp.name === 'radarr') {
    const tmdbIdStr = /tmdb-(\d+)/i.exec(fileName)?.[1] ?? '';
    if (tmdbIdStr) {
      try {
        const url = `${arrApp.host}/api/v3/movie/lookup/tmdb?tmdbId=${encodeURIComponent(tmdbIdStr)}`;
        const res = await args.deps.axios({
          method: 'get',
          url,
          headers: arrApp.headers,
          timeout: 15000,
        });

        // movie/lookup/tmdb returns a single object
        const id = Number(res.data?.id ?? -1);
        args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for tmdb '${tmdbIdStr}'`);
        if (id !== -1) return id;
      } catch (e: any) {
        logAxiosErr(`${arrApp.content} lookup by tmdb '${tmdbIdStr}'`, e);
      }
    }
  }

  // 3) Sonarr fallback — tvdb-##### tag in folder/file path
  // Example folder: "Show Name (2019) [tvdb-12345]"
  if (arrApp.name === 'sonarr') {
    const tvdbIdStr = /tvdb-(\d+)/i.exec(fileName)?.[1] ?? '';
    if (tvdbIdStr) {
      try {
        // Prefer querying existing series by tvdbId (doesn't rely on skyhook search)
        const url = `${arrApp.host}/api/v3/series?tvdbId=${encodeURIComponent(tvdbIdStr)}`;
        const res = await args.deps.axios({
          method: 'get',
          url,
          headers: arrApp.headers,
          timeout: 15000,
        });

        // series?tvdbId returns an array
        const id = Number(res.data?.at(0)?.id ?? -1);
        args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for tvdb '${tvdbIdStr}'`);
        if (id !== -1) return id;
      } catch (e: any) {
        logAxiosErr(`${arrApp.content} lookup by tvdb '${tvdbIdStr}'`, e);
      }
    }
  }

  // 4) Existing behavior: fall back to /parse?title=...
  const parsedTitle = getFileName(fileName);
  try {
    const title = encodeURIComponent(parsedTitle);
    const parseRes = await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/parse?title=${title}`,
      headers: arrApp.headers,
      timeout: 15000,
    });

    const id = arrApp.delegates.getIdFromParseResponse(parseRes);
    args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for '${parsedTitle}'`);
    return id;
  } catch (e: any) {
    logAxiosErr(`${arrApp.content} parse '${parsedTitle}'`, e);
    return -1;
  }
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Variables initialization
  let refreshed = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
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
          buildRefreshResquestData:
              (id) => JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }),
        },
      }
      : {
        name: arr,
        host: arrHost,
        headers,
        content: 'Series',
        delegates: {
          getIdFromParseResponse:
              (parseResponse: IParseResponse) => Number(parseResponse?.data?.series?.id ?? -1),
          buildRefreshResquestData:
              (id) => JSON.stringify({ name: 'RefreshSeries', seriesId: id }),
        },
      };

  args.jobLog('Going to force scan');
  args.jobLog(`Refreshing ${arrApp.name}...`);

  let id = await getId(args, arrApp, originalFileName);
  // Useful in some edge cases
  if (id === -1 && currentFileName !== originalFileName) {
    id = await getId(args, arrApp, currentFileName);
  }

  // Checking that the file has been found
  if (id !== -1) {
    try {
      // Using command endpoint to queue a refresh task
      await args.deps.axios({
        method: 'post',
        url: `${arrApp.host}/api/v3/command`,
        headers,
        data: arrApp.delegates.buildRefreshResquestData(id),
        timeout: 15000,
      });

      refreshed = true;
      args.jobLog(`✔ ${arrApp.content} '${id}' refreshed in ${arrApp.name}.`);
    } catch (e: any) {
      args.jobLog(`[-error-] ${arrApp.content} refresh command failed for id '${id}' in ${arrApp.name}: ${String(e?.message ?? e)}`);
      refreshed = false;
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
