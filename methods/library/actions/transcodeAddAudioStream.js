/* eslint-disable */
module.exports = function transcodeAddAudioStream(
  file,
  audioEncoder,
  langTag,
  channelCount
) {
  // response.preset = library.actions.transcodeAddAudioStream(file, 'aac', 'en', 1).preset

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

    let extraArgs = "";

    if (audioEncoder === 'truehd') {
      extraArgs = " -strict -2";
    }

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

    if (hasStreamAlready.length > 0) {
      return {
        preset: "",
        processFile: false,
        note: `File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels\n`,
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

        if (hasStreamAlready.length > 0) {
          return {
            preset: "",
            processFile: false,
            note: `File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount} -max_muxing_queue_size 9999${extraArgs}`,
            processFile: true,
            note: `The required channel count ${channelCount} is lower than the highest available channel count (${highestChannelCount.channels}). Adding! \n`,
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

        if (hasStreamAlready.length > 0) {
          return {
            preset: "",
            processFile: false,
            note: `File already has ${langTag} stream in ${audioEncoder}, ${highestChannelCount.channels} channels (Highest available) \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels} -max_muxing_queue_size 9999${extraArgs}`,
            processFile: true,
            note: `The required channel count (${channelCount}) is higher than the highest channel available in specified lang tag (${highestChannelCount.channels}). Adding lower channel track. \n`,
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

        if (hasStreamAlready.length > 0) {
          return {
            preset: "",
            processFile: false,
            note: `File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount} -max_muxing_queue_size 9999${extraArgs}`,
            processFile: true,
            note: `The required channel count ${channelCount} is lower than the highest available channel count (${highestChannelCount.channels}). Adding! \n`,
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

        if (hasStreamAlready.length > 0) {
          return {
            preset: "",
            processFile: false,
            note: `File already has ${langTag} stream in ${audioEncoder}, ${highestChannelCount.channels} channels (Highest available) \n`,
          };
        } else {
          return {
            preset: `,-map 0:v -map 0:${highestChannelCount.index} -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels} -max_muxing_queue_size 9999${extraArgs}`,
            processFile: true,
            note: `The required channel count (${channelCount}) is higher than the highest channel available in specified lang tag (${highestChannelCount.channels}). Adding lower channel track. \n`,
          };
        }
      }
    }
  } catch (err) {
    return {
      preset: "",
      processFile: false,
      note: `library.actions.transcodeAddAudioStream error: ${err} \n`,
    };
  }
};
