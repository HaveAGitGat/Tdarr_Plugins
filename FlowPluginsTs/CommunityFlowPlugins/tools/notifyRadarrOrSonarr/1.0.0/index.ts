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
      tooltip: 'Continue to next plugin',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key } = args.inputs;
  const arr_host = String(args.inputs.arr_host).trim();

  const fileName = args.originalLibraryFile?.meta?.FileName || '';

  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': arr_api_key,
    Accept: 'application/json',
  };

  args.jobLog('Going to force scan');

  if (arr === 'radarr') {
    args.jobLog('Refreshing Radarr...');

    const requestConfig = {
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
      headers,
    };

    const res = await args.deps.axios(requestConfig);
    const { movieId } = res.data.movie.movieFile;

    const requestConfig2 = {
      method: 'post',
      url: `${arrHost}/api/v3/command`,
      headers,
      data: JSON.stringify({
        name: 'RefreshMovie',
        movieIds: [movieId],
      }),
    };

    await args.deps.axios(requestConfig2);

    args.jobLog(`✔ Refreshed movie ${movieId} in Radarr.`);
  } else if (arr === 'sonarr') {
    args.jobLog('Refreshing Sonarr...');

    const requestConfig = {
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
      headers,
    };

    const res = await args.deps.axios(requestConfig);
    const seriesId = res.data.series.id;

    const requestConfig2 = {
      method: 'post',
      url: `${arrHost}/api/v3/command`,
      headers,
      data: JSON.stringify({
        name: 'RefreshSeries',
        seriesId,
      }),
    };

    await args.deps.axios(requestConfig2);

    args.jobLog(`✔ Refreshed series ${seriesId} in Sonarr.`);
  } else {
    args.jobLog('No arr specified in plugin inputs.');
  }

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
