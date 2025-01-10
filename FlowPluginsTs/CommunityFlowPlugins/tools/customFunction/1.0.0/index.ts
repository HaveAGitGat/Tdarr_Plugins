import { promises as fsp } from 'fs';
import { getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Custom JS Function',
  description: 'Write a custom function in JS to run with up to 4 outputs',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      label: 'JS Code',
      name: 'code',
      type: 'string',
      defaultValue: `
module.exports = async (args) => {

// do something here

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
}
      `,
      inputUI: {
        type: 'textarea',
        style: {
          height: '200px',
        },
      },
      tooltip: 'Write your custom function here',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to output 1',
    },
    {
      number: 2,
      tooltip: 'Continue to output 2',
    },
    {
      number: 3,
      tooltip: 'Continue to output 3',
    },
    {
      number: 4,
      tooltip: 'Continue to output 4',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const code = String(args.inputs.code);

  const outputFilePath = `${getPluginWorkDir(args)}/script.js`;
  await fsp.writeFile(outputFilePath, code);
  // eslint-disable-next-line import/no-dynamic-require
  const func = require(outputFilePath);
  const response = await func(args);
  return response;
};
export {
  details,
  plugin,
};
