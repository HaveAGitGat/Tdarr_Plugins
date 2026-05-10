import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  fileExists, getContainer, getFileName, getFileAbsoluteDir,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import FileProperties from './fileProperties';

const codecSynonyms: { [key: string]: string } = {
  h265: 'hevc',
  hevc: 'h265',
  h264: 'avc',
  avc: 'h264',
};

const replaceAll = (str: string, search: string, replacement: string): string => str.split(search).join(replacement);

const validProperties = Object.values(FileProperties) as string[];

const details = (): IpluginDetails => ({
  name: 'Check File Variation Exists',
  description: 'Check if a file with a similar name exists.'
    + ' Replaces exact case and UPPERCASE variants in the filename.',
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
      label: 'Properties To Check',
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
      label: 'Expected Values',
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

  const propList: FileProperties[] = String(args.inputs.propsToCheck).trim().split(',')
    .map((val) => val.trim())
    .filter((val) => val.length > 0) as FileProperties[];

  const expectedList = String(args.inputs.expectedValues).trim().split(',')
    .map((val) => val.trim())
    .filter((val) => val.length > 0);

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

  const invalidProps = propList.filter((prop) => !validProperties.includes(prop));
  if (invalidProps.length > 0) {
    args.jobLog(`Unknown properties: ${invalidProps.join(', ')}. Valid properties: ${validProperties.join(', ')}`);
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

  const sourceContainer = getContainer(args.inputFileObj._id);
  const sourceFileNameOnly = getFileName(args.inputFileObj._id);

  const propertyToSourceMap = {
    [FileProperties.codec]: args.inputFileObj.video_codec_name,
    [FileProperties.container]: sourceContainer,
    [FileProperties.resolution]: args.inputFileObj.video_resolution,
  };

  let newFileName = sourceFileNameOnly;
  let newContainer = sourceContainer;

  propList.forEach((prop) => {
    const sourceValue = propertyToSourceMap[prop];
    const destValue = propMap[prop];
    if (sourceValue === undefined || destValue === undefined) {
      return;
    }

    if (prop === FileProperties.container) {
      newContainer = destValue;
      return;
    }

    // Replace exact case and uppercase variants in filename only
    newFileName = replaceAll(newFileName, sourceValue, destValue);
    newFileName = replaceAll(newFileName, sourceValue.toUpperCase(), destValue);

    // Handle codec synonyms (e.g. h265 <-> hevc)
    if (prop === FileProperties.codec && codecSynonyms[sourceValue]) {
      const synonym = codecSynonyms[sourceValue];
      newFileName = replaceAll(newFileName, synonym, destValue);
      newFileName = replaceAll(newFileName, synonym.toUpperCase(), destValue);
    }
  });

  const directory = String(args.inputs.directory || '').trim()
    || getFileAbsoluteDir(args.inputFileObj._id);

  const targetPath = `${directory}/${newFileName}.${newContainer}`;

  let similarExists = false;

  if (await fileExists(targetPath)) {
    similarExists = true;
    args.jobLog(`Similar file exists: ${targetPath}`);
  } else {
    args.jobLog(`Similar file does not exist: ${targetPath}. Replaced properties: ${JSON.stringify(propList)}`);
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
