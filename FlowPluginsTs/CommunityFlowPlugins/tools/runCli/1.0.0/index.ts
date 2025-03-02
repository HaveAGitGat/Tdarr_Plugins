import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
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
      label: 'Use Custom CLI Path?',
      name: 'useCustomCliPath',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to use a custom CLI path',
    },
    {
      label: 'CLI',
      name: 'userCli',
      type: 'string',
      defaultValue: 'mkvmerge',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkvmerge',
          'mkvpropedit',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useCustomCliPath',
                  value: 'false',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'CLI to run',
    },
    {
      label: 'Custom CLI Path',
      name: 'customCliPath',
      type: 'string',
      defaultValue: '/usr/bin/mkvmerge',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useCustomCliPath',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the path to the CLI to run',
    },
    {
      label: 'Does Command Create Output File?',
      name: 'doesCommandCreateOutputFile',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle this on if the command creates an output file.',
    },
    {
      label: 'Output File Path',
      name: 'userOutputFilePath',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '${cacheDir}/${fileName}.{{{args.inputFileObj.container}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'doesCommandCreateOutputFile',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
      This path can be accessed using \${outputFilePath} in the "CLI Arguments" input below.

      \\n
      \${cacheDir} is a special variable that points to the Tdarr worker cache directory.

      \\n 
      \${fileName} is a special variable for the filename without extension.
      
      \\nExample\\n
      \${cacheDir}/\${fileName}.{{{args.inputFileObj.container}}}
      `,
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
      variable from the "Output File Path" input above.

      \\nExample\\n
      -o "\${outputFilePath}" "{{{args.inputFileObj._id}}}"
      `,
    },

    {
      label: 'Output File Becomes Working File?',
      name: 'outputFileBecomesWorkingFile',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'doesCommandCreateOutputFile',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Toggle this on to make the output file become the working file for the next plugin.',
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

  const userCli = String(args.inputs.userCli);
  const { useCustomCliPath } = args.inputs;
  const customCliPath = String(args.inputs.customCliPath);
  let cliPath = '';

  const {
    outputFileBecomesWorkingFile,
  } = args.inputs;
  let userOutputFilePath = String(args.inputs.userOutputFilePath);
  let cliArguments = String(args.inputs.cliArguments);

  // eslint-disable-next-line no-template-curly-in-string
  if (cliArguments.includes('${outputFilePath}')) {
    // eslint-disable-next-line no-template-curly-in-string
    if (userOutputFilePath.includes('${cacheDir}')) {
      const cacheDir = getPluginWorkDir(args);
      userOutputFilePath = userOutputFilePath.replace(/\${cacheDir}/g, cacheDir);
    }

    // eslint-disable-next-line no-template-curly-in-string
    if (userOutputFilePath.includes('${fileName}')) {
      const fileName = getFileName(args.inputFileObj._id);
      userOutputFilePath = userOutputFilePath.replace(/\${fileName}/g, fileName);
    }

    cliArguments = cliArguments.replace(/\${outputFilePath}/g, userOutputFilePath);
  }

  const cliArgs = [
    ...args.deps.parseArgsStringToArgv(cliArguments, '', ''),
  ];

  const availableCli:{
    [index: string]: string;
  } = {
    mkvpropedit: args.mkvpropeditPath,
    mkvmerge: 'mkvmerge',
  };

  if (useCustomCliPath) {
    cliPath = customCliPath;
  } else {
    if (!availableCli[userCli]) {
      const msg = `CLI ${userCli} not available to run in this plugin`;
      args.jobLog(msg);
      throw new Error(msg);
    }

    cliPath = availableCli[userCli];
  }

  const cli = new CLI({
    cli: cliPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: userOutputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    const msg = `Running ${cliPath} failed`;
    args.jobLog(msg);
    throw new Error(msg);
  }

  return {
    outputFileObj: outputFileBecomesWorkingFile ? {
      _id: userOutputFilePath,
    }
      : args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
