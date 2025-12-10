import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { fileExists, getContainer, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import FileProperties from './fileProperties';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File variation exists',
  description: 'Check if a file with a similar name exists. Capitalization is respected.',
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
      label: 'Properties to check',
      name: 'propsToCheck',
      type: 'string',
      defaultValue: 'codec',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the properties of the input video file to be checked. '
          + 'Available properties: codec, container, resolution',
    },
    {
      label: 'Expected values',
      name: 'expectedValues',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The expected values for the video file properties. Capitalization is respected. '
          + 'Keep in order of Properties!',
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
      tooltip: 'Similar file exists',
    },
    {
      number: 2,
      tooltip: 'Similar file does not exist',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let sourceFileName = args.inputFileObj._id;
  const propList: FileProperties[] = String(args.inputs.propsToCheck).trim().split(',')
    .map((val) => val.trim() as FileProperties);

  const expectedList = String(args.inputs.expectedValues).trim().split(',');

  if (propList.length === 0) {
    args.jobLog('No properties provided.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  if (propList.length !== expectedList.length) {
    args.jobLog('Amount of properties does not match amount of expected values.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const propMap: { [key in FileProperties]?: string } = {};

  propList.forEach((prop, index) => {
    propMap[prop] = expectedList[index];
  });

  const propertyToSourceMap = {
    [FileProperties.codec]: args.inputFileObj.video_codec_name,
    [FileProperties.container]: getContainer(args.inputFileObj._id),
    [FileProperties.resolution]: args.inputFileObj.video_resolution,
  };

  // Handle codec synonym
  sourceFileName = sourceFileName.replace('h265', 'hevc');

  propList.forEach((prop) => {
    const sourceValue = propertyToSourceMap[prop];
    const destValue = propMap[prop];
    if (sourceValue !== undefined && destValue !== undefined) {
      sourceFileName = sourceFileName.replace(sourceValue, destValue);
      sourceFileName = sourceFileName.replace(sourceValue.toUpperCase(), destValue);
    }
  });

  let similarExists = false;

  if (await fileExists(sourceFileName)) {
    similarExists = true;
    args.jobLog(`Similar file exists: ${sourceFileName}`);
  } else {
    args.jobLog(`Similar file does not exist: ${sourceFileName}. Replaced properties: ${JSON.stringify(propList)}`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: similarExists ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
