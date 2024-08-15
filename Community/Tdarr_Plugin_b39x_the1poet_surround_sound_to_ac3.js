const details = () => ({
  id: 'Tdarr_Plugin_b39x_the1poet_surround_sound_to_ac3',
  Stage: 'Pre-processing',
  Name: 'The1poet Video Surround Sound To AC3',
  Type: 'Video',
  Operation: 'Transcode',
  Description: '[Contains built-in filter]  If the file has surround sound tracks not in ac3,'
    + ` they will be converted to ac3. \n\n
`,
  Version: '1.01',
  Tags: 'pre-processing,ffmpeg,audio only,',
  Inputs: [
    {
      name: 'overwriteTracks',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify if you\'d like to overwrite the existing track or keep'
        + 'it and have a new stream be created (default: true)',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object

  const response = {
    processFile: false,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');

    response.infoLog += '☒File is not video \n';
    response.processFile = false;

    return response;
  }
  let audioIdx = -1;
  let ffmpegCommandInsert = '';
  let hasnonAC3SurroundTrack = false;

  let shouldTranscode = true;
  if (inputs.overwriteTracks === false) {
    const hasAc3_6Stream = file.ffProbeData.streams.filter((row) => row.channels === 6
      && row.codec_name === 'ac3');
    if (hasAc3_6Stream.length > 0) {
      shouldTranscode = false;
    }
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const currStream = file.ffProbeData.streams[i];
    try {
      if (currStream.codec_type.toLowerCase() === 'audio') {
        audioIdx += 1;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }

    try {
      if (
        currStream.channels === 6
        && currStream.codec_name !== 'ac3'
        && currStream.codec_type.toLowerCase() === 'audio'
      ) {
        if (inputs.overwriteTracks === true) {
          ffmpegCommandInsert += ` -c:a:${audioIdx} ac3 `;
        } else {
          ffmpegCommandInsert += `-map 0:a:${audioIdx} -c:a:${audioIdx} ac3 `;
        }
        hasnonAC3SurroundTrack = true;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  const ffmpegCommand = `,-map 0 -c:v copy  -c:a copy ${ffmpegCommandInsert} -c:s copy -c:d copy`;

  if (shouldTranscode && hasnonAC3SurroundTrack === true) {
    response.processFile = true;
    response.preset = ffmpegCommand;
    response.container = `.${file.container}`;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += '☒ File has surround audio which is NOT in ac3! \n';
    return response;
  }
  response.infoLog += '☑ All surround audio streams are in ac3! \n';

  response.infoLog += '☑File meets conditions! \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
