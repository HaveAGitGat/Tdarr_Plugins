import { promises as fsp } from 'fs';
import { getContainer, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Copy to Working Directory',
  description: 'Copy the working file to the working directory of the Tdarr worker. '
  + 'Useful if you want to copy the file to the library cache before transcoding begins',
  style: {
    borderColor: 'green',
  },
  tags: '',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [],
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

  const originalFileName = getFileName(args.inputFileObj._id);
  const newContainer = getContainer(args.inputFileObj._id);

  const outputPath = args.workDir;

  const ouputFilePath = normJoinPath({
    upath: args.deps.upath,
    paths: [
      outputPath,
      `${originalFileName}.${newContainer}`,
    ],
  });

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
