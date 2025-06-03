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
      - includes: property value includes any of the specified values (returns true if ANY stream matches)
      - not_includes: property value does not include any of the specified values (returns true only if NO streams contain the values)
      - equals: property value exactly equals one of the specified values (returns true if ANY stream matches)
      - not_equals: property value does not equal any of the specified values (returns true only if NO streams equal the values)
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
  const valuesToMatch = String(args.inputs.valuesToMatch).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(args.inputs.condition);

  // Validation
  if (!propertyToCheck) {
    args.jobLog('Error: Property to check cannot be empty\n');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  if (valuesToMatch.length === 0) {
    args.jobLog('Error: Values to match cannot be empty\n');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  let hasMatchingProperty = false;

  // Helper function to get nested property value
  const getNestedProperty = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = obj;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  };

  // Check all streams in the file
  if (args.inputFileObj.ffProbeData && args.inputFileObj.ffProbeData.streams) {
    const { streams } = args.inputFileObj.ffProbeData;

    // For negative conditions, we need to check ALL streams
    const isNegativeCondition = condition === 'not_includes' || condition === 'not_equals';
    
    if (isNegativeCondition) {
      // For negative conditions, assume true until proven false
      hasMatchingProperty = true;
      
      for (let streamIdx = 0; streamIdx < streams.length && hasMatchingProperty; streamIdx += 1) {
        const stream = streams[streamIdx];
        const target = getNestedProperty(stream, propertyToCheck);

        if (target !== undefined && target !== null) {
          const prop = String(target).toLowerCase();

          switch (condition) {
            case 'not_includes':
              for (let i = 0; i < valuesToMatch.length; i += 1) {
                const val = valuesToMatch[i].toLowerCase();
                if (prop.includes(val)) {
                  hasMatchingProperty = false;
                  args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" includes "${val}" - condition fails\n`);
                  break;
                }
              }
              if (hasMatchingProperty) {
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" does not include any of the specified values\n`);
              }
              break;
            case 'not_equals':
              for (let i = 0; i < valuesToMatch.length; i += 1) {
                const val = valuesToMatch[i].toLowerCase();
                if (prop === val) {
                  hasMatchingProperty = false;
                  args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" equals "${val}" - condition fails\n`);
                  break;
                }
              }
              if (hasMatchingProperty) {
                args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" does not equal any of the specified values\n`);
              }
              break;
            default:
              break;
          }
        }
      }
    } else {
      // For positive conditions, stop as soon as we find a match
      for (let streamIdx = 0; streamIdx < streams.length && !hasMatchingProperty; streamIdx += 1) {
        const stream = streams[streamIdx];
        const target = getNestedProperty(stream, propertyToCheck);

        if (target !== undefined && target !== null) {
          const prop = String(target).toLowerCase();

          switch (condition) {
            case 'includes':
              for (let i = 0; i < valuesToMatch.length; i += 1) {
                const val = valuesToMatch[i].toLowerCase();
                if (prop.includes(val)) {
                  hasMatchingProperty = true;
                  args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" includes "${val}"\n`);
                  break;
                }
              }
              break;
            case 'equals':
              for (let i = 0; i < valuesToMatch.length; i += 1) {
                const val = valuesToMatch[i].toLowerCase();
                if (prop === val) {
                  hasMatchingProperty = true;
                  args.jobLog(`Stream ${stream.index}: ${propertyToCheck} "${prop}" equals "${val}"\n`);
                  break;
                }
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

  args.jobLog(
    `File routed to output ${outputNumber} - ${hasMatchingProperty ? 'has' : 'does not have'} `
    + 'matching stream property\n',
  );

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
