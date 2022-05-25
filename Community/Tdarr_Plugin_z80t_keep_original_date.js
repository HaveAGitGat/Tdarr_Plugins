module.exports.dependencies = [
  'axios',
  'path-extra',
  'touch',
];

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_z80t_keep_original_date',
  Stage: 'Post-processing',
  Name: 'Keep original file dates and times after transcoding',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin copies the original file dates and times to the transcoded file \n\n',
  Version: '1.10',
  Tags: 'post-processing,dates,date',
  Inputs: [{
    name: 'server',
    type: 'string',
    defaultValue: '192.168.1.100',
    inputUI: {
      type: 'text',
    },
    tooltip: `IP address or hostname of the server assigned to this node, will be used for API requests.
      If you are running nodes within Docker you should use the server IP address rather than the name.

      \\nExample:\\n
       tdarrserver

      \\nExample:\\n
       192.168.1.100`,
  }, {
    name: 'extensions',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `When files are trans-coded the file extension may change,
      enter a list of extensions to try and match the original file with in the database after trans-coding.
      Default is the list of container types from library settings. The list will be searched in order and
      the extension of the original file will always be checked first before the list is used.

      \\nExample:\\n
       mkv,mp4,avi`,
  },
  {
    name: 'log',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Write log entries to console.log. Default is false.

      \\nExample:\\n
       true`,
  },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved
  const axios = require('axios');
  // eslint-disable-next-line import/no-unresolved
  const touch = require('touch');
  // eslint-disable-next-line import/no-unresolved
  const path = require('path-extra');

  function log(msg) {
    if (inputs.log === true) {
      // eslint-disable-next-line no-console
      console.log(msg);
    }
  }

  async function getFileData(filePath, extensions, server) {
    const originalExtension = path.extname(filePath).split('.')[1];
    if (extensions.indexOf(originalExtension) > -1) {
      extensions.splice(extensions.indexOf(originalExtension), 1);
    }
    extensions.unshift(originalExtension);
    let httpResponse = null;

    for (let i = 0; i < extensions.length; i += 1) {
      const fileName = path.replaceExt(filePath, `.${extensions[i]}`);
      log(`Fetching file object for ${fileName}...`);
      // eslint-disable-next-line  no-await-in-loop
      httpResponse = await axios.post(`http://${server}:8265/api/v2/search-db`, {
        data: {
          string: fileName,
          lessThanGB: 10000,
          greaterThanGB: 0,
        },
      });

      if (httpResponse.status === 200) {
        if (httpResponse.data.length > 0) {
          log(`Got response for ${fileName}`);
          return httpResponse;
        }
        log(`Response for ${fileName} is empty`);
      } else {
        log(`API request for ${filePath} failed.`);
      }
    }
    log('Could not get file info from API, giving up.');
    return httpResponse;
  }

  const responseData = {
    file,
    removeFromDB: false,
    updateDB: false,
    infoLog: '',
  };

  try {
    if (!inputs.server || inputs.server.trim() === '') {
      responseData.infoLog += 'Tdarr server name/IP not configured in library transcode options\n';
      return responseData;
    }

    log('Waiting 5 seconds...');

    let { extensions } = inputs;
    if (!extensions || extensions.trim() === '') {
      extensions = librarySettings.containerFilter;
    }
    extensions = extensions.split(',');

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await getFileData(file._id, extensions, inputs.server);

    if (response.data.length > 0) {
      log('Changing date...');
      touch.sync(file._id, { time: Date.parse(response.data[0].statSync.mtime), force: true });
      log('Done.');
      responseData.infoLog += 'File timestamps updated or match original file\n';
      return responseData;
    }
    responseData.infoLog += `Could not find file using API using ${inputs.server}\n`;
    return responseData;
  } catch (err) {
    log(err);
  }

  return responseData;
};

module.exports.details = details;
module.exports.plugin = plugin;
