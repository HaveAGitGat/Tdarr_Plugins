const details = () => ({
  id: 'Tdarr_Plugin_tsld_filter_modified_date',
  Stage: 'Pre-processing',
  Name: 'Filter Modified Date',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'This plugin prevents processing files older than 30 days \n\n',
  Version: '1.00',
  Tags: '',
  Inputs: [
    // (Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
    {
      name: 'minModifiedDaysOld',
      type: 'number',
      defaultValue: 30,
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter minimum number of days since modified since now file must be.  
      
      \\nExample:\\n
       365  
       
       \\nExample:\\n
       30`,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: true,
    infoLog: '',
  };
  // response.infoLog += `Filter preventing processing. File mod time ${file.statSync.mtimeMs}`;
  // response.infoLog += ` Now ${Date.now()}`;
  const age = Date.now() - file.statSync.mtimeMs;
  const reqage = Number(inputs.minModifiedDaysOld) * 86400000;
  // response.infoLog += ` Age ${age} Require Min Age: ${reqage}`;
  if (reqage < age) {
    response.infoLog += 'File modified date old enough. Moving to next plugin.';
    response.processFile = true;
  } else {
    response.infoLog += 'Skipping, file modified date not old enough';
    response.processFile = false;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
