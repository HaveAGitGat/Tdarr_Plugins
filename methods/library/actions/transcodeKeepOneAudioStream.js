/* eslint-disable */
module.exports = function transcodeKeepOneAudioStream(
  file,
  audioEncoder,
  langTag,
  channelCount
) {
  // response.preset = library.actions.transcodeKeepOneAudioStream(file, 'aac', 'en', 1).preset

  //Function required responses
  // preset
  // processFile
  // note

  try {
    var audioCodec = audioEncoder;
    langTag = langTag.toLowerCase();

    if (audioEncoder == "dca") {
      audioCodec = "dts";
    }

    if (audioEncoder == "libmp3lame") {
      audioCodec = "mp3";
    }

    var reqLang = langTag;

    var numberOfAudioStreams = file.ffProbeData.streams.filter(
      (stream) => stream.codec_type == "audio"
    ).length;

    //Step 1: Check if the file already has the required stream codec/langtag/channel count

    var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.codec_name === audioCodec &&
          stream.tags.language.toLowerCase().includes(langTag.toLowerCase()) &&
          stream.channels == channelCount
        ) {
          return true;
        }
      } catch (err) {}

      return false;
    });

    if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
      return {
        preset: "",
        processFile: false,
        note: `File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels. It is the only track! \n`,
      };
    } else if (hasStreamAlready.length >= 1) {
      var audioStreamToKeep = hasStreamAlready[0].index;
      var ffmpegCommandInsert = "";
      for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
          if (
            file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
            i !== audioStreamToKeep
          ) {
            ffmpegCommandInsert += ` -map -0:${i}`;
          }
        } catch (err) {}
      }

      return {
        preset: `, -map 0 ${ffmpegCommandInsert} -c copy`,
        processFile: true,
        note: `File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels. It is not the only track, removing others. \n`,
      };
    }

    //Step 2: Check if file has streams with specified lang tag

    var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.tags.language.toLowerCase().includes(langTag)
        ) {
          return true;
        }
      } catch (err) {}

      return false;
    });

    console.log("streamsWithLangTag:" + streamsWithLangTag);

    if (streamsWithLangTag.length != 0) {
      return attemptMakeStreamLang(langTag);
    } else {
      return attemptMakeStreamUnd("und");
    }

    function attemptMakeStreamLang(langTag) {
      var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
        try {
          if (
            stream.codec_type == "audio" &&
            stream.tags.language.toLowerCase().includes(langTag)
          ) {
            return true;
          }
        } catch (err) {}

        return false;
      });

      var highestChannelCount = streamsWithLangTag.reduce(getHighest);

      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }

      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
          try {
            if (
              stream.codec_type == "audio" &&
              stream.codec_name === audioCodec &&
              stream.tags.language
                .toLowerCase()
                .includes(langTag.toLowerCase()) &&
              stream.channels == channelCount
            ) {
              return true;
            }
          } catch (err) {}

          return false;
        });

        if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
          return {
            preset: "",
            processFile: false,
            note: `The required stream already exists. It is the only audio stream. \n`,
          };
        } else if (hasStreamAlready.length >= 1) {
          return {
            preset: `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`,
            processFile: true,
            note: `The required stream already exists. Removing others. \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount}`,
            processFile: true,
            note: `The required channel count ${channelCount} is lower than the highest available channel count (${highestChannelCount.channels}). Adding it and removing others! \n`,
          };
        }
      } else {
        console.log("here3");

        var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
          try {
            if (
              stream.codec_type == "audio" &&
              stream.codec_name === audioCodec &&
              stream.tags.language
                .toLowerCase()
                .includes(langTag.toLowerCase()) &&
              stream.channels == highestChannelCount.channels
            ) {
              return true;
            }
          } catch (err) {}

          return false;
        });

        if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
          return {
            preset: "",
            processFile: false,
            note: `The best ${reqLang} stream already exists. It is the only audio stream. \n`,
          };
        } else if (hasStreamAlready.length >= 1) {
          return {
            preset: `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`,
            processFile: true,
            note: `The best ${reqLang}  stream already exists. Removing others. \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels}`,
            processFile: true,
            note: `The required channel count (${channelCount}) is higher than the highest channel available in specified lang tag (${highestChannelCount.channels}). Adding lower channel track, removing others. \n`,
          };
        }
      }
    }

    function attemptMakeStreamUnd(langTag) {
      console.log(
        "No tracks with specified lang tag exist. Checking undefined tracks."
      );

      console.log(langTag);

      var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
        try {
          if (
            stream.codec_type == "audio" &&
            (stream.tags == undefined ||
              stream.tags.language == undefined ||
              stream.tags.language.toLowerCase().includes(langTag))
          ) {
            return true;
          }
        } catch (err) {}

        return false;
      });

      if (streamsWithLangTag.length == 0) {
        return {
          preset: ``,
          processFile: false,
          note: `Unable to add audio stream in ${langTag}/und with ${channelCount} channels \n`,
        };
      }

      var highestChannelCount = streamsWithLangTag.reduce(getHighest);

      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }

      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
          try {
            if (
              stream.codec_type == "audio" &&
              stream.codec_name === audioCodec &&
              (stream.tags == undefined ||
                stream.tags.language == undefined ||
                stream.tags.language.toLowerCase().includes(langTag)) &&
              stream.channels == channelCount
            ) {
              return true;
            }
          } catch (err) {}

          return false;
        });

        if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
          return {
            preset: "",
            processFile: false,
            note: `No ${reqLang} streams. The required und stream already exists. It is the only audio stream. \n`,
          };
        } else if (hasStreamAlready.length >= 1) {
          return {
            preset: `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`,
            processFile: true,
            note: `No ${reqLang} streams. The required und stream already exists. Removing others. \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount}`,
            processFile: true,
            note: `No ${reqLang} streams. The required channel count ${channelCount} is lower than the highest available channel count (${highestChannelCount.channels}).Adding it and removing others! \n`,
          };
        }
      } else {
        var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
          try {
            if (
              stream.codec_type == "audio" &&
              stream.codec_name === audioCodec &&
              (stream.tags == undefined ||
                stream.tags.language == undefined ||
                stream.tags.language.toLowerCase().includes(langTag)) &&
              stream.channels == highestChannelCount.channels
            ) {
              return true;
            }
          } catch (err) {}

          return false;
        });

        if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
          return {
            preset: "",
            processFile: false,
            note: `No ${reqLang} streams. The best und stream already exists. It is the only audio stream. \n`,
          };
        } else if (hasStreamAlready.length >= 1) {
          return {
            preset: `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`,
            processFile: true,
            note: `No ${reqLang} streams. The best stream already exists. Removing others. \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels}`,
            processFile: true,
            note: `No ${reqLang} streams. The required channel count (${channelCount}) is higher than the highest channel available in specified lang tag (${highestChannelCount.channels}). Adding lower channel track, removing others. \n`,
          };
        }
      }
    }
  } catch (err) {
    return {
      preset: "",
      processFile: false,
      note: `library.actions.transcodeKeepOneAudioStream error: ${err} \n`,
    };
  }
};
