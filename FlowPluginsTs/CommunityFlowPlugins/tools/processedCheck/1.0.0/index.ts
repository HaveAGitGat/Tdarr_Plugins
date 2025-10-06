import { hashFile } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Skiplist',
  description: `
    Check if file has already been added to skiplist by 'Add To Skiplist' flow plugin.
    You can view and clear the skiplist by going to Library -> Skiplist.
  `,
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.37.01',
  sidebarPosition: 2,
  icon: 'faFile',
  inputs: [
    {
      label: 'Check Type',
      name: 'checkType',
      type: 'string',
      defaultValue: 'filePath',
      inputUI: {
        type: 'dropdown',
        options: [
          'filePath',
          'fileName',
          'fileHash',
        ],
      },
      tooltip: 'Specify the type of check to perform.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File is not on library skiplist',
    },
    {
      number: 2,
      tooltip: 'File is on library skiplist',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const checkType = String(args.inputs.checkType);

  let propertyToCheck = '';

  if (checkType === 'fileName') {
    propertyToCheck = `${args.inputFileObj.fileNameWithoutExtension}.${args.inputFileObj.container}`;
  } else if (checkType === 'filePath') {
    propertyToCheck = args.inputFileObj._id;
  } else if (checkType === 'fileHash') {
    propertyToCheck = await hashFile(args.inputFileObj._id, 'sha256');
  }

  args.jobLog(`Checking if file is on skiplist: ${propertyToCheck}`);

  const outputHist = await args.deps.crudTransDBN('F2FOutputJSONDB', 'getById', propertyToCheck, {});

  let outputNumber = 1;

  if (outputHist !== undefined && outputHist.DB === args.inputFileObj.DB) {
    args.jobLog('File is on library skiplist');
    outputNumber = 2;
  } else {
    args.jobLog('File is not on library skiplist');
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
