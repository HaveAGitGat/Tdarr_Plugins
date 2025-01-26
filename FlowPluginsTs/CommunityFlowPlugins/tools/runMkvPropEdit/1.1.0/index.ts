import { CLI } from '../../../../FlowHelpers/1.1.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Run MKVPropEdit',
  description: 'Run MKVPropEdit on a file to update metadata which'
  + ' FFmpeg doesn\'t typically update such as stream bitrate.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Use Full Parse Mode',
      name: 'useFullParseMode',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Sets the parse mode. The parameter \'mode\' can either be '
+ '\'fast\' (which is also the default) or \'full\'. The \'fast\' mode does not parse the whole '
+ 'file but uses the meta seek elements for locating the required elements of a source file. '
+ 'In 99% of all cases this is enough. But for files that do not contain meta seek '
+ 'elements or which are damaged the user might have to set the \'full\' parse mode. '
+ 'A full scan of a file can take a couple of minutes while a fast scan only takes seconds.',
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

  let cliArgs;
  if (args.inputs.useFullParseMode === true) {
    args.jobLog('Using full parse mode for MKVPropEdit');
    cliArgs = ['--parse-mode', 'full', '--add-track-statistics-tags', args.inputFileObj._id,
    ];
  } else {
    args.jobLog('Using fast parse mode for MKVPropEdit');
    cliArgs = ['--add-track-statistics-tags', args.inputFileObj._id,
    ];
  }
  args.jobLog(`cliArgs = ${cliArgs}`);

  const cli = new CLI({
    cli: args.mkvpropeditPath,
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
    args.jobLog('Running MKVPropEdit failed');
    throw new Error('Running MKVPropEdit failed');
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
