import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change. '
    + 'Has to be used after the "Set Flow Variables From Radarr Or Sonarr" plugin.',
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
interface IArrApp {
  name: string,
  host: string,
  headers: IHTTPHeaders,
  content: string,
  delegates: {
    buildRefreshResquestData: (id: number) => string
  }
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Variables initialization
  let refreshed = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
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
        buildRefreshResquestData:
          (id) => JSON.stringify({ name: 'RefreshSeries', seriesId: id }),
      },
    };

  args.jobLog('Going to force scan');
  args.jobLog(`Refreshing ${arrApp.name}...`);

  const id = Number(args.variables.user.ArrId ?? -1);
  if (id !== -1) {
    // Using command endpoint to queue a refresh task
    await args.deps.axios({
      method: 'post',
      url: `${arrApp.host}/api/v3/command`,
      headers,
      data: arrApp.delegates.buildRefreshResquestData(id),
    });

    refreshed = true;
    args.jobLog(`✔ ${arrApp.content} '${id}' refreshed in ${arrApp.name}.`);
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
