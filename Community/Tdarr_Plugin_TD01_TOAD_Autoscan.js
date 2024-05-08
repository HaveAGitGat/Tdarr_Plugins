/* eslint-disable linebreak-style */
module.exports.dependencies = [
  'request',
];

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_TD01_TOAD_Autoscan',
  Stage: 'Post-processing',
  Name: 'Trigger Plex_Autoscan.',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Connects to plex_autoscan and triggers a manual search within the files directory.\n\n
    Works with the hotio autoscan docker that can be found here https://hotio.dev/containers/autoscan/ which \n\n
    is based on https://github.com/cloudbox/autoscan`,
  Version: '1.0',
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
    defaultValue: '3486',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               Enter the port Autoscan is using, default is 3468

               \\nExample:\\n
               3468`,
  },
  {
    name: 'autoscan_username',
    type: 'string',
    defaultValue: 'Batman',
    inputUI: {
      type: 'text',
    },
    tooltip: `
               If authentication is configured, specify the username

               \\nExample:\\n
               Batman`,
  },
  {
    name: 'autoscan_password',
    type: 'string',
    defaultValue: 'SecretPassword',
    inputUI: {
      type: 'text',
    },
    tooltip: `
              If authentication is configured, specify the password

               \\nExample:\\n
               SecretPassword`,
  },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved,import/no-extraneous-dependencies
  const request = require('request');
  // Set up required variables.
  const ADDRESS = inputs.autoscan_address;
  const PORT = inputs.autoscan_port;

  let auth;
  if (inputs.autoscan_username) {
    auth = `Basic ${Buffer.from(`${inputs.autoscan_username}:${inputs.autoscan_password}`).toString('base64')}`;
  }

  let filepath = '';
  const response = {};
  filepath = `${file.file.split('/').slice(0, -1).join('/')}/`;
  filepath = encodeURIComponent(filepath);

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (
    inputs
    && inputs.autoscan_address === ''
    && inputs.autoscan_port === ''
  ) {
    response.infoLog += '☒Plugin options have not been configured, please configure options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }

  // Set content of request/post.
  request.post({
    headers: {
      'content-type': 'application/json',
      Authorization: auth,
    },
    url: `${ADDRESS}:${PORT}/triggers/manual?dir=${filepath}`,
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (error, res, body) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  });
  return undefined;
};

module.exports.details = details;
module.exports.plugin = plugin;
