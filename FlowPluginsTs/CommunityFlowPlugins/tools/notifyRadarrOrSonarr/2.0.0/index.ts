import path from 'path';
import { getFileAbosluteDir, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
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
interface IParsedRequestResult {
  data: {
    movie?: { id: number },
    series?: { id: number },
  },
}
interface IRefreshDelegates {
  getIdFromParseResponse: (parseRequestResult: IParsedRequestResult) => number,
  buildRefreshResquestData: (id: number) => string
}
interface IRefreshType {
  appName: string,
  content: string,
  delegates: IRefreshDelegates
}

const getId = async (
  args: IpluginInputArgs,
  arr: string,
  arrHost: string, headers: IHTTPHeaders,
  fileName: string,
  refreshType: IRefreshType,
)
  : Promise<number> => {
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)?.at(0) ?? '';
  let id = (imdbId !== '')
    ? Number(
      (await args.deps.axios({
        method: 'get',
        url: `${arrHost}/api/v3/${arr === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
        headers,
      })).data?.id ?? -1,
    )
    : -1;
  args.jobLog(`${refreshType.content} ${id !== -1 ? `${id} found` : 'not found'} for imdb '${imdbId}'`);
  if (id === -1) {
    id = refreshType.delegates.getIdFromParseResponse(
      (await args.deps.axios({
        method: 'get',
        url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
        headers,
      })),
    );
  }
  args.jobLog(`${refreshType.content} ${id !== -1 ? `${id} found` : 'not found'} for '${getFileName(fileName)}'`);
  return id;
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
  const absoluteFileDir = getFileAbosluteDir(args.originalLibraryFile?._id ?? '');
  const fileNames = {
    originalFileName: path.join(absoluteFileDir, getFileName(args.originalLibraryFile?._id ?? '')),
    currentFileName: path.join(absoluteFileDir, getFileName(args.inputFileObj?._id ?? '')),
  };
  const headers: IHTTPHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.arr_api_key),
    Accept: 'application/json',
  };
  const refreshType: IRefreshType = arr === 'radarr'
    ? {
      appName: 'Radarr',
      content: 'Movie',
      delegates: {
        getIdFromParseResponse:
          (parseRequestResult: IParsedRequestResult) => Number(parseRequestResult.data?.movie?.id ?? -1),
        buildRefreshResquestData:
          (id) => JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }),
      },
    }
    : {
      appName: 'Sonarr',
      content: 'Serie',
      delegates: {
        getIdFromParseResponse:
          (parseRequestResult: IParsedRequestResult) => Number(parseRequestResult.data?.series?.id ?? -1),
        buildRefreshResquestData:
          (id) => JSON.stringify({ name: 'RefreshSeries', seriesId: id }),
      },
    };

  args.jobLog('Going to force scan');
  args.jobLog(`Refreshing ${refreshType.appName}...`);

  let id = await getId(args, arr, arrHost, headers, fileNames.originalFileName, refreshType);
  // Useful in some edge cases
  if (id === -1 && fileNames.currentFileName !== fileNames.originalFileName) {
    id = await getId(args, arr, arrHost, headers, fileNames.currentFileName, refreshType);
  }

  // Checking that the file has been found
  if (id !== -1) {
    // Using command endpoint to queue a refresh task
    await args.deps.axios({
      method: 'post',
      url: `${arrHost}/api/v3/command`,
      headers,
      data: refreshType.delegates.buildRefreshResquestData(id),
    });

    refreshed = true;
    args.jobLog(`✔ ${refreshType.content} ${id} refreshed in ${refreshType.appName}.`);
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
