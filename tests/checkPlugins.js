/* eslint no-console: 0 */ // --> OFF

const fs = require('fs');

const files = fs.readdirSync('./Community');

const detailsOrder = [
  'id',
  'Stage',
  'Name',
  'Type',
  'Operation',
  'Description',
  'Version',
  'Tags',
  'Inputs',
];
const pluginInputTypes = ['string', 'number', 'boolean'];

for (let i = 0; i < files.length; i += 1) {
  console.log(`${files[i]}`);

  let read = fs.readFileSync(`./Community/${files[i]}`).toString();

  const importDefaultValues = 'const loadDefaultValues = require(\'../methods/loadDefaultValues\');';
  if (!read.includes(importDefaultValues)) {
    console.log(`Plugin error: './Community/${files[i]}' does not contain ${importDefaultValues}`);
    read = `${importDefaultValues}\n${read}`;
    // fs.writeFileSync(`./Community/${files[i]}`, read)
    process.exit(1);
  }

  const detailsText = 'const details = () =>';
  if (!read.includes(detailsText)) {
    console.log(`Plugin error: './Community/${files[i]}' does not contain ${detailsText}`);
    process.exit(1);
  }

  const syncText = 'const plugin = (file, librarySettings, inputs, otherArguments) => {';
  const asyncText = 'const plugin = async (file, librarySettings, inputs, otherArguments) => {';

  if (!read.includes(syncText)
    && !read.includes(asyncText)
  ) {
    console.log(`Plugin error: './Community/${files[i]}' does not contain ${syncText} or ${asyncText}`);
    process.exit(1);
  }

  const inputsText = 'inputs = loadDefaultValues(inputs, details);';
  if (!read.includes(inputsText)
  ) {
    console.log(`Plugin error: './Community/${files[i]}' does not contain ${inputsText}`);
    process.exit(1);
  }

  const exportText = `module.exports.details = details;
module.exports.plugin = plugin;`;

  if (!read.includes(exportText)) {
    console.log(`Plugin error: './Community/${files[i]}' does not contain ${exportText}`);
    read = read.replace('module.exports.details = details;', '');
    read = read.replace('module.exports.plugin = plugin;', '');
    read += `\n${exportText}`;
    // fs.writeFileSync(`./Community/${files[i]}`, read)
    process.exit(1);
  }

  let pluginDetails;
  try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    pluginDetails = require(`../Community/${files[i]}`).details();
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }

  const detailsKeys = Object.keys(pluginDetails);

  detailsOrder.forEach((detail) => {
    if (detailsKeys.indexOf(detail) === -1) {
      console.log(`Plugin details is missing './Community/${files[i]}' : ${detail}`);
      process.exit(1);
    }
  });

  detailsKeys.forEach((detail, index) => {
    if (detailsOrder[index] !== detail) {
      console.log(`Plugin details keys are not in the correct order: './Community/${files[i]}' ${detail}`);
      process.exit(1);
    }
  });

  if (detailsKeys.length < detailsOrder.length) {
    console.log(`Plugin details are too few './Community/${files[i]}'`);
    process.exit(1);
  }

  if (!['Pre-processing', 'Post-processing'].includes(pluginDetails.Stage)) {
    console.log(`Plugin does not have a valid Type'./Community/${files[i]}'`);
    process.exit(1);
  }

  if (!['Video', 'Audio', 'Subtitle', 'Any'].includes(pluginDetails.Type)) {
    console.log(`Plugin does not have a valid Type'./Community/${files[i]}'`);
    process.exit(1);
  }

  if (!['Transcode', 'Filter'].includes(pluginDetails.Operation)) {
    console.log(`Plugin does not have a valid Operation './Community/${files[i]}'`);
    process.exit(1);
  } else if (detailsKeys.length > detailsOrder.length) {
    console.log(`Plugin details are too many './Community/${files[i]}'`);
    process.exit(1);
  } else if (pluginDetails.Inputs && !Array.isArray(pluginDetails.Inputs)) {
    // Check default values are set;
    console.log(`Plugin Inputs is not an array: ${files[i]}`);
    process.exit(1);
  } else if (pluginDetails.Inputs && Array.isArray(pluginDetails.Inputs)) {
    const inputs = pluginDetails.Inputs;
    for (let j = 0; j < inputs.length; j += 1) {
      const inputKeys = Object.keys(inputs[j]);
      if (
        inputKeys[0] !== 'name'
        || inputKeys[1] !== 'type'
        || inputKeys[2] !== 'defaultValue'
        || inputKeys[3] !== 'inputUI'
        || inputKeys[4] !== 'tooltip'
      ) {
        console.log(`Plugin Input keys are not in correct order: './Community/${files[i]}' : ${inputs[j].name}`);
        process.exit(1);
      } else if (inputs[j].type === undefined || !pluginInputTypes.includes(inputs[j].type)) {
        console.log(`Plugin Input does not have a type: './Community/${files[i]}' : ${inputs[j].name}`);
        process.exit(1);
      } else if (
        (inputs[j].type === 'string' && typeof inputs[j].defaultValue !== 'string')
        || (inputs[j].type === 'number' && typeof inputs[j].defaultValue !== 'number')
        || (inputs[j].type === 'boolean' && typeof inputs[j].defaultValue !== 'boolean')
      ) {
        console.log(`Plugin Input type does not match defaultValue type:
         './Community/${files[i]}' : ${inputs[j].name}`);
        process.exit(1);
      } else if (inputs[j].defaultValue === undefined) {
        console.log(`Plugin Input does not have a default value: './Community/${files[i]}' : ${inputs[j].name}`);
        process.exit(1);
      }
    }
  }
}

console.log('Done!');
