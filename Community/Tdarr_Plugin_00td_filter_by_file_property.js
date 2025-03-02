const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_file_property',
  Stage: 'Pre-processing',
  Name: 'Filter By File Property',
  Type: 'Video',
  Operation: 'Filter',
  Description: `Filter by a top level file property.
  For example, container, video_resolution, video_codec_name, fileMedium.
  Click on a file name on the Tdarr tab or Search tab to see top-level file properties.
  `,
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'propertyName',
      type: 'string',
      defaultValue: 'container',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the file property to check',
    },
    {
      name: 'propertyValues',
      type: 'string',
      defaultValue: 'mkv,mp4',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of values to check for.',
    },
    {
      name: 'condition',
      type: 'string',
      defaultValue: '==',
      inputUI: {
        type: 'dropdown',
        options: [
          '==',
          '!=',
          '>',
          '>=',
          '<',
          '<=',
          'includes',
          'not includes',
        ],
      },
      tooltip:
        'Specify the condition to use when comparing the property value to the input value. \\n'
        + ' The property value is on the left hand side of the comparison. For example \\n'
        + ' property value includes input \\n'
        + ' property value >= input \\n',
    },
    {
      name: 'continueIfPropertyFound',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
        'Specify whether to continue the plugin stack if the property is found.',
    },
  ],
});

const conditionMet = (response, inputsArr, value, condition) => {
  for (let j = 0; j < inputsArr.length; j += 1) {
    try {
      let v = value;
      let i = inputsArr[j];

      if (
        condition === '>'
        || condition === '>='
        || condition === '<'
        || condition === '<='

      ) {
        v = Number(value);
        i = Number(inputsArr[j]);
      } else if (
        condition === '=='
        || condition === '!='
        || condition === 'includes'
        || condition === 'not includes'
      ) {
        v = String(value);
        i = String(inputsArr[j]);
      }

      response.infoLog += ` Checking property value of ${v} ${condition} input value of ${i} \n`;

      switch (condition) {
        case '==':
          if (v === i) {
            return true;
          }
          break;
        case '!=':
          if (v !== i) {
            return true;
          }
          break;
        case '>':
          if (v > i) {
            return true;
          }
          break;
        case '>=':
          if (v >= i) {
            return true;
          }
          break;
        case '<':
          if (v < i) {
            return true;
          }
          break;

        case '<=':
          if (v <= i) {
            return true;
          }
          break;
        case 'includes':
          if (v.includes(i)) {
            return true;
          }
          break;
        case 'not includes':
          if (!v.includes(i)) {
            return true;
          }
          break;
        default:
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  return false;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    infoLog: '',
  };

  if (inputs.propertyName.trim() === '') {
    response.infoLog += 'No input propertyName entered in plugin, skipping \n';
    return response;
  }

  const propertyName = inputs.propertyName.trim();

  if (inputs.propertyValues.trim() === '') {
    response.infoLog += 'No input propertyValues entered in plugin, skipping \n';
    return response;
  }

  // legacy
  if (inputs.exactMatch === false && inputs.condition === '==') {
    // eslint-disable-next-line no-param-reassign
    inputs.condition = 'includes';
  }

  const propertyValues = inputs.propertyValues.trim().split(',');

  try {
    const isConditionMet = conditionMet(response, propertyValues, file[propertyName], inputs.condition);

    response.infoLog += ` isConditionMet: ${isConditionMet} \n`;
    response.infoLog += ` continueIfPropertyFound: ${inputs.continueIfPropertyFound} \n`;
    if (inputs.continueIfPropertyFound === true) {
      if (isConditionMet === true) {
        response.processFile = true;
        response.infoLog += 'Continuing to next plugin  \n';
      } else {
        response.processFile = false;
        response.infoLog += 'Breaking out of stack  \n';
      }
    } else if (inputs.continueIfPropertyFound === false) {
      if (isConditionMet === true) {
        response.processFile = false;
        response.infoLog += 'Breaking out of stack  \n';
      } else {
        response.processFile = true;
        response.infoLog += 'Continuing to next plugin  \n';
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    response.infoLog += err;
    response.processFile = false;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
