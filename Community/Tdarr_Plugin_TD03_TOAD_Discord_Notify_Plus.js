/* eslint-disable block-scoped-var,linebreak-style */
module.exports.dependencies = ['axios'];

module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_TD03_TOAD_Discord_Notify_Plus',
    Stage: 'Post-processing',
    Name: 'Send Discord Notification - Plus.',
    Type: 'Video',
    Operation: '',
    Description: 'Send notification to a Discord webhook along with artwork taken from either Sonarr or Radarr. \n \n ',
    Version: '0.8',
    Link: '',
    Tags: '3rd party,post-processing,configurable',

    Inputs: [
      {
        name: 'discord_url',
        tooltip: `
                   Enter the full URL for the discord webhook. Must include https://
    
                   \\n Example:\\n 
                   https://discord.com/api/webhooks/.....`,
      },
      {
        name: 'sonarr_url',
        tooltip: `
                   Enter the full URL for the sonarr instance, including port. Must include http(s)://
    
                   \\n Example:\\n 
                   http://192.168.0.50:8989`,
      },
      {
        name: 'sonarr_api',
        tooltip: `
                   Enter the api key for sonarr
    
                   \\n Example:\\n 
                   4545sdffds45sdf4sds`,
      },
      {
        name: 'radarr_url',
        tooltip: `
                   Enter the full URL for the radarr instance, including port. Must include http(s)://
    
                   \\n Example:\\n 
                   http://192.168.0.50:8989`,
      },
      {
        name: 'radarr_api',
        tooltip: `
                   Enter the api key for radarr
    
                   \\n Example:\\n 
                   4545sdffds45sdf4sds`,
      },
      {
        name: 'debug_enabled',
        tooltip: `
                   Enter true or false to toggle enhanced console logging - default is false
    
                   \\n Example:\\n 
                   true`,
      },
    ],
  };
};

module.exports.plugin = async function plugin(file, librarySettings, inputs, otherArguments) {
  // plugin basic prep

  const response = {
    infoLog: '',
  };
  // eslint-disable-next-line global-require,import/no-unresolved
  const axios = require('axios');

  // Variable setup

  let debugmode = false; // default debug mode to false
  const { discord_url } = inputs; // maps the discord url from inputs
  const { sonarr_url } = inputs; // maps the sonarr url from inputs
  const { sonarr_api } = inputs; // maps the sonarr api key from inputs
  const { radarr_url } = inputs; // maps the radarr url from inputs
  const { radarr_api } = inputs; // maps the radarr api key from inputs
  let filesize_name = ''; // prepares for the formatted filesize variable
  let poster_url = ''; // for the poster thumpnail url from either Sonarr or Radarr
  let transcoderesult = ''; // holds the transcoder result from the Tdarr file object
  let oldfilesize = ''; // holds the old file size
  const fields = []; // blank array in prep for the Discord fields
  let sonarrresponse = '';
  let radarrresponse = '';
  let discordresponse = '';
  let tmp = '';
  let subfooter = 'Subtitles:';
  let matchingresult = '';
  let fileimdbId = [];

  // get the file name from the full path
  let filename = file.file.split('/');
  filename = filename[filename.length - 1];

  // get the file path by removing the file name
  const filepath = file.file
    .split('/')
    .slice(0, -1)
    .join('/');
  // eslint-disable-next-line max-len
  const seasonfilepath = file.file
    .split('/')
    .slice(0, -2)
    .join('/'); // removes an extra folder if season folders are not enabled

  // regex used to find the IMDB ID within a file name - tt followed by 7 or 8 digits
  if (filename.match(/tt\d{7,8}/)) {
    fileimdbId = filename.match(/tt\d{7,8}/);
  }

  // useful functions

  // Controls enhanced logging should debug mode be enabled
  function consoleLog(message) {
    switch (debugmode) {
      case true:
        // eslint-disable-next-line no-console
        console.log(`[D-PLUS] ${message}`);
        break;
      default:
        break;
    }
  }

  // Formats certain words to capitalise the first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Formats the file size from bytes to a more readible format
  function convertBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) {
      return 'n/a';
    }
    // eslint-disable-next-line radix
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i === 0) {
      return `${bytes} ${sizes[i]}`;
    }
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  }

  // Begin Plugin

  // Check if debug mode is enabled and if so, log some key information
  if (inputs.debug_enabled === 'true') {
    debugmode = true;
    consoleLog(`Discord plus plugin processing ${file.file} with debug logging enabled...`);
    consoleLog(`tdarr url is ${inputs.tdarr_url}`); // str.replace(str.substring(4,11), "*******")
    consoleLog(
      `discord url is ${inputs.discord_url.replace(inputs.discord_url.substring(40, 100), '****************')}`,
    );
    consoleLog(`sonarr url is ${inputs.sonarr_url.replace(inputs.sonarr_url.substring(7, 14), '*******')}`);
    consoleLog(`sonarr api is ${inputs.sonarr_api.replace(inputs.sonarr_api.substring(6, 20), '*******')}`);
    consoleLog(`radarr url is ${inputs.radarr_url.replace(inputs.radarr_url.substring(6, 20), '*******')}`);
    consoleLog(`radarr api is ${inputs.radarr_api.replace(inputs.radarr_api.substring(3, 9), '*******')}`);
    consoleLog(`Filepath is ${filepath}`);
    consoleLog(`Season filepath is ${seasonfilepath}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Discord plus plugin processing ${file.file} with debug logging disabled...`);
  }

  // Check if key inputs have been configured. If they haven't then exit plugin.
  if (discord_url.toLowerCase().indexOf('https://') === -1 || typeof discord_url === 'undefined') {
    response.infoLog += '☒Plugin options have not been configured, please configure options. \n ';
    // eslint-disable-next-line no-console
    console.log('Discord URL is empty or not in the correct format');
    response.processFile = false;
    return response;
  }
  consoleLog('Discord URL configured correctly');

  // Take the file size from the new file and format it
  if (file.file_size) {
    filesize_name = convertBytes(file.file_size * 1048576);
    consoleLog(`File size is ${filesize_name}`);
  } else {
    filesize_name = '0';
  }

  // Take the file size from the old file and format it
  if (typeof otherArguments.originalLibraryFile.file_size !== 'undefined') {
    oldfilesize = convertBytes(otherArguments.originalLibraryFile.file_size * 1048576);
    consoleLog(`Old file size is ${oldfilesize}`);
  } else {
    oldfilesize = '0';
  }

  // Check the transcode result and format the queued response more clearly
  if (file.TranscodeDecisionMaker === 'Queued') {
    transcoderesult = 'Re-Queued';
  } else transcoderesult = file.TranscodeDecisionMaker;

  // Checking Tdarr for the original file size
  consoleLog(`Original file size is ${oldfilesize}`);

  // Let's get some data from Sonarr to see if the poster URL can be grabbed
  if (inputs.sonarr_url) {
    const sonarrRequest = async () => {
      try {
        sonarrresponse = await axios.get(`${sonarr_url}/api/series?apikey=${sonarr_api}`);
        return sonarrresponse.data;
      } catch (err) {
        consoleLog(`There was an error: ${err}`);
        return err;
      }
    };

    try {
      const sonarrResult = await sonarrRequest();
      consoleLog(`Sonarr returned ${sonarrResult.length} records`);
      if (sonarrResult.length > 0) {
        for (let i = 0; i < sonarrResult.length; i += 1) {
          if (sonarrResult[i].imdbId || sonarrResult[i].path) {
            // compare either the imdb, filepath or season file path against the results until a match is found
            // eslint-disable-next-line max-len
            if (
              sonarrResult[i].path === filepath // matches on imdb ID
              || sonarrResult[i].path === seasonfilepath // matches on folder path
              || sonarrResult[i].imdbId === fileimdbId // matches on folder path minus series folder
            ) {
              // eslint-disable-next-line max-len
              if (sonarrResult[i].imdbId === fileimdbId) {
                matchingresult = `IMDB ID ${fileimdbId}`;
              } else if (sonarrResult[i].path === filepath) {
                matchingresult = `File Path ${filepath}`;
              } else {
                matchingresult = `Season Path ${seasonfilepath}`;
              }
              // eslint-disable-next-line max-len
              response.infoLog += `☑ The matched show from Sonarr is ${sonarrResult[i].title} using the ${matchingresult}   \n  `;
              consoleLog(`The matched show from Sonarr is ${sonarrResult[i].title} using the ${matchingresult}`);
              if (sonarrResult[i].images) {
                const sonarr_poster = sonarrResult[i].images.find((item) => item.coverType === 'poster');
                poster_url = sonarr_poster.remoteUrl;
                consoleLog(`Poster URL taken from Sonarr: ${poster_url}`);
              }
              break;
            }
          }
        }
      }
    } catch (err) {
      consoleLog('There was an error with Sonarr');
      consoleLog(err);
    }
  }

  // Let's get some data from Radarr to see if the poster URL can be grabbed
  if (inputs.radarr_url) {
    if (poster_url === '') {
      const radarrRequest = async () => {
        try {
          radarrresponse = await axios.get(`${radarr_url}/api/v3/movie?apikey=${radarr_api}`);
          return radarrresponse.data;
        } catch (err) {
          consoleLog(`There was an error: ${err}`);
          return err;
        }
      };

      try {
        const radarr_result = await radarrRequest();
        consoleLog(`Radarr returned ${radarr_result.length} records`);
        if (radarr_result.length > 0) {
          for (let i = 0; i < radarr_result.length; i += 1) {
            if (radarr_result[i].imdbId || radarr_result[i].path) {
              // eslint-disable-next-line max-len
              if (
                radarr_result[i].imdbId === fileimdbId // matches on imdb ID
                || radarr_result[i].path === filepath // matches on folder path
                || radarr_result[i].path === seasonfilepath // matches on folder path minus series folder
              ) {
                if (radarr_result[i].imdbId === fileimdbId) {
                  matchingresult = `IMDB ID ${fileimdbId}`;
                } else if (radarr_result[i].path === filepath) {
                  matchingresult = `File Path ${filepath}`;
                } else {
                  matchingresult = `Season Path ${seasonfilepath}`;
                }
                // eslint-disable-next-line max-len
                response.infoLog += `☑ The matched movie from Radarr is ${radarr_result[i].title} using the ${matchingresult}   \n  `;
                consoleLog(`The matched movie from Radarr is ${radarr_result[i].title} using the ${matchingresult}`);
                if (radarr_result[i].images) {
                  const radarr_poster = radarr_result[i].images.find((item) => item.coverType === 'poster');
                  poster_url = radarr_poster.remoteUrl;
                  consoleLog(`Poster URL taken from Radarr: ${poster_url}`);
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        consoleLog('There was an error with Radarr');
        consoleLog(err);
      }
    } else {
      consoleLog('Poster url already found, skipping Radarr');
    }
  } else {
    consoleLog('Radarr not enabled');
  }

  // build the discord embded object
  fields.push({ name: 'Result', value: `${transcoderesult}`, inline: true });
  fields.push({ name: 'File Size', value: `${filesize_name}`, inline: true });
  if (transcoderesult !== 'Not required') {
    // we don't need to show the original file size if nothing was done
    fields.push({ name: 'Previous Size', value: `${oldfilesize}`, inline: true });
  } else {
    fields.push({ name: 'Previous Size', value: 'n/a', inline: true });
  }
  fields.push({ name: 'File', value: `${file.file}`, inline: false });

  // if the file contains a video track, add in the resolution
  switch (file.fileMedium) {
    case 'video':
      fields.push({ name: 'Type', value: `${capitalizeFirstLetter(file.fileMedium)}`, inline: true });
      fields.push({ name: 'Resolution', value: `${file.video_resolution}`, inline: true });
      // todo something with bitrate
      /* if (typeof file.bit_rate !== 'undefined'){
    fields.push({ name: 'Bitrate', value: `${convertBytes(file.bit_rate)}`, inline: true });
  } */
      break;
    default:
      fields.push({ name: 'Type', value: `${file.fileMedium}`, inline: false });
      break;
  }
  // if ffProbeRead data is available, loop through and add each stream to the object
  if (file.ffProbeRead === 'success') {
    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      // eslint-disable-next-line max-len
      // Discord has a max embed quantity of 25 - 6 are taken already so this leaves 20 for the streams. Any more will be cropped.

      if (i < 25) {
        // eslint-disable-next-line max-len
        switch (file.ffProbeData.streams[i].codec_type) {
          case 'subtitle':
            // eslint-disable-next-line max-len
            subfooter += ` Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)} Codec ( ${
              file.ffProbeData.streams[i].codec_name
            } ) Lang ( ${file.ffProbeData.streams[i].tags.language} ) Title ( ${
              file.ffProbeData.streams[i].tags.title
            } ) |`;
            break;
          case 'video':
            if (typeof file.ffProbeData.streams[i].tags.language !== 'undefined') {
              // eslint-disable-next-line max-len
              tmp = {
                name: `Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)}`,
                // eslint-disable-next-line max-len
                value: `Codec ( ${file.ffProbeData.streams[i].codec_name} ) Lang ( ${file.ffProbeData.streams[i].tags.language} )`,
                inline: true,
              };
              fields.push(tmp);
            } else {
              // eslint-disable-next-line max-len
              tmp = {
                name: `Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)}`,
                value: `Codec ( ${file.ffProbeData.streams[i].codec_name} )`,
                inline: true,
              };
              fields.push(tmp);
            }
            break;
          case 'audio':
            if (typeof file.ffProbeData.streams[i].tags !== 'undefined') {
              // eslint-disable-next-line max-len
              tmp = {
                name: `Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)}`,
                // eslint-disable-next-line max-len
                value: `Codec ( ${file.ffProbeData.streams[i].codec_name} ) Chans ( ${file.ffProbeData.streams[i].channels} ) Lang ( ${file.ffProbeData.streams[i].tags.language} )`,
                inline: true,
              };
              fields.push(tmp);
            } else {
              // eslint-disable-next-line max-len
              tmp = {
                name: `Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)}`,
                // eslint-disable-next-line max-len
                value: `Codec ( ${file.ffProbeData.streams[i].codec_name} ) Chans ( ${file.ffProbeData.streams[i].channels} )`,
                inline: true,
              };
              fields.push(tmp);
            }
            break;
          default:
            // eslint-disable-next-line max-len
            // tmp = { name: `Stream ${i} - ${capitalizeFirstLetter(file.ffProbeData.streams[i].codec_type)}`, value: `${file.ffProbeData.streams[i].codec_type} (${file.ffProbeData.streams[i].codec_name})`, inline: true };
            break;
        }
      } else consoleLog('Max embed limit reached');
    }
    consoleLog('End of Streams loop');
    consoleLog(`Final fields quantity added to Discord is ${fields.length}`);
  } else consoleLog('No ffProbeRead data');

  // starting new discord notification code
  // Let's get some data from Sonarr to see if the poster URL can be grabbed

  const data = JSON.stringify({
    embeds: [
      {
        title: `${filename}`,
        description: '',
        thumbnail: {
          url: `${poster_url}`,
        },
        fields,
        footer: {
          text: `${subfooter}`,
        },
      },
    ],
  });

  const discordPost = async () => {
    try {
      discordresponse = await axios.post(`${discord_url}?wait=true`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return discordresponse.status;
    } catch (err) {
      consoleLog(`There was an error: ${err}`);
      return err;
    }
  };

  try {
    discordresponse = await discordPost();
    consoleLog(`Discord returned response ${discordresponse}`);
    response.infoLog += '☑ Discord notified  \n  ';
  } catch (err) {
    consoleLog('There was an error with Discord');
    response.infoLog += '☒ Discord failed  \n ';
    consoleLog(err);
  }

  /* // Discord Notification
  consoleLog('Starting discord notify');
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const discordresponse = await postDiscordNotification();

  if (discordresponse.status === 200) {
    response.infoLog += '☑ Discord notified  \n  ';
  } else {
    response.infoLog += '☒ Discord failed  \n ';
    // eslint-disable-next-line no-console
    console.log(`Discord failed with error ${discordresponse.status}`);
  } */

  return response;
};
