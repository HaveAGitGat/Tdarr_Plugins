module.exports = (file, audioEncoder) => {
  // Function required responses
  // preset
  // processFile
  // note

  try {
    let audioIdx = -1;
    let hasNonSpecifiedAudioCodecStream = false;
    let ffmpegCommandInsert = '';
    let audioCodec = audioEncoder;

    if (audioEncoder === 'dca') {
      audioCodec = 'dts';
    }

    if (audioEncoder === 'libmp3lame') {
      audioCodec = 'mp3';
    }

    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
          audioIdx += 1;
        }
      } catch (err) {
        // err
      }

      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
          && file.ffProbeData.streams[i].codec_name !== audioCodec
        ) {
          ffmpegCommandInsert += ` -c:a:${audioIdx} ${audioEncoder}`;
          hasNonSpecifiedAudioCodecStream = true;
        }
      } catch (err) {
        // err
      }
    }

    if (hasNonSpecifiedAudioCodecStream === true) {
      if (['dca', 'truehd'].includes(audioEncoder)) {
        ffmpegCommandInsert += ' -strict -2';
      }
      return {
        preset: `,-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy ${ffmpegCommandInsert}`,
        processFile: true,
        note: `File has audio streams which aren't in ${audioCodec} \n`,
      };
    }

    return {
      preset: '',
      processFile: false,
      note: `File does not have any audio streams which aren't in ${audioCodec} \n`,
    };
  } catch (err) {
    return {
      preset: '',
      processFile: false,
      note: `library.actions.transcodeStandardiseAudioCodecs error: ${err} \n`,
    };
  }
};
