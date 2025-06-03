import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Stream Property',
  description: 'Check if file has specified stream property',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faFilter',
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
        
        \\nExample:\\n
        codec_name

        \\nExample:\\n
        tags.language
        `,
    },
    {
      label: 'Values To Match',
      name: 'valuesToMatch',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Enter values of the property above to match. For example, if checking codec_name, could enter ac3,aac:
        
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
          'equals',
          'not_equals',
        ],
      },
      tooltip: `
      Specify the matching condition:
      - includes: property value includes any of the specified values
      - not_includes: property value does not include any of the specified values  
      - equals: property value exactly equals one of the specified values
      - not_equals: property value does not equal any of the specified values
      `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has matching stream property',
    },
    {
      number: 2,
      tooltip: 'File does not have matching stream property',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const propertyToCheck = String(args.inputs.propertyToCheck).trim();
  const valuesToMatch = String(args.inputs.valuesToMatch).trim().split(',').map((item) => item.trim());
  const condition = String(args.inputs.condition);

  let hasMatchingProperty = false;

  // Check all streams in the file
  if (args.inputFileObj.ffProbeData && args.inputFileObj.ffProbeData.streams) {
    const streams = args.inputFileObj.ffProbeData.streams;
    
    streamLoop: for (let streamIdx = 0; streamIdx < streams.length; streamIdx += 1) {
      const stream = streams[streamIdx];
      let target = '';
      
      // Handle nested properties like tags.language
      if (propertyToCheck.includes('.')) {
        const parts = propertyToCheck.split('.');
        target = stream[parts[0]]?.[parts[1]];
      } else {
        target = stream[propertyToCheck];
      }

      if (target) {
        const prop = String(target).toLowerCase();
        
        for (let i = 0; i < valuesToMatch.length; i += 1) {
          const val = valuesToMatch[i].toLowerCase();
          
          switch (condition) {
            case 'includes':
              if (prop.includes(val)) {
                hasMatchingProperty = true;
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" includes "${val}"\n`);
                break streamLoop;
              }
              break;
            case 'not_includes':
              if (!prop.includes(val)) {
                hasMatchingProperty = true;
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" does not include "${val}"\n`);
                break streamLoop;
              }
              break;
            case 'equals':
              if (prop === val) {
                hasMatchingProperty = true;
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" equals "${val}"\n`);
                break streamLoop;
              }
              break;
            case 'not_equals':
              if (prop !== val) {
                hasMatchingProperty = true;
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" does not equal "${val}"\n`);
                break streamLoop;
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }

  const outputNumber = hasMatchingProperty ? 1 : 2;
  
  args.jobLog(`File routed to output ${outputNumber} - ${hasMatchingProperty ? 'has' : 'does not have'} matching stream property\n`);

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