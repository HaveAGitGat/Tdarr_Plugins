import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Run CLI',
  description: 'Choose a CLI and custom arguments to run',
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
      label: 'CLI',
      name: 'cli',
      type: 'string',
      defaultValue: 'mkvmerge',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkvmerge',
          'mkvpropedit',
        ],
      },
      tooltip: 'CLI to run',
    },

    {
      label: 'CLI Arguments',
      name: 'cliArguments',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '-o "${outputFilePath}" "{{{args.inputFileObj._id}}}"',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify arguments to pass to the CLI. 
      Normal variable templating with {{{}}} applies but \${outputFilePath} is a special
      variable for an output file in the Tdarr cache directory.

      \\nExample\\n
      -o "\${outputFilePath}" "{{{args.inputFileObj._id}}}"
      `,
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

  let selectedCli = String(args.inputs.cli);
  let cliArguments = String(args.inputs.cliArguments);

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}`
  + `.${getContainer(args.inputFileObj._id)}`;

  cliArguments = cliArguments.replace(/\${outputFilePath}/g, outputFilePath);

  const cliArgs = [
    ...args.deps.parseArgsStringToArgv(cliArguments, '', ''),
  ];

  const availableCli:{
    [index: string]: string;
  } = {
    mkvpropedit: args.mkvpropeditPath,
    mkvmerge: 'mkvmerge',
  };

  if (!availableCli[selectedCli]) {
    const msg = `CLI ${selectedCli} not available to run in this plugin`;
    args.jobLog(msg);
    throw new Error(msg);
  }

  selectedCli = availableCli[selectedCli];

  const cli = new CLI({
    cli: selectedCli,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    const msg = `Running ${selectedCli} failed`;
    args.jobLog(msg);
    throw new Error(msg);
  }

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
