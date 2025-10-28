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
        What characteristic of your media file do you want to check?
        
        Common examples:
        • codec_name - What audio/video format is used (like aac, mp3, h264, etc.)
        • width - Video width in pixels
        • height - Video height in pixels  
        • channels - Number of audio channels (2 for stereo, 6 for 5.1 surround, etc.)
        • sample_rate - Audio quality (like 44100, 48000)
        • bit_rate - Quality/file size (higher = better quality, larger file)
        • tags.language - Audio/subtitle language (like eng, spa, fre)
        • codec_type - Whether it's "video", "audio", or "subtitle"
        
        Enter the exact property name you want to check.
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
        What values are you looking to remove? Separate multiple values with commas.
        
        Examples based on what you're checking:
        • For audio formats: aac,mp3,ac3
        • For video formats: h264,h265,hevc
        • For languages: eng,spa,fre
        • For video sizes: 1920 (for width) or 1080 (for height)
        • For audio channels: 2,6,8
        • For stream types: audio,video,subtitle
        
        The plugin will look for files that have any of these values.
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
          'equals',
          'not_equals',
        ],
      },
      tooltip: `
      How should the plugin match your values?
      
      • "includes" - Find streams that HAVE any of your values
        Example: If checking for "aac,mp3" audio, streams with aac OR mp3 will match
        
      • "not_includes" - Find streams that DON'T have any of your values
        Example: If checking for "aac,mp3" audio, only streams with neither aac nor mp3 will match
        
      • "equals" - Find streams where the property exactly matches your values
        Example: If checking width for "1920", only streams that are exactly 1920 pixels wide will match
        
      • "not_equals" - Find streams where the property doesn't exactly match any of your values
        Example: If checking width for "1920", streams that are NOT exactly 1920 pixels wide will match
        
      Most users want "includes" to find streams that have what they're looking for.
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
  const valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(args.inputs.condition);

  // Validation
  if (!propertyToCheck) {
    args.jobLog('Error: Property to check cannot be empty');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  if (valuesToRemove.length === 0) {
    args.jobLog('Error: Values to remove cannot be empty');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    let target = '';
    if (propertyToCheck.includes('.')) {
      const parts = propertyToCheck.split('.');
      target = stream[parts[0]]?.[parts[1]];
    } else {
      target = stream[propertyToCheck];
    }

    if (target) {
      const prop = String(target).toLowerCase();
      for (let i = 0; i < valuesToRemove.length; i += 1) {
        const val = valuesToRemove[i].toLowerCase();
        const prefix = `Removing stream index ${stream.index} because ${propertyToCheck} of ${prop}`;
        if (condition === 'includes' && prop.includes(val)) {
          args.jobLog(`${prefix} includes ${val}\n`);
          // eslint-disable-next-line no-param-reassign
          stream.removed = true;
        } else if (condition === 'not_includes' && !prop.includes(val)) {
          args.jobLog(`${prefix} not_includes ${val}\n`);
          // eslint-disable-next-line no-param-reassign
          stream.removed = true;
        } else if (condition === 'equals' && prop === val) {
          args.jobLog(`${prefix} equals ${val}\n`);
          // eslint-disable-next-line no-param-reassign
          stream.removed = true;
        } else if (condition === 'not_equals' && prop !== val) {
          args.jobLog(`${prefix} not_equals ${val}\n`);
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
