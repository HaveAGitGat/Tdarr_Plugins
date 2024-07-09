module.exports.dependencies = [
  'request',
];

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_MC93_MigzPlex_Autoscan',
  Stage: 'Post-processing',
  Name: 'Send Request For File To Be Scanned By Plex_autoscan.',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Send request for file to be scanned by plex_autoscan. https://github.com/l3uddz/plex_autoscan \n\n',
  Version: '1.2',
  Tags: '3rd party,post-processing,configurable',

  Inputs: [{
    name: 'autoscan_address',
    type: 'string',
    defaultValue: 'http://192.168.0.10',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               Enter the IP address/URL for autoscan. Must include http(s)://

               \\nExample:\\n
               http://192.168.0.10

               \\nExample:\\n
               https://subdomain.domain.tld`,
  },
  {
    name: 'autoscan_port',
    type: 'string',
    defaultValue: '3468',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               Enter the port Autoscan is using, default is 3468

               \\nExample:\\n
               3468`,
  },
  {
    name: 'autoscan_passkey',
    type: 'string',
    defaultValue: '9c4b81fe234e4d6eb9011cefe514d915',
    inputUI: {
      type: 'text',
    },
    tooltip: `

               Enter the autoscan passkey.

               \\nExample:\\n
               9c4b81fe234e4d6eb9011cefe514d915`,
  },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved
  const request = require('request');

  // Set up required variables.
  const ADDRESS = inputs.autoscan_address;
  const PORT = inputs.autoscan_port;
  const PASSKEY = inputs.autoscan_passkey;
  let filepath = '';
  const response = {};
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
      // eslint-disable-next-line no-console
      console.error(error);
    }
    // eslint-disable-next-line no-console
    console.log(`statusCode: ${res.statusCode}`);
    // eslint-disable-next-line no-console
    console.log(body);
  });

  // eslint-disable-next-line no-console
  console.log('request next');
  // eslint-disable-next-line no-console
  console.log(request.post);

  return undefined;
};

module.exports.details = details;
module.exports.plugin = plugin;
