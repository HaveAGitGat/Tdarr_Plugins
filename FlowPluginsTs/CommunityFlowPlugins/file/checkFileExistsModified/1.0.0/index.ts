import fs from 'fs';
import { getContainer, getFileAbosluteDir, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
    name: 'Check File Exists Modified',
    description: 'Check if file exists in the input folder by using the filename as a subfolder and checking if the filename.dates exists in the subfolder',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'File To Check',
      name: 'fileToCheck',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '${fileName}.${container}',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Specify file to check using templating e.g. ${fileName}.${container}',
    },
    {
      label: 'Directory',
      name: 'directory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'directory',
      },
      tooltip: 'Specify directory to check. Leave blank to use working directory.'
      + ' Put below Input File plugin to check original file directory.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File exists',
    },
    {
      number: 2,
      tooltip: 'File does not exist',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const directory = String(args.inputs.directory).trim() || getFileAbosluteDir(args.inputFileObj._id);

  const fileName = getFileName(args.inputFileObj._id);

  let fileToCheck = String(args.inputs.fileToCheck).trim();
  fileToCheck = fileToCheck.replace(/\${fileName}/g, fileName);
    fileToCheck = fileToCheck.replace(/\${container}/g, (0, fileUtils_1.getContainer)(args.inputFileObj._id));
    fileToCheck = path_1.default.join(directory, fileName, fileName + '.dates'); // Construct path to filename.dates

  let fileExists = fs_1.default.existsSync(fileToCheck); // Check if file exists
  if (fs.existsSync(fileToCheck)) {
    fileExists = true;
        args.jobLog("File exists: ".concat(fileToCheck));
    } else {
        args.jobLog("File does not exist: ".concat(fileToCheck));
    }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: fileExists ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
