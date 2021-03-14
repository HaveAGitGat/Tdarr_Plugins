/* eslint-disable */
module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_43az_add_to_radarr",
    Stage: "Post-processing",
    Name: "Add movie to Radarr after processing",
    Type: "Video",
    Operation: "",
    Description: `Add movie to Radarr after processing \n\n`,
    Version: "1.00",
    Link: "",
    Tags: "3rd party,post-processing,configurable",

    Inputs: [
      {
        name: "server_ip",
        tooltip: `
      Enter the server IP address
      
      \\nExample:\\n
      192.168.0.10
      `,
      },
      {
        name: "port",
        tooltip: `
      Enter the port Radarr is using

      \\nExample:\\n
      7878
      `,
      },
      {
        name: "radarr_api_key",
        tooltip: `
      
      Enter the Radarr API key. You can find it on Radarr at /settings/general
      
      \\nExample:\\n
      3ff1ae1c39a2a2a397315e15266dea48
      `,
      },
    ],
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  const request = require("request");
  const IP = inputs.server_ip;
  const port = inputs.port;
  const APIKey = inputs.radarr_api_key;

  var term = file.file.split("/");
  term = term[term.length - 1];
  term = term.split(".");
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
      //console.log(body)

      var response = body[0];
      console.log(response.title); //e.g. Shrek
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
        }
      );
    }
  );

  //Optional response if you need to modify database
  var response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  //return response
};
