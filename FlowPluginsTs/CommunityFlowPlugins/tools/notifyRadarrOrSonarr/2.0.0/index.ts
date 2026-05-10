import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change. '
    + 'Waits for the scan to complete before continuing.',
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

interface ICommandResponse {
  data: {
    id: number,
    status: string,
  },
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

const getId = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
)
  : Promise<number> => {
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.at(0) ?? '';
  let id = (imdbId !== '')
    ? Number((await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
      headers: arrApp.headers,
    })).data?.at(0)?.id ?? -1)
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
      content: 'Serie',
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
    // Using command endpoint to queue a refresh task
    const commandResponse: ICommandResponse = await args.deps.axios({
      method: 'post',
      url: `${arrApp.host}/api/v3/command`,
      headers,
      data: arrApp.delegates.buildRefreshResquestData(id),
    });

    const commandId = commandResponse.data.id;
    args.jobLog(`${arrApp.content} '${id}' refresh queued in ${arrApp.name} (command ${commandId}).`);

    const completed = await waitForCommand(args, arrApp, commandId);
    if (completed) {
      refreshed = true;
      args.jobLog(`✔ ${arrApp.content} '${id}' scan completed in ${arrApp.name}.`);
    } else {
      args.jobLog(`⚠ ${arrApp.content} '${id}' scan did not complete within timeout.`);
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
