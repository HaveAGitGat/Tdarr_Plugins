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

  // Helper function to check if a stream property matches the condition
  const checkStreamProperty = (stream: any, index: number): boolean => {
    const target = getNestedProperty(stream, propertyToCheck);
    
    if (target === undefined || target === null) {
      return false;
    }

    const prop = String(target).toLowerCase();
    const matches = valuesToMatch.map(val => val.toLowerCase());

    switch (condition) {
      case 'includes':
        return matches.some(val => {
          const match = prop.includes(val);
          if (match) {
            args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" includes "${val}"\n`);
          }
          return match;
        });
      
      case 'not_includes':
        const hasIncludes = matches.some(val => prop.includes(val));
        if (hasIncludes) {
          const matchedVal = matches.find(val => prop.includes(val));
          args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" includes "${matchedVal}" - condition fails\n`);
        }
        return !hasIncludes;
      
      case 'equals':
        return matches.some(val => {
          const match = prop === val;
          if (match) {
            args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" equals "${val}"\n`);
          }
          return match;
        });
      
      case 'not_equals':
        const hasEquals = matches.some(val => prop === val);
        if (hasEquals) {
          const matchedVal = matches.find(val => prop === val);
          args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" equals "${matchedVal}" - condition fails\n`);
        }
        return !hasEquals;
      
      default:
        return false;
    }
  };

  let hasMatchingProperty = false;

  // Check all streams in the file
  if (args.inputFileObj.ffProbeData?.streams) {
    const { streams } = args.inputFileObj.ffProbeData;
    
    // For negative conditions, ALL streams must pass; for positive conditions, ANY stream can pass
    const isNegativeCondition = condition === 'not_includes' || condition === 'not_equals';
    
    if (isNegativeCondition) {
      hasMatchingProperty = streams.every((stream, index) => checkStreamProperty(stream, stream.index || index));
    } else {
      hasMatchingProperty = streams.some((stream, index) => checkStreamProperty(stream, stream.index || index));
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
