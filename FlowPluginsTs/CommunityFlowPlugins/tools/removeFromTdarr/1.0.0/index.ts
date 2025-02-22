import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Remove From Tdarr',
  description: `
  If this plugin is executed, then when the flow ends, the item will be 
  removed from the Tdarr database and won't appear in Transcode Success or Error tables on the 'Tdarr' tab.
  Use the 'Delete File' plugin if you would like to delete the file from disk.
  `,
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.31.01',
  sidebarPosition: -1,
  icon: 'faTrash',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  // eslint-disable-next-line no-param-reassign
  args.variables.removeFromTdarr = true;

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
