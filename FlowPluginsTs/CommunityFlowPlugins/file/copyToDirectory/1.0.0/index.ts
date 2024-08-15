import { promises as fsp } from 'fs';
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
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      label: 'Output Directory',
      name: 'outputDirectory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'directory',
      },
      tooltip: 'Specify ouput directory',
    },
    {
      label: 'Keep Relative Path',
      name: 'keepRelativePath',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to keep the relative path',
    },
    {
      label: 'Make Working File',
      name: 'makeWorkingFile',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
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
    keepRelativePath, makeWorkingFile,
  } = args.inputs;

  const outputDirectory = String(args.inputs.outputDirectory);

  const originalFileName = getFileName(args.inputFileObj._id);
  const newContainer = getContainer(args.inputFileObj._id);

  let outputPath = '';

  if (keepRelativePath) {
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

  if (makeWorkingFile) {
    workingFile = ouputFilePath;
  }

  args.jobLog(`Input path: ${args.inputFileObj._id}`);
  args.jobLog(`Output path: ${outputPath}`);

  if (args.inputFileObj._id === ouputFilePath) {
    args.jobLog('Input and output path are the same, skipping copy.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.deps.fsextra.ensureDirSync(outputPath);

  await fsp.copyFile(args.inputFileObj._id, ouputFilePath);

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
