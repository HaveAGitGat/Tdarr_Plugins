
const loadDefaultValues = require('../methods/loadDefaultValues');

const details = () => ({
  id: 'Tdarr_Plugin_goof1_URL_Plex_Refresh',
  Stage: 'Post-processing',
  Name: 'Refresh Plex via URL',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Refreshes folder containing the current file in Plex so changes are picked up properly.`,
  Version: '1.0',
  Tags: '3rd party,post-processing,configurable',

  Inputs: [
    {
      name: 'Url_Protocol',
      type: 'string',
      defaultValue: 'http',
      inputUI: {
        type: 'text',
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
               Enter the IP address/URL for Plex. Must include http(s)://

               \\nExample:\\n
               192.168.0.10

               \\nExample:\\n
               subdomain.domain.tld`,
    },
    {
      name: 'Plex_Port',
      type: 'string',
      defaultValue: '',
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
      defaultValue: 'ssQ_eXYYH3hxq3dviDdR',
      inputUI: {
        type: 'text',
      },
      tooltip: `
               Auth token that is used to authenticate this commend on the Plex server. 
               Instructions for retrieving the token can be found here.

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
              Library key for the library in Plex where this content is displayed. 

              See the below page under the 'Listing Defined Libraries' heading. 
              The Library key is pointed out here as an example. 
              This number will be used here for the library relevant to the content being transcoded within this TDarr library. 

              *Note* If this number is wrong everything will behave as though it's working great but the folder will simply not be scanned. 

              https://support.plex.tv/articles/201638786-plex-media-server-url-commands/

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
              If the Plex path is not the same as the local path you may need to sub parts of the path. 
              Here is where you would enter the path that Plex uses to find the file. You would only enter the part of the path that is different.

              If your TDarr path is:
              /media/local/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4
              
              And the Plex path to the file is:
              /data/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4

              then part you would enter here is:

               \\nExample:\\n
               /data/`,
    },
    {
      name: 'TDarr_Path',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
              If the Plex path is not the same as the local path you may need to sub parts of the path. 
              Here is where you would enter the path that Plex uses to find the file. You would only enter the part of the path that is different.

              If your TDarr path is:
              /media/local/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4
              
              And the Plex path to the file is:
              /data/tv/The Best Show Evaaaarr/Season 2/The Best Show Evaaaarr - S02E31 - Heck Yea HDTV-720p.mp4

              then part you would enter here is:

               \\nExample:\\n
               /media/local/`,
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  inputs = loadDefaultValues(inputs, details);

  let response = {
    file,
    removeFromDB: false,
    updateDB: false,
    infoLog: '',
  };

  const http = require('http')
  const https = require('https')

  const type = inputs.Url_Protocol
  const url = inputs.Plex_Url
  const port = inputs.Plex_Port
  const token = inputs.Plex_Token
  const key = inputs.Library_Key
  const plexPath = inputs.Plex_Path
  const tdarrPath = inputs.TDarr_Path

  if (!type || !url || !token || !key) {
    response.infoLog = `Url_Protocol, Plex_Url, Plex_Token, and Library_Key are all required`
    response.processFile = false
    return response
  }


  let filePath = file.file
  filePath = filePath.substring(0, filePath.lastIndexOf("/"));

  if (tdarrPath || plexPath) {
    filePath = filePath.replace(tdarrPath, plexPath)
  }

  response.infoLog += `Attempting to update Plex path ${filePath} in library ${key}\n`

  const fullUrl = `${type}://${url}${port ? `:${port}` : ''}/library/sections/${key}/refresh?path=${filePath}&X-Plex-Token=${token}`
  const redactedUrl = `${type}://${url}${port ? `:${port}` : ''}/library/sections/${key}/refresh?path=${filePath}&X-Plex-Token=[redacted]`

  if (type === 'http') {
    http.get(fullUrl, (res) => {
      checkReply(res.statusCode, redactedUrl)
      return response
    }).on('error', (e) => {
      response.infoLog += `We have encountered an error: ${e}`
      return response
    });
  } else if (type === 'https') {
    https.get(fullUrl, (res) => {
      checkReply(res.statusCode, redactedUrl)
      return response
    }).on('error', (e) => {
      response.infoLog += `We have encountered an error: ${e}`
      return response
    });
  } else {
    response.infoLog += `Plex could not be updated, the Url_Protocol can only be http or https. ${type} is not valid \n`
    return response
  }
};

function checkReply(statusCode, redactedUrl) {
  if (statusCode == 200) {
    response.infoLog += `☒ Above shown folder scanned in Plex! \n`
  } else if (statusCode == 401) {
    response.infoLog += `Plex replied that the token was not authorized on this server \n`
  } else if (statusCode == 404) {
    response.infoLog += `404 Plex not found, http/https is set properly? The URL used was 
    ${redactedUrl} \n`
  } else {
    response.infoLog += `There was an issue reaching Plex. The URL used was 
    ${redactedUrl} \n`
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
