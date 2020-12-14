/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_MC93_MigzPlex_Autoscan',
    Stage: 'Post-processing',
    Name: 'Send request for file to be scanned by plex_autoscan.',
    Type: 'Video',
    Operation: '',
    Description: 'Send request for file to be scanned by plex_autoscan. https://github.com/l3uddz/plex_autoscan \n\n',
    Version: '1.2',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_MigzPlex_Autoscan.js',
    Tags: '3rd party,post-processing,configurable',

    Inputs: [{
      name: 'autoscan_address',
      tooltip: `
               Enter the IP address/URL for autoscan. Must include http(s)://

               \\nExample:\\n
               http://192.168.0.10

               \\nExample:\\n
               https://subdomain.domain.tld`,
    },
    {
      name: 'autoscan_port',
      tooltip: `
               Enter the port Autoscan is using, default is 3468

               \\nExample:\\n
               3468`,
    },
    {
      name: 'autoscan_passkey',
      tooltip: `

               Enter the autoscan passkey.

               \\nExample:\\n
               9c4b81fe234e4d6eb9011cefe514d915`,
    },
    ],
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  // Set up required variables.
  const request = require('request');
  const ADDRESS = inputs.autoscan_address;
  const PORT = inputs.autoscan_port;
  const PASSKEY = inputs.autoscan_passkey;
  let filepath = '';
  const response = '';
  filepath = `${file.file}`;

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (
    inputs
    && inputs.autoscan_address === ''
    && inputs.autoscan_port === ''
    && inputs.autoscan_passkey === ''
  ) {
    response.infoLog += '☒Plugin options have not been configured, please configure options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }

  // Set content of request/post.
  request.post({
    headers: {
      'content-type': 'application/json',
    },
    url: `${ADDRESS}:${PORT}/${PASSKEY}`,
    form: {
      eventType: 'Manual',
      filepath: `${filepath}`,
    },
  },
  (error, res, body) => {
    if (error) {
      console.error(error);
    }
    console.log(`statusCode: ${res.statusCode}`);
    console.log(body);
  });

  console.log('request next');
  console.log(request.post);
};
