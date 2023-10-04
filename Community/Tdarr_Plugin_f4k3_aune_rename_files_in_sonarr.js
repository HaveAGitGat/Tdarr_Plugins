module.exports.dependencies = [
  'axios',
  'http',
  'https',
];

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_f4k3_aune_rename_files_in_sonarr',
  Stage: 'Post-processing',
  Name: 'Rename files in Sonarr',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Renames the files in the current show in Sonarr according to naming format. This is done using the Sonarr API. To do this action it needs the Show ID. This code attempts to retrieve the Show ID by using the folder name of the series. To rename the correct file we need the season and episode number. To find this SXXEXX needs to be present in the file name.`,
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
    infoLog: 'Rename Sonarr files starting.',
  };

  console.log("Rename Sonarr files starting.")

  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const http = require('http');
  const https = require('https');
  const axios = require('axios');

  console.log("Loaded required packages.")

  // Defines variables
  const SSL = inputs.Url_Protocol;
  const IP = inputs.Url_Sonarr;
  const port = inputs.Sonarr_Port;
  const APIKey = inputs.Sonarr_APIKey;
  const sleepInterval = inputs.After_Sleep;
  const regex = '(S[0-9]{1,4}E[0-9]{1,2})';
  let seasonEpisodeMatch = "";
  let term = "";
  let termUri = "";
  const APIPathLookup = '/api/v3/series/lookup';
  const APIPathEpisodefile = '/api/v3/episodefile';
  const APIPathCommand = '/api/v3/command';
  const APICommand = 'RenameFiles';

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

  // Try to split file path to retrieve series folder name and season-episode number
  try {
    term = file.file.split('/');
    term = term[term.length - 3];
    termUri = encodeURI(term);

    // Use Regex to find SXXXXEXX part of file name and save it
    let seasonEpisodeMatch_tmp = file.file.toString().match(regex)
    if (seasonEpisodeMatch_tmp == null) {
      console.log(`Failed to find SXXEXX in filename.`)
      response.infoLog += `\nFailed to find SXXEXX in filename.`;
      return response
    } else {
      seasonEpisodeMatch = seasonEpisodeMatch_tmp[0];
    }
  } catch (e) {
    console.log(`Failed to split file name or find episode nr. Error: '${e}'.`)
    response.infoLog += `\nFailed to split file name or find episode nr. Error: '${e}'.`;
    return response
  }

  console.log(`Landed on '${seasonEpisodeMatch}'.`)
  response.infoLog += `\nLanded on '${seasonEpisodeMatch}'.`;

  console.log(`Searching for series '${term}'.`)
  response.infoLog += `\nSearching for series '${term}'.`;

  // Define variables to look for Series ID
  const url1 = `${SSL}://${IP}:${port}${APIPathLookup}?term=${termUri}&apikey=${APIKey}`;
  let url2 = ``;
  let url3 = ``;
  let SeriesID = 0;
  let url1_body = "";
  let url2_body = "";

  // API call to search for folder name to get Series ID
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

  // Create variables, parse API response to search for episode IDs of the Series ID
  try {
    const APIresponse = JSON.parse(url1_body);
    SeriesID = APIresponse[0].id;
    url2 = `${SSL}://${IP}:${port}${APIPathEpisodefile}?seriesId=${SeriesID}&includeImages=false&apikey=${APIKey}`;
    url3 = `${SSL}://${IP}:${port}${APIPathCommand}?apikey=${APIKey}`;
  } catch (e) {
    console.log(`Failed make JSON payload. Error: '${e}'.`);
    response.infoLog += `\nFailed make JSON payload. Error: '${e}'.`;
    return response;
  }

  // Create array variable for Episode IDs
  let fileArray = [];

  console.log(`Searching for episode files for show '${SeriesID}'.`)
  response.infoLog += `\nSearching for episode files for show '${SeriesID}'.`;

  // API call to find Episode IDs for Series ID
  try {
    await new Promise((resolve) => {
      connection_type.get(url2, (res) => {

        console.log(`Got status code '${res.statusCode}'.`)
        response.infoLog += `\nGot status code '${res.statusCode}'.`;

        res.on("data", function (chunk) {
          url2_body += chunk;
        });

        res.on('end', function () {
          resolve();
        });

      }).on('error', (e) => {
        console.log(`Failed to search for files for series. Error: '${e}'.`)
        response.infoLog += `\nFailed to search for files for series. Error: '${e}'.`;
        resolve();
      });
    });
  } catch (e) {
    console.log(`Failed API call. Error: '${e}'.`);
    response.infoLog += `\nFailed API call. Error: '${e}'.`;
    return response;
  }

  // Parse API response of episode files. Find the episode ID which matches the episode name of the file
  try {
    const APIresponse2 = JSON.parse(url2_body);
    for (let i = 0; i < APIresponse2.length; i++) {
      try {
        let tmp_match = APIresponse2[i].path.toString().match(regex)
        let tmp_match2 = tmp_match[0]
        if (tmp_match2 == seasonEpisodeMatch) {
          fileArray.push(APIresponse2[i].id)
        }
      } catch {
        continue;
      }
    }
    console.log(`Found '${fileArray.length}' files for series.`);
    response.infoLog += `\nFound '${fileArray.length}' files for series.`;
  } catch (e) {
    console.log(`Failed process episodes. Error: '${e}'.`);
    response.infoLog += `\nFailed process episodes. Error: '${e}'.`;
    return response;
  }

  console.log(`Renaming files for series '${SeriesID}'.`);
  response.infoLog += `\nRenaming files for series '${SeriesID}'.`;

  // API call to rename the found Episode IDs for the Series ID
  try {
    await new Promise((resolve) => {
      axios.post(url3, {
          name: APICommand,
          seriesId: SeriesID,
          files: fileArray
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