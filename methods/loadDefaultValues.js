/* eslint no-param-reassign: 0 */ // --> OFF

const loadDefaultValues = (inputs, details) => {
  if (!inputs) {
    inputs = {};
  }

  const dets = details();
  const defaultInputs = dets.Inputs || dets.inputs || [];
  for (let i = 0; i < defaultInputs.length; i += 1) {
    if (typeof inputs[defaultInputs[i].name] === 'string') {
      inputs[defaultInputs[i].name] = inputs[defaultInputs[i].name].trim();
    }

    if (inputs[defaultInputs[i].name] === undefined
      || inputs[defaultInputs[i].name] === ''
    ) {
      inputs[defaultInputs[i].name] = defaultInputs[i].defaultValue;
    }

    // convert string to boolean else false
    if (defaultInputs[i].type === 'boolean') {
      inputs[defaultInputs[i].name] = !!(inputs[defaultInputs[i].name] === 'true'
      || inputs[defaultInputs[i].name] === true);
    }

    // convert string to number else 0
    if (defaultInputs[i].type === 'number') {
      inputs[defaultInputs[i].name] = Number(inputs[defaultInputs[i].name]);
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(inputs[defaultInputs[i].name])) {
        inputs[defaultInputs[i].name] = 0;
      }
    }
  }
  return inputs;
};

module.exports = loadDefaultValues;
