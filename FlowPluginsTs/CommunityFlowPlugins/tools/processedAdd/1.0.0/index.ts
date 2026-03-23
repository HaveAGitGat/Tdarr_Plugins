import { hashFile } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Add To Skiplist',
  description: `
  Add file to skiplist. Can be used with 'Check Skiplist' plugin to check if file has already been processed.
  You can view and clear the skiplist by going to Library -> Skiplist.
  `,
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.37.01',
  sidebarPosition: 3,
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
    {
      label: 'File To Add',
      name: 'fileToAdd',
      type: 'string',
      defaultValue: 'originalFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'originalFile',
          'workingFile',
        ],
      },
      tooltip: 'Specify the file to check',
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

  const checkType = String(args.inputs.checkType);
  const fileToAdd = String(args.inputs.fileToAdd);
  let propertyToAdd = '';

  let fileToAddObj = args.originalLibraryFile;
  if (fileToAdd === 'workingFile') {
    fileToAddObj = args.inputFileObj;
  }

  if (checkType === 'fileName') {
    propertyToAdd = `${fileToAddObj.fileNameWithoutExtension}.${fileToAddObj.container}`;
  } else if (checkType === 'filePath') {
    propertyToAdd = fileToAddObj._id;
  } else if (checkType === 'fileHash') {
    propertyToAdd = await hashFile(fileToAddObj._id, 'sha256');
  }

  await args.deps.crudTransDBN('F2FOutputJSONDB', 'removeOne', propertyToAdd, {});

  const newData = {
    _id: propertyToAdd,
    DB: fileToAddObj.DB,
    file: fileToAddObj.file,
    date: (new Date()).getTime(),
  };

  await args.deps.crudTransDBN('F2FOutputJSONDB', 'insert', propertyToAdd, newData);

  args.jobLog(`Added ${propertyToAdd} to skiplist`);

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
