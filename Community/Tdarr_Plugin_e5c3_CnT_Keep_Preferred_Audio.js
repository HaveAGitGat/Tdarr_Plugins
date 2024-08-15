/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_e5c3_CnT_Keep_Preferred_Audio",
    Stage: "Pre-processing",
    Name: "Keep Preferred Audio",
    Type: "Audio",
    Operation: 'Transcode',
    Description:
      "Plugin that checks for unwanted audio, per 1.104 beta you can change the languages yourself from within Tdarr!\nUntill you enter a value it keep english tracks by default.\nUndefined languages are kept to prevent videos without sound.\nIf you would like to keep track of the languages you have for each file you can use the 'special' option.\nCreated by @control#0405",
    Version: "1.2",
    Tags: "pre-processing,ffmpeg,configurable,audio only",
    Inputs: [
      {
        name: "languages",
        type: 'string',
        defaultValue:'eng,en',
        inputUI: {
          type: 'text',
        },
        tooltip: `Desired Languages you would like to keep, language format has to be according to the iso-639-2 standard: https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes\\nExample:\\eng,dut`,
      },
      {
        name: "special",
        type: 'string',
        defaultValue:'',
        inputUI: {
          type: 'text',
        },
        tooltip: `This is if you want a specific language to be logged to a file in your Tdarr documents folder.\\nIt will add the name of the file that is being processed if this language(s) has been found.\\nThe file is created the first time it finds a file with the language.\\nThe languages don't have to be in "languages".\\nExample:\\eng,dut`,
      },
      {
        name: "container",
        type: 'string',
        defaultValue:'.mkv',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter the output container of the new file.\\n Default: .mkv\\nExample:\\n.mkv`,
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  
  const lib = require('../methods/lib')(); const exec = require("child_process").exec; const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  if (inputs.languages == "" || typeof inputs.special == "undefined") {
    var languages = ["eng", "en"]; //these languages should be kept, named according to ISO 639-2 language scheme
  } else {
    var languages = inputs.languages.toLowerCase().split(","); //these languages should be kept, named according to ISO 639-2 language scheme
  }
  if (inputs.special == "" || typeof inputs.special == "undefined") {
    var special = ``;
  } else {
    var special = inputs.special.toLowerCase().split(",");
  }
  if (languages.length >= special.length) {
    var length = languages.length;
  } else {
    var length = special.length;
  }
  console.log(languages);
  var transcode = 0; //if this becomes '1' it will be transcoded
  var sourcename = file.meta.FileName.substring(
    0,
    file.meta.FileName.lastIndexOf(".")
  ); //filename without extension
  var specialcheck = ``; //contains the txt string if special language was found
  var wanted = 0;
  var audio = 0;

  //default response
  var response = {
    processFile: false,
    preset: `, -map 0:v`,
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "Removing unwanted audio...\n",
  };

  if (inputs.container !== undefined) {
    response.container = inputs.container;
    console.log(`Container was set to: ` + inputs.container);
  }

  for (i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      //check for non-english tracks
      console.log(`Audio track ${i}`);
      console.log("type: " + typeof file.ffProbeData.streams[i].tags);
      if (
        typeof file.ffProbeData.streams[i].tags !== "undefined" ||
        file.ffProbeData.streams[i].tags
      ) {
        console.log(
          "Type: " + typeof file.ffProbeData.streams[i].tags.language
        );
        if (
          typeof file.ffProbeData.streams[i].tags.language !== "undefined" ||
          file.ffProbeData.streams[i].tags.language
        ) {
          for (l = 0; l < length; l++) {
            if (file.ffProbeData.streams[i].tags.language == special[l]) {
              if (
                !fs.existsSync(
                  otherArguments.homePath +
                    `/Tdarr/special_audio_${special[l]}.txt`
                )
              ) {
                //create txt file if it doesn't exist yet
                exec(
                  `echo "${sourcename}" >> ${otherArguments.homePath}/Tdarr/special_audio_${special[l]}.txt`
                ); //first file will be added and file is created
                console.log(`added to txt: ` + sourcename);
              } else {
                specialcheck = fs
                  .readFileSync(
                    otherArguments.homePath +
                      `/Tdarr/special_audio_${special[l]}.txt`
                  )
                  .toString(); //create string from existing file
                if (!specialcheck.includes(sourcename)) {
                  //only add the filename if it wasn't added already
                  exec(
                    `echo "${sourcename}" >> ${otherArguments.homePath}/Tdarr/special_audio_${special[l]}.txt`
                  );
                  console.log(`added to txt: ` + sourcename);
                }
              }

              response.preset += ` -map 0:${i}`;
              response.infoLog += `Found special ${special[l]}: ${i}\n`;
              wanted++;
              break;
            } else if (
              file.ffProbeData.streams[i].tags.language == languages[l]
            ) {
              response.preset += ` -map 0:${i}`;
              response.infoLog += `Found wanted ${languages[l]}: ${i}\n`;
              wanted++;
              break;
            } else if (i == length - 1) {
              response.infoLog += `Found unwanted: ${file.ffProbeData.streams[i].tags.language}: ${i}\n`;
            }
          }
        } else {
          response.preset += ` -map 0:${i}`;
          response.infoLog += `Added undefined: ${i}\n`;
          wanted++;
        }
      } else {
        response.preset += ` -map 0:${i}`;
        response.infoLog += `Added undefined: ${i}\n`;
        wanted++;
      }

      audio++;
    }
  }

  if (audio > wanted && wanted > 0) {
    transcode = 1;
  }

  if (transcode == 1) {
    response.infoLog += `Found unwanted audio\nIt will be removed\n`;
    response.processFile = true;
    response.FFmpegMode = true;
    response.preset += ` -map 0:s? -c copy`;
    response.reQueueAfter = true;
  } else {
    response.infoLog += `No unwanted audio found!\n`;
  }

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
