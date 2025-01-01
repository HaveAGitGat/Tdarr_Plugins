/* eslint-disable no-console */
const details = () => ({
  id: 'Tdarr_Plugin_rdub_audio_rename_channels',
  Stage: 'Pre-processing',
  Name: 'Rdub Rename Audio Titles',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin renames titles for audio streams. '
    + 'An example would be in VLC -> Audio -> Audio Track -> "5.1 - [English]" \n\n'
    + '- 8 Channels will replace the title with 7.1\n '
    + '- 6 Channels will replace the title with 5.1"\n '
    + '- 2 Channels will replace the title with 2.0',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Initialize ffmpeg command insert
  let ffmpegCommandInsert = '';
  let modifyFile = false;

  // Check if file is a video. If it isn't, exit the plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ File is not a video. Skipping processing.\n';
    response.processFile = false;
    return response;
  }

  // Initialize audioIndex to track audio streams separately
  let audioIndex = 0;

  // Go through each stream in the file
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // Check if the stream is an audio stream
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
      try {
        // Retrieve current title metadata
        let currentTitle = file.ffProbeData.streams[i].tags?.title || '';

        // Trim whitespace
        currentTitle = currentTitle.trim();

        // Check if the title matches a standard format ("7.1", "5.1", "2.0")
        if (['7.1', '5.1', '2.0'].includes(currentTitle)) {
          response.infoLog += `☑ Audio stream ${audioIndex} already has a renamed title: "${currentTitle}".`
          + ' Skipping further renaming.\n';

          // Increment audioIndex since we are processing an audio stream
          // eslint-disable-next-line no-plusplus
          audioIndex++;

          // Skip further renaming for this stream
          // eslint-disable-next-line no-continue
          continue;
        }

        // Determine new title based on the channel count
        let newTitle = '';
        if (file.ffProbeData.streams[i].channels === 8) {
          newTitle = '7.1';
        } else if (file.ffProbeData.streams[i].channels === 6) {
          newTitle = '5.1';
        } else if (file.ffProbeData.streams[i].channels === 2) {
          newTitle = '2.0';
        }

        // Rename the title if applicable
        if (newTitle) {
          response.infoLog += `☑ Audio stream ${audioIndex} has ${file.ffProbeData.streams[i].channels} channels. `
          + `Renaming title to "${newTitle}"\n`;

          ffmpegCommandInsert += ` -metadata:s:a:${audioIndex} title=${newTitle} `;
          modifyFile = true;
        }
      } catch (err) {
        // Log error during audio stream processing
        response.infoLog += `Error processing audio stream ${audioIndex}: ${err}\n`;
      }

      // Increment audioIndex for the next audio stream
      // eslint-disable-next-line no-plusplus
      audioIndex++;
    }
  }

  // Finalize the command if modifications were made
  if (modifyFile) {
    response.infoLog += '☒ File has audio tracks to rename. Renaming...\n';

    // Set the new preset
    response.preset = `, ${ffmpegCommandInsert} -c copy -map 0 -max_muxing_queue_size 9999`;

    // Re-queue the file for further processing
    response.reQueueAfter = true;
    response.processFile = true;
  } else {
    // No modifications needed
    response.infoLog += '☑ File has no need to rename audio streams.\n';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
