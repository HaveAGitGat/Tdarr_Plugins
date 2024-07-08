const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz2CleanTitle',
  Stage: 'Pre-processing',
  Name: 'Migz Clean Title Metadata',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin removes title metadata from video/audio/subtitles.\n\n',
  Version: '1.9',
  Tags: 'pre-processing,ffmpeg,configurable',
  Inputs: [{
    name: 'clean_audio',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `
Specify if audio titles should be checked & cleaned. 
Optional. Only removes titles if they contain at least 3 '.' characters.
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  {
    name: 'clean_subtitles',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `
Specify if subtitle titles should be checked & cleaned.
Optional. Only removes titles if they contain at least 3 '.' characters.
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  {
    name: 'custom_title_matching',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `If you enable audio or subtitle cleaning the plugin only looks for titles with more then 3 full stops.
                  \\nThis is one way to identify junk metadata without removing real metadata that you might want.
                  \\nHere you can specify your own text for it to also search for to match and remove.
                  \\nComma separated. Optional.
               \\nExample:\\n
               MiNX - Small HD episodes

               \\nExample:\\n
               MiNX - Small HD episodes,GalaxyTV - small excellence!`,
  },
  ],
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

  // Set up required variables.

  let ffmpegCommandInsert = '';
  let videoIdx = 0;
  let audioIdx = 0;
  let subtitleIdx = 0;
  let convert = false;
  let custom_title_matching = '';

  // Check if inputs.custom_title_matching has been configured. If it has then set variable
  if (inputs.custom_title_matching !== '') {
    custom_title_matching = inputs.custom_title_matching.toLowerCase().split(',');
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Check if overall file metadata title is not empty, if it's not empty set to "".
  if (
    !(
      typeof file.meta.Title === 'undefined'
        || file.meta.Title === '""'
        || file.meta.Title === ''
    )
  ) {
    try {
      ffmpegCommandInsert += ' -metadata title= ';
      convert = true;
    } catch (err) {
      // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // Check if stream is a video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      try {
        // Check if stream title is not empty, if it's not empty set to "".
        if (
          !(
            typeof file.ffProbeData.streams[i].tags.title === 'undefined'
            || file.ffProbeData.streams[i].tags.title === '""'
            || file.ffProbeData.streams[i].tags.title === ''
          )
        ) {
          response.infoLog += `☒Video stream title is not empty. Removing title from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} title= `;
          convert = true;
        }
        // Increment videoIdx.
        videoIdx += 1;
      } catch (err) {
        // Error
      }
    }

    // Check if title metadata of audio stream has more then 3 full stops.
    // If so then it's likely to be junk metadata so remove.
    // Then check if any audio streams match with user input custom_title_matching variable, if so then remove.
    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
      && inputs.clean_audio === true
    ) {
      try {
        if (
          !(
            typeof file.ffProbeData.streams[i].tags.title === 'undefined'
            || file.ffProbeData.streams[i].tags.title === '""'
            || file.ffProbeData.streams[i].tags.title === ''
          )
        ) {
          if (file.ffProbeData.streams[i].tags.title.split('.').length - 1 > 3) {
            try {
              response.infoLog += `☒More then 3 full stops in audio title. Removing title from stream ${i} \n`;
              ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title= `;
              convert = true;
            } catch (err) {
              // Error
            }
          }
          if (typeof inputs.custom_title_matching !== 'undefined') {
            try {
              if (custom_title_matching.indexOf(file.ffProbeData.streams[i].tags.title.toLowerCase()) !== -1) {
                response.infoLog += `☒Audio matched custom input. Removing title from stream ${i} \n`;
                ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title= `;
                convert = true;
              }
            } catch (err) {
              // Error
            }
          }
        }
        // Increment audioIdx.
        audioIdx += 1;
      } catch (err) {
        // Error
      }
    }

    // Check if title metadata of subtitle stream has more then 3 full stops.
    // If so then it's likely to be junk metadata so remove.
    // Then check if any streams match with user input custom_title_matching variable, if so then remove.
    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
      && inputs.clean_subtitles === true
    ) {
      try {
        if (
          !(
            typeof file.ffProbeData.streams[i].tags.title === 'undefined'
            || file.ffProbeData.streams[i].tags.title === '""'
            || file.ffProbeData.streams[i].tags.title === ''
          )
        ) {
          if (file.ffProbeData.streams[i].tags.title.split('.').length - 1 > 3) {
            try {
              response.infoLog += `☒More then 3 full stops in subtitle title. Removing title from stream ${i} \n`;
              ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title= `;
              convert = true;
            } catch (err) {
              // Error
            }
          }
          if (typeof inputs.custom_title_matching !== 'undefined') {
            try {
              if (custom_title_matching.indexOf(file.ffProbeData.streams[i].tags.title.toLowerCase()) !== -1) {
                response.infoLog += `☒Subtitle matched custom input. Removing title from stream ${i} \n`;
                ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title= `;
                convert = true;
              }
            } catch (err) {
              // Error
            }
          }
        }
        // Increment subtitleIdx.
        subtitleIdx += 1;
      } catch (err) {
        // Error
      }
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.infoLog += '☒File has title metadata. Removing \n';
    response.preset = `,${ffmpegCommandInsert} -c copy -map 0 -max_muxing_queue_size 9999`;
    response.reQueueAfter = true;
    response.processFile = true;
  } else {
    response.infoLog += '☑File has no title metadata \n';
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
