import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer, getFileName, getSubStem,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Move To Directory',
  description: 'Move working file to directory.',
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
      tooltip: `
      
Specify whether to keep the relative path.

For example:

\\n Source folder:
\\n C:/input/

\\n Source file:
\\n C:/input/test1/test2/qsv_h264.mkv

\\n Move to Directory Output Directory
\\n C:/output/

\\n Keep Relative Path disabled:
\\n C:/output/qsv_h264.mkv

\\n Keep Relative Path enabled:
\\n C:/output/test1/test2/qsv_h264.mkv

      `,
    },
    {
      label: 'Keep Original As Library File',
      name: 'keepOriginalAsLibraryFile',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'When enabled, after the move the original library file is handed back to Tdarr instead of the'
        + ' moved file, if the original still exists. Use it as the last plugin of a flow that keeps the source and'
        + ' moves the output outside the library folder: otherwise the next scan drops the moved file from the'
        + ' library and queues the original again as a new file. The job then reports no size change.',
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

  const {
    keepRelativePath,
    keepOriginalAsLibraryFile,
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

  args.jobLog(`Input path: ${args.inputFileObj._id}`);
  args.jobLog(`Output path: ${ouputFilePath}`);

  if (args.inputFileObj._id === ouputFilePath) {
    args.jobLog('Input and output path are the same, skipping move.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.deps.fsextra.ensureDirSync(outputPath);

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: args.inputFileObj._id,
    destinationPath: ouputFilePath,
    args,
    requireSourceDeletion: true,
  });

  if (keepOriginalAsLibraryFile && args.deps.fsextra.existsSync(args.originalLibraryFile._id)) {
    args.jobLog(`Keeping original as library file: ${args.originalLibraryFile._id}`);

    return {
      outputFileObj: {
        _id: args.originalLibraryFile._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  return {
    outputFileObj: {
      _id: ouputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
