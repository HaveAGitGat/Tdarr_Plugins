// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_z18t_rename_files_based_on_codec_and_resolution',
  Stage: 'Post-processing',
  Name: 'Rename Based On Codec And Resolution',
  Type: 'Video',
  Operation: 'Transcode',
  Description: '[Contains built-in filter]This plugin renames files depending on codec and resolution\n\n',
  Version: '1.00',
  Tags: 'post-processing',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  try {
    const fs = require('fs');
    const fileNameOld = file._id;

    const resolutions = {
      _480p: '480p',
      _576p: '576p',
      _720p: '720p',
      _1080p: '1080p',
      _4KUHD: '4k',
      _DCI4K: '4k',
      _8KUHD: '8k',
      _Other: 'Other',
    };

    // only process if properties available
    if (file.ffProbeData.streams[0].codec_name && file.video_resolution) {
      const resolution = `_${file.video_resolution}`;
      const resShouldBe = resolutions[resolution];
      const codecShouldBe = file.ffProbeData.streams[0].codec_name;

      // Remove container from processing
      let fileName = file._id;
      let parts = fileName.split('/');
      fileName = parts[parts.length - 1];
      parts.splice(parts.length - 1, 1);
      parts = parts.join('/');

      fileName = fileName.split('.');
      const container = fileName[fileName.length - 1];
      fileName.splice(fileName.length - 1, 1);
      fileName = fileName.join('.');

      // put term substrings below strings (i.e. '480' below '480p')
      const terms = [
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
        'hevc',
      ];

      // clean up res and codec terms from name
      for (let i = 0; i < terms.length; i += 1) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const idx = fileName.indexOf(terms[i]);
          if (idx === -1) {
            break;
          } else {
            const { length } = terms[i];
            fileName = fileName.split('');
            fileName.splice(idx, length);
            fileName = fileName.join('');
          }
        }
      }

      if (resShouldBe === 'Other') {
        fileName = `${parts}/${fileName}_${codecShouldBe}.${container}`;
      } else {
        fileName = `${parts}/${fileName}_${resShouldBe}_${codecShouldBe}.${container}`;
      }

      // clean up word breakers
      const breakers = [
        '.',
        '_',
        '-',
      ];

      fileName = fileName.split('');
      for (let i = 0; i < fileName.length; i += 1) {
        for (let j = 0; j < breakers.length; j += 1) {
          for (let k = 0; k < breakers.length; k += 1) {
            if (fileName[i] === breakers[j] && fileName[i + 1] === breakers[k]) {
              fileName.splice(i, 1);
              i -= 1;
            }
          }
        }
      }

      fileName = fileName.join('');

      // eslint-disable-next-line no-param-reassign
      file._id = fileName;
      // eslint-disable-next-line no-param-reassign
      file.file = fileName;

      if (fileNameOld !== file._id) {
        fs.renameSync(fileNameOld, file._id, {
          overwrite: true,
        });

        const response = {
          file,
          removeFromDB: false,
          updateDB: true,
        };

        return response;
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }

  return undefined;
};

module.exports.details = details;
module.exports.plugin = plugin;
