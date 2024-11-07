import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Remove Stream By Property',
  description: 'Remove Stream By Property',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Property To Check',
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: 'codec_name',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Enter one stream property to check. 
        To resolve 'Subtitle codec 94213 is not supported' error, leave as codec_name.
        
        \\nExample:\\n
        codec_name

        \\nExample:\\n
        tags.language
        `,
    },
    {
      label: 'Values To Remove',
      name: 'valuesToRemove',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Enter values of the property above to remove. For example, if removing by codec_name, could enter ac3,aac. 
        To resolve 'Subtitle codec 94213 is not supported' error, enter mov_text.
        
        \\nExample:\\n
        ac3,aac
        `,
    },
    {
      label: 'Condition',
      name: 'condition',
      type: 'string',
      defaultValue: 'includes',
      inputUI: {
        type: 'dropdown',
        options: [
          'includes',
          'not_includes',
        ],
      },
      tooltip: `
      Specify whether to remove streams that include or do not include the values above.
      `,
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
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const propertyToCheck = String(args.inputs.propertyToCheck).trim();
  const valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map((item) => item.trim().toLowerCase());
  const condition = String(args.inputs.condition);

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    // Skip stream index 0, this is the video stream
    if (stream.index === 0) return;

    let target = '';
    if (propertyToCheck.includes('.')) {
      const parts = propertyToCheck.split('.');
      target = stream[parts[0]]?.[parts[1]];
    } else {
      target = stream[propertyToCheck];
    }

    if (target) {
      const prop = String(target).toLowerCase();
      const prefix = `Removing stream index ${stream.index} because ${propertyToCheck} of ${prop}`;
      if (condition === 'includes') {
        // Check each value individually for an exact match
        valuesToRemove.forEach((val) => {
          if (prop === val) {
            args.jobLog(`${prefix} includes exact match ${val}\n`);
            // eslint-disable-next-line no-param-reassign
            stream.removed = true;
          }
        });
      } else if (condition === 'not_includes') {
        // Check the array as a whole for no exact matches
        const noneMatch = valuesToRemove.every((val) => prop !== val);
        if (noneMatch) {
          args.jobLog(`${prefix} does not include any exact matches of [${valuesToRemove.join(', ')}]\n`);
          // eslint-disable-next-line no-param-reassign
          stream.removed = true;
        }
      }
    }
  });

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
