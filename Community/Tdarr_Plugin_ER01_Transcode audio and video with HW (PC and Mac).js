/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable */
/* eslint max-len: 0 */
/* eslint no-bitwise: 0 */
/* eslint no-mixed-operators: 0 */

const details = () => {
  return {
    id: 'Tdarr_Plugin_ER01_Transcode audio and video with HW (PC and Mac)',
    Stage: 'Pre-processing',
    Name: 'Transcode Using QSV Or VT & FFMPEG',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `Files not in H265 will be transcoded into H265 using hw with ffmpeg, assuming mkv container. Plugin uses QS if the node runs on a PC, or Videotoolbox if run on a Mac.
                Much thanks to Migz for bulk of the important code.
                Quality is controlled via bitrate adjustments - H264 to H265 assumes 0.5x bitrate.  Resolution change from 1080p to 720p assumes 0.7x bitrate.
                Audio conversion is either 2 channel ac3 or 6 channel ac3, for maximal compatibility and small file size.  All subtitles removed.
        The idea is to homogenize your collection to 1080p or higher movies with 5.1 audio, or 720p TV shows with 2.0 audio.`,

    Version:'1.0',
    Tags: 'pre-processing,ffmpeg,video only,configurable,h265',
    Inputs: [{
      name: 'audio_channels',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify whether to modify audio channels.
                  \\n Leave empty to disable.
                    \\nExample:\\n
                    2 - produces single 2.0 channel ac3 audio file, in English, unless not possible.

                    \\nExample:\\n
                    6 - produces single 5.1 channel ac3 file, in English, unless not possible.`,
    },
    {
      name: 'resize',
      type: 'string',
      defaultValue: 'no',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify if output file should be reduced to 720p from 1080p. Default is false.
                    \\nExample:\\n
                    yes

                    \\nExample:\\n
                    no`,
    },
    {
      name: 'bitrate_cutoff',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
                  \\n Rate is in kbps.
                  \\n Leave empty to disable.
                    \\nExample:\\n
                    6000

                    \\nExample:\\n
                    4000`,
    },

    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')(); const os = require('os');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: '.mkv',
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  let duration = '';

  let convertAudio = false;
  let convertVideo = false;
  let extraArguments = '';

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (inputs.container === '') {
    response.infoLog += 'Plugin has not been configured, please configure required options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. \n';
    return response;
  }

  // VIDEO SECTION

  let bitRateMultiplier = 1.00;
  let videoIdx = -1;
  let willBeResized = false;
  let videoOptions = '-map 0:v -c:v copy ';

  // video options
  // hevc, 1080, false            - do nothing
  // hevc, not 1080               - do nothing
  // hevc, 1080, true             - resize, mult 0.5
  // not hevc, 1080, true         - resize, mult 0.25
  // not hevc, 1080, false        - no resize, mult 0.5
  // not hevc, not 1080           - no resize, mult 0.5

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is a video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      // Check if codec of stream is mjpeg/png. If so then remove this "video" stream.
      // mjpeg/png are usually embedded pictures that can cause havoc with plugins.
      if (file.ffProbeData.streams[i].codec_name === 'mjpeg' || file.ffProbeData.streams[i].codec_name === 'png') {
        extraArguments += `-map -v:${videoIdx} `;
        convertVideo = true;
      }
      /*       // no video conversion if: hevc, 1080, false OR hevc, not 1080
      if (file.ffProbeData.streams[i].codec_name === 'hevc'
        && ((file.video_resolution === '1080p' && inputs.resize === 'no' ) || (file.video_resolution !== '1080p' ))) {
        convertVideo = false; } */
      // no video conversion if: hevc, 1080, false
      if (file.ffProbeData.streams[i].codec_name === 'hevc' && file.ffProbeData.streams[i].width > 1800 && file.ffProbeData.streams[i].width < 2000 && inputs.resize === 'no') {
        convertVideo = false;
      }
      // no video conversion if: hevc, not 1080
      if (file.ffProbeData.streams[i].codec_name === 'hevc' && (file.ffProbeData.streams[i].width < 1800 || file.ffProbeData.streams[i].width > 2000)) {
        convertVideo = false;
      }
      // resize video if: hevc, 1080, true
      if (file.ffProbeData.streams[i].codec_name === 'hevc' && file.ffProbeData.streams[i].width > 1800 && file.ffProbeData.streams[i].width < 2000 && inputs.resize === 'yes') {
        convertVideo = true;
        willBeResized = true;
        bitRateMultiplier = 0.7;
      }
      // resize video if: not hevc, 1080, true
      if (file.ffProbeData.streams[i].codec_name !== 'hevc' && file.ffProbeData.streams[i].width > 1800 && file.ffProbeData.streams[i].width < 2000 && inputs.resize === 'yes') {
        convertVideo = true;
        willBeResized = true;
        bitRateMultiplier = 0.4;
      }
      // no resize video if: not hevc, 1080, false
      if (file.ffProbeData.streams[i].codec_name !== 'hevc' && file.ffProbeData.streams[i].width > 1800 && file.ffProbeData.streams[i].width < 2000 && inputs.resize === 'no') {
        convertVideo = true;
        bitRateMultiplier = 0.5;
      }
      // no resize video if: not hevc, not 1080
      if (file.ffProbeData.streams[i].codec_name !== 'hevc' && file.ffProbeData.streams[i].width < 1800) {
        convertVideo = true;
        bitRateMultiplier = 0.5;
      }
    }
    // Increment videoIdx.
    videoIdx += 1;
  }

  // figure out final bitrate
  // Check if duration info is filled, if so times it by 0.0166667 to get time in minutes.
  // If not filled then get duration of stream 0 and do the same.
  if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
    duration = parseFloat(file.ffProbeData?.format?.duration) * 0.0166667;
  } else if (typeof file.meta.Duration !== 'undefined') {
    duration = file.meta.Duration * 0.0166667;
  } else {
    duration = file.ffProbeData.streams[0].duration * 0.0166667;
  }

  let bitrateSettings = '';
  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
  // Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  // eslint-disable-next-line no-bitwise
  const currentBitrate = ~~(file.file_size / (duration * 0.0075));
  // Use the same calculation used for currentBitrate but divide it in half to get targetBitrate.
  // Logic of h265 can be half the bitrate as h264 without losing quality.
  // eslint-disable-next-line no-bitwise
  const targetBitrate = ~~(file.file_size / (duration * 0.0075) * bitRateMultiplier);
  // Allow some leeway under and over the targetBitrate.
  const minimumBitrate = ~~(targetBitrate * 0.7);
  const maximumBitrate = ~~(targetBitrate * 1.3);

  // If targetBitrate comes out as 0 then something has gone wrong and bitrates could not be calculcated.
  if (targetBitrate === 0) {
    response.processFile = false;
    response.infoLog += 'Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff !== '') {
    // Checks if currentBitrate is below inputs.bitrate_cutoff
    // If so then don't convert video.
    console.log(currentBitrate)
    if (currentBitrate <= inputs.bitrate_cutoff) {
      convertVideo = false;
    }
  }

  // AUDIO SECTION

  // Set up required variables.
  let audioOptions = '-map 0:a -c:a copy ';
  let audioIdx = 0;
  let numberofAudioChannels = 0;
  let has2Channels = false;
  let has6Channels = false;
  let has8Channels = false;
  let lang2Channels = '';
  let lang6Channels = '';
  let lang8Channels = '';
  let type2Channels = '';
  let type6Channels = '';
  let type8Channels = '';

  let keepAudioIdx = -1;
  // const keepIGuessAudioIdx = -1;
  let encodeAudioIdx = -1;
  let keepAudioStream = -1;
  let encodeAudioStream = -1;
  let originalAudio = '';

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        numberofAudioChannels += 1;
        if (file.ffProbeData.streams[i].channels === 2 && has2Channels === false) {
          has2Channels = true;
          lang2Channels = file.ffProbeData.streams[i].tags.language.toLowerCase();
          type2Channels = file.ffProbeData.streams[i].codec_name.toLowerCase();
        }
        if (file.ffProbeData.streams[i].channels === 6 && has6Channels === false) {
          has6Channels = true;
          lang6Channels = file.ffProbeData.streams[i].tags.language.toLowerCase();
          type6Channels = file.ffProbeData.streams[i].codec_name.toLowerCase();
        }
        if (file.ffProbeData.streams[i].channels === 8 && has8Channels === false) {
          has8Channels = true;
          lang8Channels = file.ffProbeData.streams[i].tags.language.toLowerCase();
          type8Channels = file.ffProbeData.streams[i].codec_name.toLowerCase();
        }
      }
    } catch (err) {
      // Error
    }
  }

  // Are we processing for 6 channels?
  if (inputs.audio_channels === 6) {
    audioIdx = -1;
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
          audioIdx += 1;
          if (file.ffProbeData.streams[i].tags.language.toLowerCase() === 'eng' || file.ffProbeData.streams[i].tags.language.toLowerCase() === 'und') {
            if (file.ffProbeData.streams[i].channels === 6) {
              if (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'ac3') {
                // response.infoLog += `Found 6 channel audio in proper language and codec, audio stream ${audioIdx}\n`;
                if (keepAudioIdx === -1) {
                  keepAudioIdx = audioIdx;
                  keepAudioStream = i;
                }
              } else if (encodeAudioIdx === -1) {
                // response.infoLog += `Found 6 channel audio in proper language, need to re-encode, audio stream ${audioIdx}\n`;
                encodeAudioIdx = audioIdx;
                encodeAudioStream = i;
              }
            }
            if (file.ffProbeData.streams[i].channels > 6) {
              // response.infoLog += `Found existing multi-channel audio in proper language, need to re-encode, audio stream ${audioIdx}\n`;
              if (encodeAudioIdx === -1) {
                encodeAudioIdx = audioIdx;
                encodeAudioStream = i;
              }
            }
          }
        }
      } catch (err) {
        // Error
      }
    }
    if (keepAudioIdx === -1 && encodeAudioIdx === -1) { // didn't find any 5.1 or better audio streams in proper language, defaulting to using 2 channels
      // eslint-disable-next-line no-param-reassign
      inputs.audio_channels = '2';
    }
  }

  // Are we processing for 2 channels?
  if (inputs.audio_channels === 2) {
    audioIdx = -1;
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
          audioIdx += 1;
          if (file.ffProbeData.streams[i].tags.language.toLowerCase() === 'eng' || file.ffProbeData.streams[i].tags.language.toLowerCase() === 'und') {
            if (file.ffProbeData.streams[i].channels === 2) {
              if (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'aac' || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'ac3') {
                // response.infoLog += `Found 2 channel audio in proper language and codec, audio stream ${audioIdx}\n`;
                if (keepAudioIdx === -1) {
                  keepAudioIdx = audioIdx;
                  keepAudioStream = i;
                }
              } else if (encodeAudioIdx === -1) {
                // response.infoLog += `Found 2 channel audio in proper language, need to re-encode, audio stream ${audioIdx}\n`;
                encodeAudioIdx = audioIdx;
                encodeAudioStream = i;
              }
            } else if (encodeAudioIdx === -1) {
              // response.infoLog += `Found existing multi-channel audio in proper language, need to re-encode, audio stream ${audioIdx}\n`;
              encodeAudioIdx = audioIdx;
              encodeAudioStream = i;
            }
          }
          //      response.infoLog += `a ${audioIdx}. k ${keepAudioIdx}. e ${encodeAudioIdx}\n `;
        }
      } catch (err) {
        // Error
      }
    }
  }

  let audioMessage = '';

  // selecting channels to keep, only if 2 or 6 channels processed

  if (keepAudioIdx !== -1) {
    // keep audio, exclude everything else
    if (numberofAudioChannels !== 1) {
      convertAudio = true;
      audioMessage += `keeping audio stream ${keepAudioIdx}.`;
      audioOptions = `-map 0:a:${keepAudioIdx} -c:a copy `;
      originalAudio += `${file.ffProbeData.streams[keepAudioStream].channels} channel ${file.ffProbeData.streams[keepAudioStream].codec_name} --> ${inputs.audio_channels} channel ac3`;
    }
  } else if (encodeAudioIdx !== -1) {
    // encode this audio
    convertAudio = true;
    audioMessage += `encoding audio stream ${encodeAudioIdx}. `;
    audioOptions = `-map 0:a:${encodeAudioIdx} -c:a ac3 -ac ${inputs.audio_channels} `; // 2 or 6 channels encoding
    originalAudio += `${file.ffProbeData.streams[encodeAudioStream].channels} channel ${file.ffProbeData.streams[encodeAudioStream].codec_name} --> ${inputs.audio_channels} channel ac3`;
  } else {
    // do not encode audio
    convertAudio = false;
    audioMessage += 'no audio to encode.';
  }

  // test for whether the file needs to be processed - separate for video and audio   convertAudio, convertVideo

  if (convertAudio === false && convertVideo === false) { // if nothing to do, exit
    response.infoLog += 'File is processed already, nothing to do';
    response.processFile = false;
    return response;
  }

  // Generate ffmpeg command line arguments in total

  // few defaults

  response.preset = ', -sn ';

  if (convertVideo === true) {
    // Set bitrateSettings variable using bitrate information calculated earlier.
    bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k `
      + `-maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;

    if (willBeResized === true) {
      extraArguments += '-filter:v scale=1280:-1 ';
    }

    if (os.platform() === 'darwin') {
      videoOptions = '-map 0:v -c:v hevc_videotoolbox -profile main ';
    }

    if (os.platform() === 'win32') {
      videoOptions = '-map 0:v -c:v hevc_qsv -load_plugin hevc_hw ';
    }
  }

  response.preset += `${videoOptions} ${bitrateSettings} ${extraArguments} ${audioOptions} `;

  let outputResolution = file.video_resolution;
  if (willBeResized === true) {
    outputResolution = '720p';
  }

  if (convertVideo === false) {
    response.infoLog += `NOT converting video ${file.video_resolution}, ${file.video_codec_name}, bitrate = ${currentBitrate} \n`;
  } else {
    response.infoLog += 'Converting video, ';
    if (willBeResized === false) { response.infoLog += 'NOT '; }
    response.infoLog += `resizing. ${file.video_resolution}, ${file.video_codec_name}  -->  ${outputResolution}, hevc.  bitrate = ${currentBitrate} --> ${targetBitrate}, multiplier ${bitRateMultiplier}. \n`;
  }

  if (convertAudio === true) {
    response.infoLog += `Converting audio, ${audioMessage} ${originalAudio}. \n`;
  } else {
    response.infoLog += 'Not converting audio. \n';
  }

  response.infoLog += `2 channels - ${lang2Channels}  ${type2Channels}  \n`;
  response.infoLog += `6 channels - ${lang6Channels}  ${type6Channels}  \n`;
  response.infoLog += `8 channels - ${lang8Channels}  ${type8Channels} `;

  response.processFile = true;
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
