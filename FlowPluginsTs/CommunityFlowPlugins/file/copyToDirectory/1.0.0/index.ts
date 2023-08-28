import { promises as fs } from 'fs';
import { getContainer, getFileName, getSubStem } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Copy to Directory',
  description: 'Copy the working file to a directory',
  style: {
    borderColor: 'green',
  },
  tags: '',

  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      name: 'outputDirectory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'directory',
      },
      tooltip: 'Specify ouput directory',
    },
    {
      name: 'keepRelativePath',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'text',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify whether to keep the relative path',
    },
    {
      name: 'copyToWorkDir',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'text',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify whether to copy to the working directory',
    },
    {
      name: 'makeWorkingFile',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Make the copied file the working file',
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

  const {
    copyToWorkDir, keepRelativePath, makeWorkingFile,
  } = args.inputs;

  const outputDirectory = String(args.inputs.outputDirectory);

  const originalFileName = getFileName(args.originalLibraryFile._id);
  const newContainer = getContainer(args.inputFileObj._id);

  let outputPath = '';

  if (copyToWorkDir) {
    outputPath = args.workDir;
  } else if (keepRelativePath) {
    const subStem = getSubStem({
      inputPathStem: args.librarySettings.folder,
      inputPath: args.originalLibraryFile._id,
    });

    outputPath = normJoinPath({
      upath: args.deps.upath,
      paths: [
        outputDirectory,
        subStem,
      ],
    });
  } else {
    outputPath = outputDirectory;
  }

  const ouputFilePath = normJoinPath({
    upath: args.deps.upath,
    paths: [
      outputPath,
      `${originalFileName}.${newContainer}`,
    ],
  });

  let workingFile = args.inputFileObj._id;

  if (makeWorkingFile || copyToWorkDir) {
    workingFile = ouputFilePath;
  }

  args.jobLog(`Input path: ${args.inputFileObj._id}`);
  args.jobLog(`Output path: ${outputPath}`);

  args.deps.fsextra.ensureDirSync(outputPath);

  await fs.copyFile(args.inputFileObj._id, ouputFilePath);

  return {
    outputFileObj: {
      _id: workingFile,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
