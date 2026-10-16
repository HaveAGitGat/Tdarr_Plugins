import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Rename File',
  description: 'Rename a file',
  style: {
    borderColor: 'green',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'File Name Match',
      name: 'fileMatch',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '.+',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify regex match pattern for replacing e.g. ".+" or "test_(${inputFileName}).mkv"\n\n'
      + 'Available variables are inputFileName, inputFileContainer, originalFileName, originalFileContainer, '
      + 'and args (see https://docs.tdarr.io/docs/plugins/flow-plugins/basics).',
    },
    {
      label: 'File Name Replace',
      name: 'fileReplace',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '${inputFileName}_${args.inputFileObj.video_resolution}.${inputFileContainer}',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify regex replace pattern e.g.'
      // eslint-disable-next-line no-template-curly-in-string
      + '$1_${args.inputFileObj.video_resolution}.${inputFileContainer}\n\n'
      + 'Available variables are inputFileName, inputFileContainer, originalFileName, originalFileContainer, '
      + 'and args (see https://docs.tdarr.io/docs/plugins/flow-plugins/basics).',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const replaceVariables = (input: string, args: IpluginInputArgs, escape: boolean): string => {
  const _ = args.deps.lodash;
  const values = {
    args,
    inputFileName: getFileName(args.inputFileObj._id),
    inputFileContainer: getContainer(args.inputFileObj._id),
    originalFileName: getFileName(args.originalLibraryFile._id),
    originalFileContainer: getContainer(args.originalLibraryFile._id),
  };
  return input.match(/\${[^}]+}/g)?.reduce((output, match) => {
    const objPath = match.slice(2, -1).trim();
    const value = String(_.get(values, objPath));
    return output.replace(match, escape ? _.escapeRegExp(value) : value);
  }, input) || input;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const match = replaceVariables(String(args.inputs.fileMatch).trim(), args, true);
  const replace = replaceVariables(String(args.inputs.fileReplace).trim(), args, false);

  args.jobLog(`File: '${args?.inputFileObj?._id?.split('/')?.pop()}'`);
  args.jobLog(`Match: '${match}'`);
  args.jobLog(`Replace: '${replace}'`);

  const newName = args?.inputFileObj?._id?.split('/')?.pop()?.replace(new RegExp(match, 'ig'), replace) || '';

  const fileDir = getFileAbosluteDir(args.inputFileObj._id);
  const newPath = `${fileDir}/${newName}`;

  if (args.inputFileObj._id === newPath) {
    args.jobLog('Input and output path are the same, skipping rename.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: args.inputFileObj._id,
    destinationPath: newPath,
    args,
  });

  return {
    outputFileObj: {
      _id: newPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
