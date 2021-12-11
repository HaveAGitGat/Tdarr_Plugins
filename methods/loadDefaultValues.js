const loadDefaultValues = (inputs, details) => {
  if (!inputs) {
    // eslint-disable-next-line no-param-reassign
    inputs = {};
  }
  const defaultInputs = details().Inputs;
  for (let i = 0; i < defaultInputs.length; i += 1) {
    if (typeof inputs[defaultInputs[i].name] === 'string') {
      // eslint-disable-next-line no-param-reassign
      inputs[defaultInputs[i].name] = typeof inputs[defaultInputs[i].name].trim();
    }

    if (inputs[defaultInputs[i].name] === undefined
      || inputs[defaultInputs[i].name] === ''
    ) {
      // eslint-disable-next-line no-param-reassign
      inputs[defaultInputs[i].name] = defaultInputs[i].defaultValue;
    }

    if (defaultInputs[i].type === 'boolean') {
      // eslint-disable-next-line no-param-reassign
      inputs[defaultInputs[i].name] = inputs[defaultInputs[i].name] === 'true';
    }

    if (defaultInputs[i].type === 'number') {
      // eslint-disable-next-line no-param-reassign
      inputs[defaultInputs[i].name] = Number(inputs[defaultInputs[i].name]);
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(inputs[defaultInputs[i].name])) {
        // eslint-disable-next-line no-param-reassign
        inputs[defaultInputs[i].name] = 0;
      }
    }
  }
  return inputs;
};

module.exports = loadDefaultValues;
