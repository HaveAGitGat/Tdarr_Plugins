import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Changed',
  description: `Check whether the working file has changed from the original library file.
  A file is considered changed when its path or file size differs.`,
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Working file has changed',
    },
    {
      number: 2,
      tooltip: 'Working file has not changed',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const pathChanged = args.inputFileObj._id !== args.originalLibraryFile._id;
  const sizeChanged = args.inputFileObj.file_size !== args.originalLibraryFile.file_size;
  const hasFileChanged = pathChanged || sizeChanged;
  const comparison = {
    workingFile: args.inputFileObj._id,
    originalFile: args.originalLibraryFile._id,
    workingFileSize: args.inputFileObj.file_size,
    originalFileSize: args.originalLibraryFile.file_size,
    pathChanged,
    sizeChanged,
  };

  args.jobLog(hasFileChanged ? 'Working file has changed' : 'Working file has not changed');
  args.jobLog(JSON.stringify(comparison));

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: hasFileChanged ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
