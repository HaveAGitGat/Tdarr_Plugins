import {
  fileExists, getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Exists',
  description: 'Check file Exists',
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
      defaultValue: '${fileName}_720p.${container}',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify file to check using templating e.g. ${fileName}_720p.${container}',
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
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const directory = String(args.inputs.directory).trim() || getFileAbosluteDir(args.inputFileObj._id);

  const fileName = getFileName(args.inputFileObj._id);

  let fileToCheck = String(args.inputs.fileToCheck).trim();
  fileToCheck = fileToCheck.replace(/\${fileName}/g, fileName);
  fileToCheck = fileToCheck.replace(/\${container}/g, getContainer(args.inputFileObj._id));
  fileToCheck = `${directory}/${fileToCheck}`;

  let fileDoesExist = false;
  if (await fileExists(fileToCheck)) {
    fileDoesExist = true;
    args.jobLog(`File exists: ${fileToCheck}`);
  } else {
    args.jobLog(`File does not exist: ${fileToCheck}`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: fileDoesExist ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
