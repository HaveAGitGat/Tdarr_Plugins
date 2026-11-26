import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Fail Flow',
  description: 'Force the flow to fail and be move to the error table',
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faExclamationTriangle',
  inputs: [
    {
      label: 'Reason',
      name: 'reason',
      type: 'string',
      defaultValue: 'Forcing flow to fail!',
      inputUI: {
        type: 'text',
      },
      tooltip: `The error to fail the flow with. It's shown in the job report and in the
      Error Reason column of the Transcode: Error/Cancelled table, after this plugin's name.

      \\nExample\\n
      Video is longer than 2 hours

      \\nExample\\n
      Duration is {{{args.inputFileObj.ffProbeData.format.duration}}} seconds`,
    },
  ],
  outputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  throw new Error(String(args.inputs.reason));

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
