import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Pause/Unpause Node(s)',
  description: `
  Pause/Unpause all nodes or the current node
  `,
  style: {
    borderColor: 'yellow',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faHand',
  inputs: [
    {
      label: 'Pause?',
      name: 'pause',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to pause or unpause',
    },
    {
      label: 'Target',
      name: 'target',
      type: 'string',
      defaultValue: 'allNodes',
      inputUI: {
        type: 'dropdown',
        options: [
          'allNodes',
          'currentNode',
        ],
      },
      tooltip: 'Pause/unpause all nodes or just the current node',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const pause = Boolean(args.inputs.pause);
  const target = String(args.inputs.target);

  if (target === 'currentNode') {
    const {
      serverURL,
      apiKey,
      nodeID,
    } = args.configVars.config;
    const normalizedServerURL = serverURL.replace(/\/+$/, '');

    args.jobLog(`${pause ? 'Pausing' : 'Unpausing'} current node`);
    await args.deps.axios({
      method: 'post',
      url: `${normalizedServerURL}/api/v2/update-node`,
      headers: {
        'x-api-key': apiKey,
      },
      data: {
        data: {
          nodeID,
          nodeUpdates: {
            nodePaused: pause,
          },
        },
      },
    });
    args.jobLog(`Node ${pause ? 'paused' : 'unpaused'}`);
  } else {
    await args.deps.crudTransDBN('SettingsGlobalJSONDB', 'update', 'globalsettings', {
      pauseAllNodes: pause,
    });
    args.jobLog(`${pause ? 'Paused' : 'Unpaused'} all nodes`);
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
