import { promises as fsp } from 'fs';
import {
  getContainer, getFileAbosluteDir, getSubStem,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';
import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Copy/Move Folder Content',
  description: `Copy or move folder content to another folder. 
Does not apply to the current file being processed (either the original or working file).
Useful if, for example, you want to move things like subtitle files or cover art to a new folder.`,
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
      label: 'Source Directory',
      name: 'sourceDirectory',
      type: 'string',
      defaultValue: 'originalDirectory',
      inputUI: {
        type: 'dropdown',
        options: [
          'originalDirectory',
          'workingDirectory',
        ],
      },
      tooltip: 'Specify the source location of where files will be copied/moved from',
    },
    {
      label: 'Copy or Move',
      name: 'copyOrMove',
      type: 'string',
      defaultValue: 'copy',
      inputUI: {
        type: 'dropdown',
        options: [
          'copy',
          'move',
        ],
      },
      tooltip: 'Specify whether to copy or move the files',
    },
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
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to keep the relative path',
    },
    {
      label: 'All Files?',
      name: 'allFiles',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: `Specify whether to copy/move all files in the directory (excluding the original and working file)
       or use the input below to specify file extensions`,
    },
    {
      label: 'File Extensions',
      name: 'fileExtensions',
      type: 'string',
      defaultValue: 'srt,ass',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'allFiles',
                  value: 'false',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify a comma separated list of file extensions to copy/move',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const doOperation = async ({
  args,
  sourcePath,
  destinationPath,
  operation,
}:{
  args: IpluginInputArgs,
  sourcePath:string,
  destinationPath:string,
  operation: 'copy' | 'move',
}) => {
  args.jobLog(`Input path: ${sourcePath}`);
  args.jobLog(`Output path: ${destinationPath}`);

  if (sourcePath === destinationPath) {
    args.jobLog(`Input and output path are the same, skipping ${operation}`);
  } else {
    args.deps.fsextra.ensureDirSync(getFileAbosluteDir(destinationPath));

    await fileMoveOrCopy({
      operation,
      sourcePath,
      destinationPath,
      args,
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const {
    keepRelativePath,
    allFiles,
  } = args.inputs;

  const sourceDirectory = String(args.inputs.sourceDirectory);
  const outputDirectory = String(args.inputs.outputDirectory);
  const copyOrMove = String(args.inputs.copyOrMove);
  const fileExtensions = String(args.inputs.fileExtensions).split(',').map((row) => row.trim());

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

  let sourceDir = getFileAbosluteDir(args.originalLibraryFile._id);

  if (sourceDirectory === 'workingDirectory') {
    sourceDir = getFileAbosluteDir(args.inputFileObj._id);
  }

  let filesInDir = (await fsp.readdir(sourceDir))
    .map((row) => ({
      source: `${sourceDir}/${row}`,
      destination: normJoinPath({
        upath: args.deps.upath,
        paths: [
          outputPath,
          row,
        ],
      }),
    }))
    .filter((row) => row.source !== args.originalLibraryFile._id && row.source !== args.inputFileObj._id);

  if (!allFiles) {
    filesInDir = filesInDir.filter((row) => fileExtensions.includes(getContainer(row.source)));
  }

  for (let i = 0; i < filesInDir.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await doOperation({
      args,
      sourcePath: filesInDir[i].source,
      destinationPath: filesInDir[i].destination,
      operation: copyOrMove as 'copy' | 'move',
    });
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
