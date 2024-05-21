/* eslint no-console: 0 */ // --> OFF
/* eslint max-len: 0 */

const fs = require('fs');
const chalk = require('chalk');

const folders = [
  './Community',
  './examples',
];

let errorEncountered = false;

folders.forEach((folder) => {
  const files = fs.readdirSync(folder).filter((row) => row.includes('.js'));

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
    let read = fs.readFileSync(`${folder}/${files[i]}`).toString();

    const importLib = 'const lib = require(\'../methods/lib\')();';
    if (!read.includes(importLib)) {
      console.log(chalk.red(`Plugin error: '${folder}/${files[i]}' does not contain ${importLib}`));
      read = `${importLib}\n${read}`;
      // fs.writeFileSync(`${folder}/${files[i]}`, read)
      errorEncountered = true;
    }

    const detailsText = 'const details = () =>';
    if (!read.includes(detailsText)) {
      console.log(chalk.red(`Plugin error: '${folder}/${files[i]}' does not contain ${detailsText}`));
      errorEncountered = true;
    }

    const syncText = 'const plugin = (file, librarySettings, inputs, otherArguments) => {';
    const asyncText = 'const plugin = async (file, librarySettings, inputs, otherArguments) => {';

    if (!read.includes(syncText)
      && !read.includes(asyncText)
    ) {
      console.log(chalk.red(`Plugin error: '${folder}/${files[i]}' does not contain ${syncText} or ${asyncText}`));
      errorEncountered = true;
    }

    const inputsText = 'inputs = lib.loadDefaultValues(inputs, details);';
    if (!read.includes(inputsText)
    ) {
      console.log(chalk.red(`Plugin error: '${folder}/${files[i]}' does not contain ${inputsText}`));
      errorEncountered = true;
    }

    const exportText = `module.exports.details = details;
module.exports.plugin = plugin;`;

    if (!read.includes(exportText)) {
      console.log(chalk.red(`Plugin error: '${folder}/${files[i]}' does not contain ${exportText}`));
      read = read.replace('module.exports.details = details;', '');
      read = read.replace('module.exports.plugin = plugin;', '');
      read += `\n${exportText}`;
      // fs.writeFileSync(`${folder}/${files[i]}`, read)
      errorEncountered = true;
    }

    // check deps are within functions
    const keyWord = 'require(';
    const requires = read.split(keyWord);

    if (requires.length >= 2) {
      const allBefore = [];
      for (let j = 0; j < requires.length - 1; j += 1) {
        allBefore.push(requires[j]);
        const countOpen = allBefore.join(keyWord).split('{').length - 1;
        const countClose = allBefore.join(keyWord).split('}').length - 1;
        if (countOpen === countClose) {
          console.log(chalk.red(`Plugin has requires outside of function '${folder}/${files[i]}'`));
          errorEncountered = true;
        }
      }
    }

    let pluginDetails;
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      pluginDetails = require(`.${folder}/${files[i]}`).details();
    } catch (err) {
      console.log(chalk.red(err.message));
      errorEncountered = true;
    }

    const detailsKeys = Object.keys(pluginDetails);

    // eslint-disable-next-line no-loop-func
    detailsOrder.forEach((detail) => {
      if (detailsKeys.indexOf(detail) === -1) {
        console.log(chalk.red(`Plugin details is missing '${folder}/${files[i]}' : ${detail}`));
        errorEncountered = true;
      }
    });

    // eslint-disable-next-line no-loop-func
    detailsKeys.forEach((detail, index) => {
      if (detailsOrder[index] !== detail) {
        console.log(chalk.red(`Plugin details keys are not in the correct order: '${folder}/${files[i]}' ${detail}`));
        errorEncountered = true;
      }
    });

    if (detailsKeys.length < detailsOrder.length) {
      console.log(chalk.red(`Plugin details are too few '${folder}/${files[i]}'`));
      errorEncountered = true;
    }

    console.log(files[i]);
    // check if words in pluginDetails.Name are not capitalized
    if (pluginDetails.Name.split(' ').some((word) => word[0] !== word[0].toUpperCase())) {
      console.log(chalk.red(`Plugin Name is not capitalized '${folder}/${files[i]}'`));
      errorEncountered = true;
    }

    if (!['Pre-processing', 'Post-processing'].includes(pluginDetails.Stage)) {
      console.log(chalk.red(`Plugin does not have a valid Type'${folder}/${files[i]}'`));
      errorEncountered = true;
    }

    if (!['Video', 'Audio', 'Subtitle', 'Any'].includes(pluginDetails.Type)) {
      console.log(chalk.red(`Plugin does not have a valid Type'${folder}/${files[i]}'`));
      errorEncountered = true;
    }

    if (files[i].split('.js').join('') !== pluginDetails.id) {
      console.log(chalk.red(`Plugin file name does not match details id'${folder}/${files[i]}'`));
      errorEncountered = true;
    }

    if (!['Transcode', 'Filter'].includes(pluginDetails.Operation)) {
      console.log(chalk.red(`Plugin does not have a valid Operation '${folder}/${files[i]}'`));
      errorEncountered = true;
    } else if (detailsKeys.length > detailsOrder.length) {
      console.log(chalk.red(`Plugin details are too many '${folder}/${files[i]}'`));
      errorEncountered = true;
    } else if (pluginDetails.Inputs && !Array.isArray(pluginDetails.Inputs)) {
      // Check default values are set;
      console.log(chalk.red(`Plugin Inputs is not an array: ${files[i]}`));
      errorEncountered = true;
    } else if (pluginDetails.Inputs && Array.isArray(pluginDetails.Inputs)) {
      const inputs = pluginDetails.Inputs;
      const savedInputs = {};
      for (let j = 0; j < inputs.length; j += 1) {
        // Prevent duplicate plugin inputs
        if (savedInputs[inputs[j].name] === true) {
          console.log(chalk.red(`Plugin Input already exists: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else {
          savedInputs[inputs[j].name] = true;
        }

        const inputKeys = Object.keys(inputs[j]);
        if (
          inputKeys[0] !== 'name'
          || inputKeys[1] !== 'type'
          || inputKeys[2] !== 'defaultValue'
          || inputKeys[3] !== 'inputUI'
          || inputKeys[4] !== 'tooltip'
        ) {
          console.log(chalk.red(`Plugin Input keys are not in correct order: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (inputs[j].type === undefined || !pluginInputTypes.includes(inputs[j].type)) {
          console.log(chalk.red(`Plugin Input does not have a type: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (
          (inputs[j].type === 'string' && typeof inputs[j].defaultValue !== 'string')
          || (inputs[j].type === 'number' && typeof inputs[j].defaultValue !== 'number')
          || (inputs[j].type === 'boolean' && typeof inputs[j].defaultValue !== 'boolean')
        ) {
          console.log(chalk.red(`Plugin Input type does not match defaultValue type:
           '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (!['text', 'dropdown'].includes(inputs[j].inputUI.type)) {
          console.log(chalk.red(`Plugin Input inputUI is invalid: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (inputs[j].defaultValue === undefined) {
          console.log(chalk.red(`Plugin Input does not have a default value: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (inputs[j].inputUI.type === 'dropdown' && !Array.isArray(inputs[j].inputUI.options)) {
          console.log(chalk.red(`Plugin Input is dropdown but does not have dropdown array: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        } else if (Array.isArray(inputs[j].inputUI.options) && inputs[j].inputUI.options.some((option) => typeof option === 'boolean')) {
          console.log(chalk.red(`Plugin Input has a boolean dropdown input: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        }

        const count = read.split(inputs[j].name).length - 1;
        if (count === 1) {
          console.log(chalk.red(`Plugin Input is not used: '${folder}/${files[i]}' : ${inputs[j].name}`));
          errorEncountered = true;
        }
      }
    }

    console.log(`[✓]${folder}/${files[i]}`);
  }
});

console.log('Done!');

if (errorEncountered) {
  console.log('Errors encountered');
  process.exit(1);
}
