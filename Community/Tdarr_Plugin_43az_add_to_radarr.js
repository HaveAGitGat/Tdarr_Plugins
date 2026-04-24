/* eslint-disable */
// tdarrSkipTest
const details = () => {
  return {
    id: 'Tdarr_Plugin_43az_add_to_radarr',
    Stage: 'Post-processing',
    Name: 'Add Movie To Radarr After Processing',
    Type: 'Video',
    Operation: 'Transcode',
    Description: 'Add movie to Radarr after processing \n\n',
    Version: '1.00',
    Tags: '3rd party,post-processing,configurable',
    Inputs: [
      {
        name: 'server_ip',
        type:'string',
        defaultValue: '192.168.0.10',
        inputUI: {
          type: 'text',
        },
        tooltip: `
      Enter the server IP address
      
      \\nExample:\\n
      192.168.0.10
      `,
      },
      {
        name: 'port',
        type: 'string',
        defaultValue: '7878',
        inputUI: {
          type: 'text',
        },
        tooltip: `
      Enter the port Radarr is using

      \\nExample:\\n
      7878
      `,
      },
      {
        name: 'radarr_api_key',
        type: 'string',
        defaultValue: '3ff1ae1c39a2a2a397315e15266dea48',
        inputUI: {
          type: 'text',
        },
        tooltip: `
      
      Enter the Radarr API key. You can find it on Radarr at /settings/general
      
      \\nExample:\\n
      3ff1ae1c39a2a2a397315e15266dea48
      `,
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const request = require('request');
  const IP = inputs.server_ip;
  const { port } = inputs;
  const APIKey = inputs.radarr_api_key;

  let term = file.file.split('/');
  term = term[term.length - 1];
  term = term.split('.');
  term = term[term.length - 2];
  term = encodeURI(term);

  console.log(IP);
  console.log(term);

  request.get(
    `http://${IP}:${port}/api/movie/lookup?term=${term}&apikey=${APIKey}`,
    {
      json: {},
    },
    (error, res, body) => {
      if (error) {
        console.error(error);
      }
      //  console.log(`statusCode: ${res.statusCode}`)
      // console.log(body)

      const response = body[0];
      console.log(response.title); // e.g. Shrek
      response.profileId = 6;
      response.path = file.file;
      response.qualityProfile = 6;

      request.post(
        `http://${IP}:${port}/api/movie?apikey=${APIKey}`,
        {
          json: response,
        },
        (error, res, body) => {
          if (error) {
            console.error(error);
          }
          console.log(`statusCode: ${res.statusCode}`);
          // console.log(body)
        },
      );
    },
  );

  // Optional response if you need to modify database
  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  // return response
};



module.exports.details = details;
module.exports.plugin = plugin;