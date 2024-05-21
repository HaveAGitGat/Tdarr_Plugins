// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_goof1_URL_Plex_Refresh',
  Stage: 'Post-processing',
  Name: 'Refresh Plex Via URL',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Refreshes folder containing the current file in Plex so changes are picked up properly 
                without the use of external applications or other dockers`,
  Version: '1.0',
  Tags: '3rd party,post-processing,configurable',

  Inputs: [
    {
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
      name: 'Plex_Url',
      type: 'string',
      defaultValue: 'localhost',
      inputUI: {
        type: 'text',
      },
      tooltip: `
               Enter the IP address/URL for Plex.
               \\nExample:\\n
               192.168.0.10
               \\nExample:\\n
               subdomain.domain.tld`,
    },
    {
      name: 'Plex_Port',
      type: 'number',
      defaultValue: 32400,
      inputUI: {
        type: 'text',
      },
      tooltip: `
               The port required to access Plex on the network (may not be required if used with reverse proxy)
               \\nExample:\\n
               32400`,
    },
    {
      name: 'Plex_Token',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
               Auth token that is used to authenticate this commend on the Plex server. \\n
               Instructions for retrieving the token can be found here. \\n\\n
               https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/
               \\nExample:\\n
               ssQ_eXYYH3hxq3dviDdR`,
    },
    {
      name: 'Library_Key',
      type: 'string',
      defaultValue: '1',
      inputUI: {
        type: 'text',
      },
      tooltip: `
              Library key for the library in Plex where this content is displayed. \\n
              This number lets Plex know which library contains the current path needing a refresh. \\n
              See the below page under the 'Listing Defined Libraries' heading to find the key. \\n
              
              https://support.plex.tv/articles/201638786-plex-media-server-url-commands/ \\n
              
              *Note* If this number is wrong everything will behave as though it's
                working great but the folder will simply not be scanned. \\n\\n
              
              \\nExample:\\n
              29`,
    },
    {
      name: 'Plex_Path',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
              If the Plex path is not the same as the local path you may need to sub parts of the path. \\n
              Here is where you would enter the path that Plex uses to find the file. \\n
              You would only enter the part of the path that is different. \\n\\n
              If your TDarr path is: \\n
/media/local/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4\\n\\n
              
              And the Plex path to the file is: \\n
/data/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4 \\n
              then part you would enter here is:
               \\nExample:\\n
               /data/`,
    },
    {
      name: 'Tdarr_Path',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
              If the Plex path is not the same as the local path you may need to sub parts of the path. \\n
              Here is where you would enter the path that Plex uses to find the file. \\n
              You would only enter the part of the path that is different. \\n
              If your TDarr path is: \\n
/media/local/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4 \\n\\n
              
              And the Plex path to the file is:\\n
              /data/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4\\n
              then part you would enter here is:
               \\nExample:\\n
               /media/local/`,
    },
  ],
});

const checkReply = (response, statusCode, urlNoToken) => {
  if (statusCode === 200) {
    response.infoLog += '☒ Above shown folder scanned in Plex! \n';
  } else if (statusCode === 401) {
    response.infoLog += 'Plex replied that the token was not authorized on this server \n';
  } else if (statusCode === 404) {
    response.infoLog += `404 Plex not found, http/https is set properly? The URL used was 
  ${urlNoToken}[redacted] \n`;
  } else {
    response.infoLog += `There was an issue reaching Plex. The URL used was 
  ${urlNoToken}[redacted] \n`;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const http = require('http');
  const https = require('https');

  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
    processFile: false,
    infoLog: '',
  };

  const type = inputs.Url_Protocol;
  const url = inputs.Plex_Url;
  const port = inputs.Plex_Port;
  const token = inputs.Plex_Token;
  const key = inputs.Library_Key;
  const plexPath = inputs.Plex_Path;
  const tdarrPath = inputs.Tdarr_Path;

  if (!type || !url || !token || !key) {
    throw new Error('Url_Protocol, Plex_Url, Plex_Token, and Library_Key are all required');
  }

  let filePath = file.file.substring(0, file.file.lastIndexOf('/'));

  if ((tdarrPath && !plexPath) || (tdarrPath && plexPath)) {
    // tdarr: /local/tv && plex: ''/tv || tdarr: /local/tv && plex: /data/tv
    filePath = filePath.replace(tdarrPath, plexPath);
  } else if (!tdarrPath && plexPath) {
    // tdarr: ''/tv && plex: /data/tv
    filePath = filePath.replace(/^/, plexPath);
  }

  response.infoLog += `Attempting to update Plex path ${filePath} in library ${key}\n`;

  const portIfUsed = port ? `:${port}` : '';
  const urlNoToken = `${type}://${url}${portIfUsed}/library/sections/${key}/refresh?`
    + `path=${encodeURIComponent(filePath)}&X-Plex-Token=`;

  if (type === 'http') {
    await new Promise((resolve) => {
      http.get(urlNoToken + token, (res) => {
        checkReply(response, res.statusCode, urlNoToken);
        resolve();
      }).on('error', (e) => {
        response.infoLog += `We have encountered an error: ${e}`;
        resolve();
      });
    });
    return response;
  } if (type === 'https') {
    await new Promise((resolve) => {
      https.get(urlNoToken + token, { rejectUnauthorized: false }, (res) => {
        checkReply(response, res.statusCode, urlNoToken);
        resolve();
      }).on('error', (e) => {
        response.infoLog += `We have encountered an error: ${e}`;
        resolve();
      });
    });
    return response;
  }
  response.infoLog += `Plex could not be updated, \n
    the Url_Protocol can only be http or https. ${type} is not valid \n`;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
