module.exports.dependencies = ['request'];

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_TD01_TOAD_Autoscan',
    Stage: 'Post-processing',
    Name: 'Trigger Autoscan.',
    Type: 'Video',
    Operation: '',
    Description: `Connects to autoscan and triggers a manual search within the files directory.\n\n
    Works with the hotio autoscan docker that can be found here https://hotio.dev/containers/autoscan/ which \n\n
    is based on https://github.com/cloudbox/autoscan`,
    Version: '1.0',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_TD01_TOAD_Autoscan.js',
    Tags: '3rd party,post-processing,configurable',

    Inputs: [
      {
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
    ],
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  // eslint-disable-next-line global-require,import/no-unresolved
  const request = require('request');
  // Set up required variables.
  const ADDRESS = inputs.autoscan_address;
  const PORT = inputs.autoscan_port;

  let filepath = '';
  const response = {};
  filepath = `${file.file}`;
  filepath = `${filepath
    .split('/')
    .slice(0, -1)
    .join('/')}/`;

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (!inputs.autoscan_address || !inputs.autoscan_port) {
    response.infoLog += '☒Plugin options have not been configured, please configure options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }

  // Set content of request/post.
  request.post(
    {
      headers: {
        'content-type': 'application/json',
      },
      url: `${ADDRESS}:${PORT}/triggers/manual?dir=${filepath}`,
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
    },
  );

  // eslint-disable-next-line no-console
  console.log('request next');
  // eslint-disable-next-line no-console
  console.log(request.post);

  return undefined;
};
