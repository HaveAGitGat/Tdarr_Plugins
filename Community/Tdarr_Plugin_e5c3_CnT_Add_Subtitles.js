/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_e5c3_CnT_Add_Subtitles",
    Stage: "Pre-processing",
    Name: "Add Subtitles To MKV Files",
    Type: "Video",
    Operation: 'Transcode',
    Description: `This plugin will check for subtitles, they should be named according to the ISO 639-2 language code.\nA subtitle could look like this: eng.srt\n If there are subtitles found they will be added with FFMPEG, if there are no subs of that language found.\n On first run node module iso-639-2 will be installed in the documents folder.\n Created by @control#0405`,
    Version: "1.3",
    Tags: "pre-processing,ffmpeg,subtitle only,configurable",
    Inputs: [
      {
        name: "install_packages",
        type: 'string',
        defaultValue:'no',
        inputUI: {
          type: 'text',
        },
        tooltip: `Please change this to "yes", it allows the plugin to install the required nodemodule. (iso-639-2) \\nExample:\\n yes`,
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
  
  const lib = require('../methods/lib')(); const fs = require("fs"); const execSync = require("child_process").execSync;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //default response
  var response = {
    processFile: false,
    preset: `,`,
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles...\n`,
  };

  if (inputs.container !== undefined) {
    response.container = inputs.container;
    console.log(`Changed container to: ` + inputs.container);
  }

  if (inputs.install_packages == "yes") {
    if (
      !fs.existsSync(`${otherArguments.homePath}/Tdarr/node_modules/iso-639-2`)
    ) {
      execSync(`cd ${otherArguments.homePath}/Tdarr \n npm install iso-639-2@2.0.0`);
    }
  } else {
    response.infoLog = `Please take a look at the input options\n A extra nodemodule is required.`;
    return response;
  }

  if (fs.existsSync(`/home/Tdarr/Documents/Tdarr/node_modules/iso-639-2`)) {
    var iso6392 = require("/home/Tdarr/Documents/Tdarr/node_modules/iso-639-2");
  } else {
    response.infoLog += `Nodemodule iso-639-2 isn't installed!\nTry Again`;
    return response;
  }

  var i = 0; //int for counting lang[position]
  var found_subtitle_stream = 0;
  var sub = 0; //becomes first subtitle stream
  var lang = iso6392; //languages to check against
  var path = file.meta.Directory; //path of media folder
  var exist = 0; //if the language exists should be added this becomes 1
  var new_subs = 0; //count the new subs
  var added_subs = 0; //counts the amount of subs that have been mapped
  var preset_import = "";
  var preset_meta = "";

  //find first subtitle stream
  while (found_subtitle_stream == 0 && sub < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub++;
    }
  }

  response.infoLog += `Path: ${path}\n`;
  for (i = 0; i < lang.length; i++) {
    //check if srt file exists in folder
    if (fs.existsSync(`${path}/${lang[i].iso6392B}.srt`)) {
      response.infoLog += `Found subtitle ${lang[i].name}.srt\n`;

      if (found_subtitle_stream == 1) {
        //check if language already exists
        for (
          sub_stream = sub;
          sub_stream < file.ffProbeData.streams.length;
          sub_stream++
        ) {
          //response.infoLog += `does ${lang[i].name} exist in stream ${sub_stream}?\n`
          if (file.ffProbeData.streams[sub_stream].tags.language) {
            if (
              file.ffProbeData.streams[
                sub_stream
              ].tags.language.toLowerCase() == lang[i].iso6392B
            ) {
              //response.infoLog += `YES\n`
              exist = 1;
              response.infoLog += `Language already exists in stream ${sub_stream}\n It will not be added\n`;
            }
          }
        }
      } else {
        exist = 0;
      }

      //add if it hasn't found the language
      if (exist != 1) {
        preset_import += ` -sub_charenc "UTF-8" -f srt -i "${path}/${lang[i].iso6392B}.srt"`;
        preset_meta += ` -metadata:s:s:${new_subs} language=${lang[i].iso6392B}`;
        new_subs++;
      }
    }
    //else {
    //    response.infoLog += `did not find sub ${lang[i].iso6392B}.srt\n`
    //}
    exist = 0;
  }

  response.preset += ` ${preset_import}${preset_meta} -map 0:v -map 0:a`;

  //map new subs
  while (added_subs < new_subs) {
    added_subs++;
    response.preset += ` -map ${added_subs}:s`;
  }

  //if new subs have been found they will be added
  if (new_subs > 0) {
    response.FFmpegMode = true;
    response.processFile = true;
    response.reQueueAfter = true;
    if (found_subtitle_stream == 1) {
      response.preset += ` -map 0:s `;
    }
    response.preset += ` -c copy`;
    response.infoLog += `${new_subs} new subs will be added\n`;
  } else {
    response.infoLog += `No new subtitle languages were found\n`;
  }

  //response.infoLog += `The ffmpeg string is: ${response.preset}\n`

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
