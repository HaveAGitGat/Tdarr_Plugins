module.exports.dependencies = [
  'axios',
  'http',
  'https',
];

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_f4k2_aune_refresh_files_in_sonarr',
  Stage: 'Post-processing',
  Name: 'Refresh files in Sonarr',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Refreshes folder containing the current show in Sonarr so files are mapped properly. 
  This is done using the Sonarr API. To do this action it needs the Show ID. 
  This code attempts to retrieve the Show ID by using the folder name of the series.`,
  Version: '1.0',
  Tags: '3rd party,post-processing,configurable',

  Inputs: [{
    name: 'Url_Protocol',
    type: 'string',
    defaultValue: 'http',
    inputUI: {
      type: 'dropdown',
      options: [
        'http',
        'https',
      ],
    },
    tooltip: `
               Specified the type of request to make, http:// or https://
               \\nExample:\\n
               http
               \\nExample:\\n
               https`,
  },
  {
    name: 'Url_Sonarr',
    type: 'string',
    defaultValue: 'localhost',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               Enter the IP address/URL Tdarr uses to reach Sonarr.
               \\nExample:\\n
               192.168.0.10
               \\nExample:\\n
               subdomain.domain.tld`,
  },
  {
    name: 'Sonarr_Port',
    type: 'number',
    defaultValue: 8989,
    inputUI: {
      type: 'text',
    },
    tooltip: `
               The port required to access Sonarr
               \\nExample:\\n
               8989`,
  },
  {
    name: 'Sonarr_APIKey',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               Enter the Sonarr API key. \\n
               You can find it within Sonarr at /settings/general. \\n\\n
               \\nExample:\\n
               3ff1ae1c39a2a2a397315e15266dea48`,
  },
  {
    name: 'After_Sleep',
    type: 'number',
    defaultValue: 0,
    inputUI: {
      type: 'text',
    },
    tooltip: `
               How many ms should Tdarr sleep to wait for Sonarr to finish afterward? \\n
               \\nExample:\\n
               1000`,
  },
  ],
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {

  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
    processFile: false,
    infoLog: 'Refresh Sonarr files starting.',
  };

  console.log("Refresh Sonarr files starting.")

  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const http = require('http');
  const https = require('https');
  const axios = require('axios');

  console.log("Loaded required packages.")

  // Create variables
  const SSL = inputs.Url_Protocol;
  const IP = inputs.Url_Sonarr;
  const port = inputs.Sonarr_Port;
  const APIKey = inputs.Sonarr_APIKey;
  const sleepInterval = inputs.After_Sleep;
  let term = "";
  let termUri = "";
  const APIPathLookup = '/api/v3/series/lookup';
  const APIPathCommand = '/api/v3/command';
  const APICommand = 'RefreshSeries';

  // Check variables are given
  if (!SSL || !IP || !APIKey || !port) {
    throw new Error('All fields are required.');
  }

  // Select connection type
  let connection_type = null;
  try {
    if (SSL == "http") {
      connection_type = http
    } else {
      connection_type = https
    }
  } catch (e) {
    console.log(`Failed to compare SSL string. Error: ${e}`);
    connection_type = http
  }

  // Try to split file path to retrieve series folder name
  try {
    term = file.file.split('/');
    term = term[term.length - 3];
    termUri = encodeURI(term);
  } catch (e) {
    console.log(`Failed to split file name. Error: '${e}'.\n`)
    response.infoLog += `\nFailed to split file name. Error: '${e}'.`;
    return response
  }

  console.log(`Searching for series '${term}'.`)
  response.infoLog += `\nSearching for series '${term}'.`;

  // Create variables for API call
  const url1 = `${SSL}://${IP}:${port}${APIPathLookup}?term=${termUri}&apikey=${APIKey}`;
  let url1_body = "";
  let url2 = ``;
  let SeriesID = 0;

  // API call to search for Series ID using the folder name
  try {
    await new Promise((resolve) => {
      connection_type.get(url1, (res) => {

        console.log(`Got status code '${res.statusCode}'.`)
        response.infoLog += `\nGot status code '${res.statusCode}'.`;

        res.on("data", function (chunk) {
          url1_body += chunk;
        });

        res.on('end', function () {
          resolve();
        });

      }).on('error', (e) => {
        console.log(`Failed to search for series. Error: '${e}'.`)
        response.infoLog += `\nFailed to search for series. Error: '${e}'.`;
        resolve();
      });
    });
  } catch (e) {
    console.log(`Failed API call. Error: '${e}'.`);
    response.infoLog += `\nFailed API call. Error: '${e}'.`;
    return response;
  }

  // Parse API response and save the Series ID
  try {
    const APIresponse = JSON.parse(url1_body);
    SeriesID = APIresponse[0].id;
    url2 = `${SSL}://${IP}:${port}${APIPathCommand}?apikey=${APIKey}`;
  } catch (e) {
    console.log(`Failed make JSON payload. Error: '${e}'.`);
    response.infoLog += `\nFailed make JSON payload. Error: '${e}'.`;
    return response;
  }

  console.log(`Refreshing series '${SeriesID}'.`);
  response.infoLog += `\nRefreshing series '${SeriesID}'.`;

  // API request to send a command to refresh the files for the found Series ID
  try {
    await new Promise((resolve) => {
      axios.post(url2, {
        name: APICommand,
        seriesId: SeriesID
      })
        .then(function (res) {
          console.log(`Got status code '${res.status}'.`)
          response.infoLog += `\n☑ Got status code '${res.status}'.`;
          resolve();
        })
        .catch(function (error) {
          console.log(`Got error: ${error}`)
          response.infoLog += `\nGot error: ${error}`;
          resolve();
        });
    });
  } catch (e) {
    console.log(`Failed API call. Error: '${e}'.`);
    response.infoLog += `\nFailed API call. Error: '${e}'.`;
    return response;
  }

  // Sleep for set amount of time
  console.log(`Sleeping '${sleepInterval}' ms.`);
  response.infoLog += `\nSleeping '${sleepInterval}' ms.`;
  await sleep(sleepInterval);

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;