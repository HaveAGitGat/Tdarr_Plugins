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
      label: 'Codec Type',
      name: 'codecType',
      type: 'string',
      defaultValue: 'any',
      inputUI: {
        type: 'dropdown',
        options: [
          'audio',
          'video',
          'subtitle',
          'any',
        ],
      },
      tooltip:
        `
      Stream Codec Type to check against the property.
        `,
    },

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

  const codecType = String(args.inputs.codecType).trim();
  const propertyToCheck = String(args.inputs.propertyToCheck).trim();
  const valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(args.inputs.condition);

  args.variables.ffmpegCommand.streams
    .filter((stream) => codecType === 'any' || stream.codec_type === codecType)
    .forEach((stream) => {
      let target = '';
      if (propertyToCheck.includes('.')) {
        const parts = propertyToCheck.split('.');
        target = stream[parts[0]]?.[parts[1]];
      } else {
        target = stream[propertyToCheck];
      }

      if (target === undefined || target === null) {
        return;
      }

      const prop = String(target).toLowerCase();
      const lowerValues = valuesToRemove.map((val) => val.toLowerCase());
      // For includes:      remove if the property includes ANY of the values
      // For not_includes:  remove if the property includes NONE of the values
      // For equals:        remove if the property exactly matches ANY of the values
      // For not_equals:    remove if the property exactly matches NONE of the values
      let shouldRemove = false;
      switch (condition) {
        case 'includes':
          shouldRemove = lowerValues.some((val) => prop.includes(val));
          break;
        case 'not_includes':
          shouldRemove = !lowerValues.some((val) => prop.includes(val));
          break;
        case 'equals':
          shouldRemove = lowerValues.some((val) => prop === val);
          break;
        case 'not_equals':
          shouldRemove = !lowerValues.some((val) => prop === val);
          break;
        default:
          shouldRemove = false;
      }

      const valuesStr = valuesToRemove.join(', ');
      const action = shouldRemove ? 'Removing' : 'Keep';
      // eslint-disable-next-line max-len
      args.jobLog(`${action} stream index ${stream.index} because ${propertyToCheck} of ${prop} ${condition} ${valuesStr}\n`);
      if (shouldRemove) {
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
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
