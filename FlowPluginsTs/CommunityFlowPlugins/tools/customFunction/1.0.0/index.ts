/* eslint-disable max-len */

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

// see args object data here https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces.ts
// example setting flow variable: https://github.com/HaveAGitGat/Tdarr/issues/1147#issuecomment-2593348443
// example reading ffmpeg metadata: https://github.com/HaveAGitGat/Tdarr_Plugins/issues/737#issuecomment-2581536112
// example setting working file as previous working file: https://github.com/HaveAGitGat/Tdarr/issues/1106#issuecomment-2622177459

// some example file data:
console.log(args.inputFileObj._id)
console.log(args.inputFileObj.file_size)
console.log(args.inputFileObj.ffProbeData.streams[0].codec_name)
console.log(args.inputFileObj.mediaInfo.track[0].BitRate)

// access global variable:
console.log(args.userVariables.global.test)
// access library variable:
console.log(args.userVariables.library.test)



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
