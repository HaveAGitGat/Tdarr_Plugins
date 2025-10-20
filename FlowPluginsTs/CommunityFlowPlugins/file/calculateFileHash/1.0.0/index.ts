import { hashFile } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Calculate File Hash',
  description: 'Calculate File Hash and place it in a variable',
  style: {
    borderColor: 'green',
  },
  tags: '',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faHashtag',
  inputs: [
    {
      label: 'Algorithm',
      name: 'algorithm',
      type: 'string',
      defaultValue: 'sha256',
      inputUI: {
        type: 'dropdown',
        options: ['md5', 'sha1', 'sha256', 'sha512'],
      },
      tooltip: 'Select the algorithm for the file hash.',
    },
    {
      label: 'Absolute path to the file',
      name: 'filePath',
      type: 'string',
      defaultValue: '{{{args.inputFileObj._id}}}',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set the absolute path to the file to which the hash will be calculated. Variable templating is allowed.

      https://docs.tdarr.io/docs/plugins/flow-plugins/basics#plugin-variable-templating

      For Example,

      Original file
      {{{ args.originalLibraryFile._id }}}

      Working file
      {{{ args.inputFileObj._id }}}`,
    },
    {
      label: 'Variable',
      name: 'variable',
      type: 'string',
      defaultValue: 'fileHash',
      inputUI: {
        type: 'text',
      },
      tooltip: `Variable to set.

      Example
      fileHash

      You can then check this in the 'Check Flow Variable' plugin {{{args.variables.user.fileHash}}}
      against another value such as {{{args.variables.user.otherFileHash}}}`,
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
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const algorithm = String(args.inputs.algorithm).trim();
  const filePath = String(args.inputs.filePath).trim();
  const variable = String(args.inputs.variable).trim();

  args.jobLog(
    `Calculating the ${algorithm} hash of ${filePath} and recording it in ${variable}`,
  );

  try {
    const hash = await hashFile(filePath, algorithm);

    if (!args.variables.user) {
      // eslint-disable-next-line no-param-reassign
      args.variables.user = {};
    }

    // eslint-disable-next-line no-param-reassign
    args.variables.user[variable] = hash;

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  } catch (err) {
    const errorMessage = (err as Error).message;
    throw new Error(`Error calculating file hash: ${errorMessage}`);
  }
};
export { details, plugin };
