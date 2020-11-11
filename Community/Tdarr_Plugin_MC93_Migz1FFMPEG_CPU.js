function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz1FFMPEG_CPU",
    Stage: "Pre-processing",
    Name: "Migz-Transcode Using CPU & FFMPEG",
    Type: "Video",
    Operation: "Transcode",
    Description: `Files not in H265 will be transcoded into H265 using CPU with ffmpeg, settings are dependant on file bitrate, working by the logic that H265 can support the same ammount of data at half the bitrate of H264. \n This plugin will  skip any files that are in the VP9 codec as these are already at a comparable compression level to H265.\n\n`,
    Version: "1.7",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz1FFMPEG_CPU.js",
    Tags: "pre-processing,ffmpeg,video only,configurable,h265",
    Inputs: [
      {
        name: "container",
        tooltip: `Specify output container of file, ensure that all stream types you may have are supported by your chosen container. mkv is recommended.
  	            \\nExample:\\n
  	            mkv

  	            \\nExample:\\n
  	            mp4`,
      },
      {
        name: "bitrate_cutoff",
        tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded. Rate is in kbps. Leave empty to disable.
  	            \\nExample:\\n
  	            6000

  	            \\nExample:\\n
  	            4000`,
      },
      {
        name: "enable_10bit",
        tooltip: `Specify if output file should be 10bit. Default is false.
  	            \\nExample:\\n
  	            true

  	            \\nExample:\\n
  	            false`,
      },
      {
        name: "force_conform",
        tooltip: `Make the file conform to output containers requirements.
                \\n Drop hdmv_pgs_subtitle/eia_608/subrip/timed_id3 for MP4.
                \\n Drop data streams/mov_text/eia_608/timed_id3 for MKV.
                \\n Default is false.
  	            \\nExample:\\n
  	            true

  	            \\nExample:\\n
  	            false`,
      },
    ],
  };
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    preset: "",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
  };

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (!inputs || inputs.container == "") {
    response.infoLog +=
      "☒Container has not been configured within plugin settings, please configure required options. Skipping this plugin. \n";
    response.processFile = false;
    return response;
  } else {
    response.container = "." + inputs.container;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video. \n";
    return response;
  }

  // Check if duration info is filled, if so times it by 0.0166667 to get time in minutes. If not filled then get duration of stream 0 and do the same.
  if (typeof file.meta.Duration != "undefined") {
    var duration = file.meta.Duration * 0.0166667;
  } else {
    var duration = file.ffProbeData.streams[0].duration * 0.0166667;
  }

  // Set up required variables.
  var videoIdx = -1;
  var extraArguments = "";
  var bitrateSettings = "";
  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)" - Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  var currentBitrate = ~~(file.file_size / (duration * 0.0075));
  // Use the same calculation used for currentBitrate but divide it in half to get targetBitrate. Logic of h265 can be half the bitrate as h264 without losing quality.
  var targetBitrate = ~~(file.file_size / (duration * 0.0075) / 2);
  // Allow some leeway under and over the targetBitrate.
  var minimumBitrate = ~~(targetBitrate * 0.7);
  var maximumBitrate = ~~(targetBitrate * 1.3);

  // If targetBitrate comes out as 0 then something has gone wrong and bitrates could not be calculcated. Cancel plugin completely.
  if (targetBitrate == "0") {
    response.processFile = false;
    response.infoLog +=
      "☒Target bitrate could not be calculated. Skipping this plugin. \n";
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff != "") {
    // Checks if currentBitrate is below inputs.bitrate_cutoff, if so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.processFile = false;
      response.infoLog += `☑Current bitrate is below configured bitrate cutoff of ${inputs.bitrate_cutoff}. Nothing to do, cancelling plugin. \n`;
      return response;
    }
  }

  // Check if force_conform option is checked. If so then check streams and add any extra parameters required to make file conform with output format.
  if (inputs.force_conform == "true") {
    if (inputs.container.toLowerCase() == "mkv") {
        extraArguments += `-map -0:d `;
        for (var i = 0; i < file.ffProbeData.streams.length; i++)
			try {
				if (
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "mov_text" ||
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "eia_608" ||
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "timed_id3"
				) {
					extraArguments += `-map -0:${i} `;
				}
			} catch (err) {}
    }
    if (inputs.container.toLowerCase() == "mp4") {
        for (var i = 0; i < file.ffProbeData.streams.length; i++)
			try {
				if (
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "hdmv_pgs_subtitle" ||
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "eia_608" ||
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "subrip" ||
					file.ffProbeData.streams[i].codec_name
					.toLowerCase() == "timed_id3"
				) {
					extraArguments += `-map -0:${i} `;
				}
			} catch (err) {}
    }
}

  // Check if 10bit variable is true.
  if (inputs.enable_10bit == "true") {
    // If set to true then add 10bit argument
    extraArguments += `-pix_fmt p010le `;
  }

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is a video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
          // Check if codec  of stream is mjpeg/png, if so then remove this "video" stream. mjpeg/png are usually embedded pictures that can cause havoc with plugins.
          if (file.ffProbeData.streams[i].codec_name == "mjpeg" || file.ffProbeData.streams[i].codec_name == "png") {
            extraArguments += `-map -v:${videoIdx} `;
        }
      // Check if codec of stream is hevc or vp9 AND check if file.container matches inputs.container. If so nothing for plugin to do.
      if (
        file.ffProbeData.streams[i].codec_name == "hevc" || file.ffProbeData.streams[i].codec_name == "vp9" &&
        file.container == inputs.container
      ) {
        response.processFile = false;
        response.infoLog += `☑File is already hevc or vp9 & in ${inputs.container}. \n`;
        return response;
      }
      // Check if codec of stream is hevc or vp9 AND check if file.container does NOT match inputs.container. If so remux file.
      if (
        file.ffProbeData.streams[i].codec_name == "hevc" || file.ffProbeData.streams[i].codec_name == "vp9" &&
        file.container != "${inputs.container}"
      ) {
        response.infoLog += `☒File is hevc or vp9 but is not in ${inputs.container} container. Remuxing. \n`;
        response.preset = `, -map 0 -c copy ${extraArguments}`;
        response.processFile = true;
        return response;
      }
      // Increment videoIdx.
      videoIdx++;
    }
  }

  // Set bitrateSettings variable using bitrate information calulcated earlier.
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k -maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;
  // Print to infoLog information around file & bitrate settings.
  response.infoLog += `Container for output selected as ${
    inputs.container
  }. \n Current bitrate = ${~~(
    file.file_size /
    (duration * 0.0075)
  )} \n Bitrate settings: \nTarget = ${targetBitrate} \nMinimum = ${minimumBitrate} \nMaximum = ${maximumBitrate} \n`;

  response.preset += `,-map 0 -c:v libx265 ${bitrateSettings} -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
  response.processFile = true;
  response.infoLog += `☒File is not hevc or vp9. Transcoding. \n`;
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
