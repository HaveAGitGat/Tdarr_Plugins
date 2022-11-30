/* eslint-disable */
const details = () => {
  return {
    id: 'Tdarr_Plugin_tws101_Keep_One_Audio_Stream',
    Stage: 'Pre-processing',
    Name: 'tws101 Keep One Audio Stream',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `
One Audio Stream will be kept or created. Choose Language, Codec, Channels, and Bit Rate of the desired stream.  If language is not found, und language will be used, if und is not found, best foreign will be used.
If a channel count higher than the best available is requested, the best possible will be created.  This plugin is an improvement to Keep one audio stream, in three ways, the first is, bit rate is configurable the second is, foreign audio is used.
The third is Commentary and Descriptive tracks are excluded from being the chosen stream.  When choosing your channle count read the tool tip and dont choose unsupported configurations.
`,
//    Created by tws101 
//    Based on Keep One Audio Stream Method
//    Release version
    Version: '1.10',
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "audioCodec",
        type: 'string',
        defaultValue: 'ac3',
        inputUI: {
          type: 'dropdown',
          options: [
            'aac',
            'ac3',
            'eac3',
            'dca',
            'flac',
            'libmp3lame',
            'truehd',
          ],
        },
        tooltip:
          `Enter the desired audio codec
		  If you chose ac3, eac3, dca, libmp3lame, or truehd, make sure you choose a SUPPORTED Channel Count.  Under Channel count Unsupported channel counts are listed by codec.
		  `,
      },
      {
        name: "language",
        type: 'string',
        defaultValue: 'en',
        inputUI: {
          type: 'text',
        },
        tooltip:
          'Tdarr will check to see if the stream language tag includes the tag you specify.'
          + ' Case-insensitive. One tag only',
      },
      {
        name: "channels",
        type: 'number',
        defaultValue: 6,
        inputUI: {
          type: 'dropdown',
          options: [
            '1',
            '2',
            '6',
            '8',
          ],
        },
        tooltip:
          `Enter the desired number of channels
		  The following configurations are NOT supported by ffmpeg, the pluging will be skipped if these are selected.
		  "dca 6 and 8 Channels",
          "libmp3lame 6 and 8 Channels",
          "truehd 1 and 8 Channels",
		  "eac3 8 Channels",
		  "ac3 8 Channels"
		  `,
      },
      {
        name: "bitrate",
        type: 'string',
        defaultValue: '320k',
        inputUI: {
          type: 'text',
        },
        tooltip: `This must be less than the filter bit rate below. Specify the target bit rate:
		The stream will be encoded at this bitrate
        \\n 384k
        \\n 640k
        \\nExample:\\n
        640k
 
       `,
      },
      {
        name: "filter_bitrate",
        type: 'string',
        defaultValue: '330k',
        inputUI: {
          type: 'text',
        },
        tooltip: `This must be greater than the bitrate above. If you are above this number you will be reduced to the chosen value in the bitrate setting above.
		This filter is ignored on "aac", "flac", and "truehd".
        \\n 384k
        \\n 640k
        \\nExample:\\n
        640k
        `,
      },
    ],
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };
  

    //Setup
  var audioCodec = inputs.audioCodec;
  var audioEncoder = audioCodec;
  var bitratecheckdisabled = false;
  var channelCount = inputs.channels;

  //Bitrate settings not supported
  if (
	(inputs.filter_bitrate) < (inputs.bitrate) ||
	(inputs.filter_bitrate) === 0 ||
	(inputs.bitrate) == 0
  ) {
	response.processFile = false;
	response.infoLog += `Bitrate setting are invalid. Reconfigure the Plugin \n`;
	return response;
  }  

  //channel count 1 not supported
  if (
	(['truehd'].includes(audioCodec)) &&
	channelCount === 1
  ) {
	response.processFile = false;
	response.infoLog += `Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin \n`;
	return response;
  }

  //channel count 6 not supported
  if (
	(['dca', 'libmp3lame'].includes(audioCodec)) &&
	channelCount === 6
  ) {
	response.processFile = false;
	response.infoLog += `Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin \n`;
	return response;
  }

  //channel count 8 not supported
  if (
	(['dca', 'libmp3lame', 'truehd', 'ac3', 'eac3'].includes(audioCodec)) &&
	channelCount === 8
  ) {
	response.processFile = false;
	response.infoLog += `Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin \n`;
	return response;
  }
  
  //dont use the bit rate filter on these
  if (['aac', 'truehd', 'flac'].includes(audioCodec)) {
    var bitratecheckdisabled = true;
  }
  
  if (audioEncoder == "dca") {
    audioCodec = "dts";
  }
  if (audioEncoder == "libmp3lame") {
	audioCodec = "mp3";
  }
  
  var langTag = inputs.language;
  var reqLang = langTag;
  langTag = langTag.toLowerCase();
  
  var numberOfAudioStreams = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type == "audio"
  ).length;
	
   //Check to see if a stream meets all condition
  var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
    if (bitratecheckdisabled === false) {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.codec_name === audioCodec &&
          stream.tags.language.toLowerCase().includes(langTag.toLowerCase()) &&
		  stream.channels == channelCount &&
          stream.bit_rate < (inputs.filter_bitrate)
        ) try {
          if (
            stream.tags.title.toLowerCase().includes('commentary') ||
            stream.tags.title.toLowerCase().includes('description') ||
            stream.tags.title.toLowerCase().includes('sdh')
          ) {
            return false;
          }
		  return true;
	
        } catch (err) {
		  return true;
	    }

        return false;
      } catch (err) {}

      return false;
    } else {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.codec_name === audioCodec &&
          stream.tags.language.toLowerCase().includes(langTag.toLowerCase()) &&
          stream.channels == channelCount
        ) try {
          if (
            stream.tags.title.toLowerCase().includes('commentary') ||
            stream.tags.title.toLowerCase().includes('description') ||
            stream.tags.title.toLowerCase().includes('sdh')
          ) {
            return false;
          }
          return true;
        
        } catch (err) {
          return true;
        }
    
        return false;
      } catch (err) {}
    
      return false;
    }
  });
	
	
	//Check to see if a stream that meets the conditions is the only stream or are there multiple
  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
	preset: "",
	response.processFile = false;
	response.infoLog += `☑ File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels. It is less than ${inputs.filter_bitrate}. It is the only track! \n`;
	return response;
  } else if (hasStreamAlready.length >= 1) {
	response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
	response.processFile = true;
	response.infoLog += `☑ File already has ${langTag} stream in ${audioEncoder}, ${channelCount} channels. It is not the only track, It is less than ${inputs.filter_bitrate}. Removing others. \n`;
	return response;
  }
  
  //Check if file has streams with specified lang tag
  var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
	try {
	  if (
	    stream.codec_type == "audio" &&
		stream.tags.language.toLowerCase().includes(langTag)
      ) try {
        if (
        stream.tags.title.toLowerCase().includes('commentary') ||
        stream.tags.title.toLowerCase().includes('description') ||
        stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
		return true;
	
      } catch (err) {
		return true;
	  }

      return false;
    } catch (err) {}

    return false;
  });
  
  console.log("streamsWithLangTag:" + streamsWithLangTag);
  
  //Take decision to create the stream with the language we want or run the backup plan
  
  if (streamsWithLangTag.length != 0) {
	return attemptMakeStreamLang(langTag);
  } else {
	return attemptMakeStreamUnd("und");
  }
  
  //Create stream with desired Langauge
  
  function attemptMakeStreamLang(langTag) {
	var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
	  try {
		if (
		  stream.codec_type == "audio" &&
		  stream.tags.language.toLowerCase().includes(langTag)
        ) try {
          if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
		  ) {
			return false;
		  }
		  return true;
	  
		} catch (err) {
		  return true;
		}
  
		return false;
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
	  response.preset = `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount}  -b:a ${inputs.bitrate}`;
	  response.infoLog += `☑ Creating ${langTag} stream in ${audioEncoder}, ${channelCount} channels, Removing others. \n`;
	  if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
		response.preset += ` -strict -2`;
	  }
	  response.processFile = true;
	  return response;
	} else {
	  var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
		if (bitratecheckdisabled === false) {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  stream.tags.language
				.toLowerCase()
				.includes(langTag.toLowerCase()) &&
			  stream.channels == highestChannelCount.channels &&
			  stream.bit_rate < (inputs.filter_bitrate)
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
			
			} catch (err) {
			  return true;
			}
		
			return false;
		  } catch (err) {}
		
		  return false;
		} else {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  stream.tags.language
				.toLowerCase()
				.includes(langTag.toLowerCase()) &&
			  stream.channels == highestChannelCount.channels
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
				
		    } catch (err) {
			  return true;
			}
			
		    return false;
		  } catch (err) {}
			
		  return false;
		}
	  });
	  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
		response.processFile = false;
		response.infoLog += `☑ The best ${reqLang} stream already exists. It is the only audio stream.\n`;
		return response;
	  } else if (hasStreamAlready.length >= 1) {
		response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
		response.processFile = true;
		response.infoLog += `☑ The best ${reqLang} stream already exists. Removing Others. \n`;
		return response;
	  } else {
		response.preset = `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels}  -b:a ${inputs.bitrate}`;
		response.infoLog += `☑ The required channel count (${channelCount}) is higher than the highest channel available (${highestChannelCount.channels}) in specified lang tag. Creating ${langTag} stream in ${audioEncoder}, (${highestChannelCount.channels}) channels, Removing others. \n`;
		if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
		  response.preset += ` -strict -2`;
		}
		response.processFile = true;
		return response;  
	  }
	}	
  }
  
  //Create Stream with Undefined or Foreign Audio
  function attemptMakeStreamUnd(langTag) {
    var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
      try {
        if (
          stream.codec_type == "audio" &&
          (stream.tags == undefined ||
            stream.tags.language == undefined ||
            stream.tags.language.toLowerCase().includes(langTag))
        ) try {
          if (
            stream.tags.title.toLowerCase().includes('commentary') ||
            stream.tags.title.toLowerCase().includes('description') ||
            stream.tags.title.toLowerCase().includes('sdh')
		  ) {
			return false;
		  }
		  return true;
	  
		} catch (err) {
		  return true;
		}
  
		return false;
	  } catch (err) {}
  
	  return false;
	});
	
	//This section is for Foreign only 
	if (streamsWithLangTag.length == 0) {
	  var allAudioStreams = file.ffProbeData.streams.filter((stream) => {
		try {
		  if (
		    stream.codec_type == "audio"
          ) try {
            if (
              stream.tags.title.toLowerCase().includes('commentary') ||
              stream.tags.title.toLowerCase().includes('description') ||
              stream.tags.title.toLowerCase().includes('sdh')
			) {
			  return false;
			}
			return true;
		  
		  } catch (err) {
			return true;
		  }
	  
		  return false;
		} catch (err) {}
	  
		return false;
	  });
	  
	  var highestChannelCountAll = allAudioStreams.reduce(getHighest);
	  
	  function getHighest(first, second) {
		if (first.channels > second.channels && first) {
		  return first;
		} else {
		  return second;
		}
	  }
	  
	  var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
		if (bitratecheckdisabled === false) {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  stream.channels == channelCount &&
			  stream.bit_rate < (inputs.filter_bitrate)
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
		
			} catch (err) {
			  return true;
			}
	
			return false;
		  } catch (err) {}
	
		  return false;
		} else {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  stream.channels == channelCount &&
			  stream.bit_rate < (inputs.filter_bitrate)
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
			
			  } catch (err) {
				return true;
			  }
		
			return false;
		  } catch (err) {}
		
		  return false;
		}
	  });
	  
	  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
		response.processFile = false;
		response.infoLog += `☑ No ${reqLang} or und streams found. A foreign language stream detected it meets the required channel count ${channelCount} and the Bit Rate requirments.  It is the only stream.  \n`;
		return response;
	  } else if (hasStreamAlready.length >= 1) {
		response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
		response.processFile = true;
		response.infoLog += `☑ No ${reqLang} or und streams found. A foreign language stream detected it meets the required channel count ${channelCount} and the Bit Rate requirments. Removing others. \n`;
		return response;
	  } else {
		if (parseInt(highestChannelCountAll.channels) >= parseInt(channelCount)) {
		  response.preset = `,-map 0:v -map 0:${highestChannelCountAll.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount}  -b:a ${inputs.bitrate}`;
		  response.infoLog += `☑ No ${reqLang} or und streams found. A foreign language stream detected. Creating stream in ${audioEncoder}, ${channelCount} channels, Removing others. \n`;
		  if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
			response.preset += ` -strict -2`;
		  }
		  response.processFile = true;
	      return response;
  	    } else {
		  var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
			if (bitratecheckdisabled === false) {
			  try {
				if (
				  stream.codec_type == "audio" &&
				  stream.codec_name === audioCodec &&
				  stream.channels == highestChannelCountAll.channels &&
				  stream.bit_rate < (inputs.filter_bitrate)
				) try {
				  if (
					stream.tags.title.toLowerCase().includes('commentary') ||
					stream.tags.title.toLowerCase().includes('description') ||
					stream.tags.title.toLowerCase().includes('sdh')
				  ) {
					return false;
				  }
				  return true;
				
				} catch (err) {
				  return true;
				}
			
					return false;
			  } catch (err) {}
			
			  return false;
			} else {
			  try {
				if (
				  stream.codec_type == "audio" &&
				  stream.codec_name === audioCodec &&
				  stream.channels == highestChannelCountAll.channels
				) try {
				  if (
					stream.tags.title.toLowerCase().includes('commentary') ||
					stream.tags.title.toLowerCase().includes('description') ||
					stream.tags.title.toLowerCase().includes('sdh')
				  ) {
					return false;
				  }
				  return true;
					
				} catch (err) {
				  return true;
				}
				
				return false;
			  } catch (err) {}
				
			  return false;
			}
		  });
  		
  		  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
  		    response.processFile = false;
  			response.infoLog += `☑ No ${reqLang} streams. The best foreign stream already exists. It is the only audio stream. \n`;
  		    return response;
  		  } else if (hasStreamAlready.length >= 1) {
  		    response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
  			response.processFile = true;
  			response.infoLog += `☑ No ${reqLang} streams. The best foreign stream already exists. Removing others. \n`;
  			return response;
  		  } else {
  		    response.preset = `,-map 0:v -map 0:${highestChannelCountAll.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCountAll.channels}  -b:a ${inputs.bitrate}`;
  		    response.infoLog += `☑ No ${reqLang} or und streams found. A foreign language stream detected. The required channel count (${channelCount}) is higher than the highest channel available (${highestChannelCountAll.channels}). Creating stream in ${audioEncoder}, (${highestChannelCountAll.channels}) channels, Removing others. \n`;
  		    if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
  		      response.preset += ` -strict -2`;
  		    }
  		    response.processFile = true;
  		    return response;
  		  }
  	    }
	  }
	}
	//The section deals with Undefinded only
	
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
		if (bitratecheckdisabled === false) {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  (stream.tags == undefined ||
				stream.tags.language == undefined ||
				stream.tags.language.toLowerCase().includes(langTag)) &&
			  stream.channels == channelCount &&
			  stream.bit_rate < (inputs.filter_bitrate)
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
			
			} catch (err) {
			  return true;
			}
		
			return false;
		  } catch (err) {}
		
		  return false;
		} else {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  (stream.tags == undefined ||
				stream.tags.language == undefined ||
				stream.tags.language.toLowerCase().includes(langTag)) &&
			  stream.channels == channelCount
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
				
			  } catch (err) {
				return true;
			  }
			
		    return false;
		  } catch (err) {}
			
		  return false;
		}
	  });
	  
	  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
		response.processFile = false;
		response.infoLog += `☑ No ${reqLang} streams. The required und stream already exists. It is the only audio stream. \n`;
		return response;
	  } else if (hasStreamAlready.length >= 1) {
		response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
		response.processFile = true;
		response.infoLog += `☑ No ${reqLang} streams. The required und stream already exists. Removing others. \n`;
		return response;
	  } else {
	    response.preset = `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${channelCount}  -b:a ${inputs.bitrate}`;
		response.infoLog += `☑ No ${reqLang} streams. Creating und stream in ${audioEncoder}, ${channelCount} channels, Removing others. \n`;
		if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
		  response.preset += ` -strict -2`;
		}
		response.processFile = true;
		return response;
	  }
	} else {
	  var hasStreamAlready = file.ffProbeData.streams.filter((stream) => {
		if (bitratecheckdisabled === false) {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  (stream.tags == undefined ||
				stream.tags.language == undefined ||
				stream.tags.language.toLowerCase().includes(langTag)) &&
			  stream.channels == highestChannelCount.channels &&
			  stream.bit_rate < (inputs.filter_bitrate)
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
			
			} catch (err) {
			  return true;
			}
		
			return false;
		  } catch (err) {}
		
		  return false;
		} else {
		  try {
			if (
			  stream.codec_type == "audio" &&
			  stream.codec_name === audioCodec &&
			  (stream.tags == undefined ||
				stream.tags.language == undefined ||
				stream.tags.language.toLowerCase().includes(langTag)) &&
			  stream.channels == highestChannelCount.channels
			) try {
			  if (
				stream.tags.title.toLowerCase().includes('commentary') ||
				stream.tags.title.toLowerCase().includes('description') ||
				stream.tags.title.toLowerCase().includes('sdh')
			  ) {
				return false;
			  }
			  return true;
				
			} catch (err) {
			  return true;
			}
			
		  return false;
		  } catch (err) {}
			
		  return false;
	    }
	  });
	  
	  if (numberOfAudioStreams == 1 && hasStreamAlready.length == 1) {
		response.processFile = false;
		response.infoLog += `☑ No ${reqLang} streams. The best und stream already exists. It is the only audio stream. \n`;
		return response;
	  } else if (hasStreamAlready.length >= 1) {
		response.preset = `,-map 0:v -map 0:${hasStreamAlready[0].index} -map 0:s? -map 0:d? -c copy`;
		response.processFile = true;
		response.infoLog += `☑ No ${reqLang} streams. The best und stream already exists. Removing others. \n`;
		return response;
	  } else {
		response.preset = `,-map 0:v -map 0:${highestChannelCount.index} -map 0:s? -map 0:d? -c copy -c:a:0 ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate}`;
		response.infoLog += `☑ No ${reqLang} streams. The required channel count (${channelCount}) is higher than the highest channel available (${highestChannelCount.channels}). Creating und stream in ${audioEncoder}, (${highestChannelCount.channels}) channels, Removing others.`;
		if (['dts', 'truehd', 'flac'].includes(audioCodec)) {
		  response.preset += ` -strict -2`;
		}
		response.processFile = true;
		return response;
	  }
	}
  }  
};

module.exports.details = details;
module.exports.plugin = plugin;
