import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Apprise',
  description: 'Use Apprise to send notifications.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.18.01',
  sidebarPosition: -1,
  icon: 'faBell',
  inputs: [
    {
      label: 'Command',
      name: 'command',
      type: 'string',
      defaultValue: '-vv -t "Success" -b "File {{{args.inputFileObj._id}}}" "discord://xxx/xxxx"',
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
      },
      tooltip: `Visit the following for more information on Apprise: https://github.com/caronc/apprise
      \\nExample\\n
     -vv -t "Success" -b "File {{{args.inputFileObj._id}}}" "discord://xxx/xxxx"


     \\nExample\\n
     -vv -t "Processing" -b "File {{{args.inputFileObj._id}}}" `

     + `"discord://{{{args.userVariables.global.discord_webhook}}}"
      `,
    },
    {
      label: 'Apprise Path',
      name: 'apprisePath',
      type: 'string',
      defaultValue: 'apprise',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the path to the Apprise executable.'
      + 'If the path is not specified, the plugin will use the default path.',
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
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const command = String(args.inputs.command);
  const apprisePath = String(args.inputs.apprisePath).trim();

  const cliArgs = [
    ...args.deps.parseArgsStringToArgv(command, '', ''),
  ];

  const cli = new CLI({
    cli: apprisePath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '',
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog('Running Apprise failed');
    throw new Error('Running Apprise failed');
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
