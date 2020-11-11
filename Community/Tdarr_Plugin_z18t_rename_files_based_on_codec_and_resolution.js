module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_z18t_rename_files_based_on_codec_and_resolution",
    Stage: "Post-processing",
    Name: "Rename based on codec and resolution",
    Type: "Video",
    Operation: "",
    Description: `[TESTING][Contains built-in filter]This plugin renames files depending on codec and resolution\n\n`,
    Version: "1.00",
    Link: "",
    Tags: "post-processing",
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {

  try {
    const fs = require("fs");
    const path = require("path");
    let rootModules
    if (fs.existsSync(path.join(process.cwd(), "/npm"))) {
      rootModules = path.join(process.cwd(), "/npm/node_modules/");
    } else {
      rootModules = "";
    }

    const fsextra = require(rootModules + "fs-extra");
    let fileNameOld = file._id;

    let resolutions = {
      _480p: '480p',
      _576p: '576p',
      _720p: '720p',
      _1080p: '1080p',
      _4KUHD: '4k',
      _DCI4K: '4k',
      _8KUHD: '8k',
      _Other: 'Other'
    }

    //only process if properties available
    if (file.ffProbeData.streams[0].codec_name && file.video_resolution) {

      let resolution = '_' + file.video_resolution
      let resShouldBe = resolutions[resolution]
      let codecShouldBe = file.ffProbeData.streams[0].codec_name

      //Remove container from processing
      let fileName = file._id;
      let parts = fileName.split('/')
      fileName = parts[parts.length - 1]
      parts.splice(parts.length - 1, 1)
      parts = parts.join('/')

      fileName = fileName.split('.')
      let container = fileName[fileName.length - 1]
      fileName.splice(fileName.length - 1, 1)
      fileName = fileName.join('.')

      //put term substrings below strings (i.e. '480' below '480p')
      let terms = [
        '480p',
        '480',
        '576p',
        '576',
        '720p',
        '720',
        '1080p',
        '1080',
        '2160p',
        '2160',
        '4k',
        '8k',

        'h264',
        '264',
        'h265',
        '265',
        'hevc'
      ]

      //clean up res and codec terms from name
      for (let i = 0; i < terms.length; i++) {
        while (true) {
          let idx = fileName.indexOf(terms[i]);
          if (idx === -1) {
            break
          } else {
            let length = terms[i].length
            fileName = fileName.split('')
            fileName.splice(idx, length);
            fileName = fileName.join('')
          }
        }
      }

      if (resShouldBe === 'Other') {
        fileName = parts + '/' + fileName + '_' + codecShouldBe + '.' + container
      } else {
        fileName = parts + '/' + fileName + '_' + resShouldBe + '_' + codecShouldBe + '.' + container
      }

      //clean up word breakers
      let breakers = [
        '.',
        '_',
        '-',
      ]

      fileName = fileName.split('')
      for (let i = 0; i < fileName.length; i++) {
        for (let j = 0; j < breakers.length; j++) {
          for (let k = 0; k < breakers.length; k++) {
            if (fileName[i] === breakers[j] && fileName[i + 1] === breakers[k]) {
              fileName.splice(i, 1);
              i--
            }
          }
        }
      }

      fileName = fileName.join('')

      file._id = fileName
      file.file = fileName

      if (fileNameOld != file._id) {
        fsextra.moveSync(fileNameOld, file._id, {
          overwrite: true,
        });

        let response = {
          file,
          removeFromDB: false,
          updateDB: true,
        };

        return response;
      }
    }
  } catch (err) {
    console.log(err);
  }
};
