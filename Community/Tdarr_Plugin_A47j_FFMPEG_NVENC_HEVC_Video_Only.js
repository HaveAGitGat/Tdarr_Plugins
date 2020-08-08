function details() {
  return {
    id: "Tdarr_Plugin_A47j_FFMPEG_NVENC_HEVC_Video_Only",
    Name: "FFMPEG nvenc_H265 Video Only",
    Type: "Video",
    Stage: "Pre-processing",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin transcodes non-h265 files into h265 mkv using NVENC, 
    reducing resolution to 1920x1080 using nvenc. Audio/subtitles not affected. Bitrate is scaled based on input file quality. 
    == This plugin depends on mediainfo and mkvpropedit, which must be installed manually! 
    Check this gist for details: https://gist.github.com/jeff47/4ec428e329a485a102bab0398e6ac4be == `,
    Version: "1.00",
    Tags: "pre-processing,video only,ffmpeg,nvenc h265,h265",

Inputs: [
      {
        name: "compressionFactor",
        tooltip: `== Compression Factor == \\n\\n
        How much does HEVC compress raw video?  I suggest something between 0.04-0.08.  Remember that GPU encoding is not as 
        efficient as CPU encoding, so resulting file sizes will be larger.\\n\\n
        0.07 will result in a 1080p@29.92fps having a target bitrate of 5.4mbps.  This is the default.\\n`
      },
      {
        name: "maxResolution",
        tooltip: `== Maximum Resolution ==\\n\\n
        Videos that exceed this resolution will be resized down to this resolution.\\n
        Accepted options: 480p, 576p, 720p, 1080p, 4KUHD, 8KUHD.  If left blank, no resizing will occur.\\n`
      },
    ],


  };
}


var MediaInfo = {
  videoHeight: "",
  videoWidth: "",
  videoFPS:"",
  videoBR: "",
  videoBitDepth: "",
  overallBR: "",
  JSRProcessed: false,
  JSRVersion: 0,
  JSRProcessedTime: 0,
}; // var MediaInfo

// Easier for our functions if response has global scope.
var response = {
    processFile: false,
    preset: "",
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
}; // var response

// Runs mkvpropedit --add-track-statistics on the file.
function updateTrackStats(file) {
  response.infoLog += `☑Running mkvpropedit.\n`;
  try {
    const proc = require("child_process");
    proc.execFile('mkvpropedit', [ '--delete-track-statistics-tags', file._id], (error,stdout,stderr) => {
      if (error) throw `mkvpropedit failed: ${error}\n`;
    });
    proc.execFile('mkvpropedit', [ '--add-track-statistics-tags', file._id], (error,stdout,stderr) => {
      if (error) throw `mkvpropedit failed: ${error}\n`;
    });
  } catch (err) {
    response.infoLog += `mkvpropedit failed: ${err}.\n`;
    throw `mkvpropedit failed: ${err}.\n`;
  };  // end try/catch

  return 0;
}  // end updateTrackStats()

// Runs mediainfo on the file, gets JSON output, finds the first video stream and returns the video bit rate and bit depth.
function getMediaInfo(file) {
  var objMedInfo = "";

  response.infoLog += `☑Running mediainfo.\n`;

  try {
    const proc = require('child_process')
    objMedInfo = JSON.parse(proc.execFileSync('mediainfo', [file._id,'--output=JSON']));
  } catch (err) {
    response.infoLog += `Mediainfo failed: ${err}.\n`;
    throw `Mediainfo failed: ${err}.\n`;
  }; // end try/catch

  var videoIdx = -1;
  var videoInxFirst = -1;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {

      strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

      //Looking For Video
      // Check if stream is a video.
      if (videoIdx == -1 && strstreamType == "video") {
          videoIdx = i;
          videoInxFirst = i;

          MediaInfo.videoHeight = Number(file.ffProbeData.streams[i].height);
          MediaInfo.videoWidth = Number(file.ffProbeData.streams[i].width);
          MediaInfo.videoFPS = Number(objMedInfo.media.track[i + 1].FrameRate);
          MediaInfo.videoBR = Number(objMedInfo.media.track[i + 1].BitRate);
          MediaInfo.videoBitDepth = Number(objMedInfo.media.track[i + 1].BitDepth);
      }
  }
     MediaInfo.overallBR = objMedInfo.media.track[0].OverallBitRate;

     try {
       MediaInfo.JSRVersion = Number(objMedInfo.media.track[0].extra.JSRVERSION);
     } catch (err) {
       MediaInfo.JSRVersion = "";
     }

     try {
       MediaInfo.JSRProcessed = Boolean(objMedInfo.media.track[0].extra.JSRPROCESSED);
     } catch (err) {
       MediaInfo.JSRProcessed = "";
     }

     try {
       MediaInfo.JSRProcessedTime = Number(objMedInfo.media.track[0].extra.JSRPROCESSEDTIME);
     } catch (err) {
       MediaInfo.JSRProcessedTime = "";
     }

  return;
} // end  getMediaInfo()

function plugin(file,librarySettings,inputs,otherArguments) {

  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video.\n";
    return response;
  }


  // How much does HVEC compress the raw stream?
  var compressionFactor = 0.07;
  if ( ! isNaN(Number(inputs.compressionFactor)) ) {
    compressionFactor = inputs.compressionFactor; 
  } else {
    response.infoLog += `No compression factor selected, defaulting to ${compressionFactor}.\n`;
  }
  

  // Do we resize?
  var resolutionOrder = [ "480p", "576p", "720p", "1080p", "4KUHD", "8KUHD" ];


  // Define the dimensions and the number of pixels (weightxheight) for each resolution.
  var resolutions = {
    "480p":  { "dimensions":   "640x480", "pixelCount":   307200 },
    "576p":  { "dimensions":   "720x576", "pixelCount":   414720 },
    "720p":  { "dimensions":  "1280x720", "pixelCount":   921600 },
    "1080p": { "dimensions": "1920x1080", "pixelCount":  2073600 },
    "4KUHD": { "dimensions": "3840x2160", "pixelCount":  8294400 },
    "8KUHD": { "dimensions": "7680x4320", "pixelCount": 33177600 }
  };


  var maxResolution = "8KUHD";
  if ( resolutionOrder.indexOf(inputs.maxResolution) > 0 ) {
    maxResolution = inputs.maxResolution;
  } else {
    response.infoLog += `No valid resolution selected, defaulting to ${maxResolution}.\n`;
  }


  //     --------------------------------  METADATA UPDATES   --------------------------------
  // If there is no _STATISTICS_WRITING_DATE_UTC-eng field, then we need to run mkvpropedit and
  //  rerun mediainfo to load the stats.
  if (file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] === undefined ) {
    response.infoLog += "☑Track statistics are missing.\n";
    updateTrackStats(file);
    getMediaInfo(file);
  } else {
    // mkvpropedit records the time the stats were written.  Get it (specify it is in UTC) and add a 10 second buffer.
    StatsWritingTime = Date.parse(`${file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"]} UTC`) + 10000;

    // If the file's mtime is more than 60 seconds later than  StatsWritingTime, then we should rerun mkvpropedit!
    if ( file.statSync.mtimeMs > StatsWritingTime ) {
      response.infoLog += "☑Track statistics are out of date.\n";
      updateTrackStats(file);
      getMediaInfo(file);
    } else {
      response.infoLog += "☑Track statistics are up to date.\n";
      getMediaInfo(file);
    }
  }

  if ( isNaN(MediaInfo.videoBR) || isNaN(MediaInfo.videoBitDepth) ) {
    response.infoLog += "videoBR or videoBitDepth was NaN, something went wrong with mediainfo.\n";
    updateTrackStats(file);
    getMediaInfo(file);
    if ( isNaN(MediaInfo.videoBR) || isNaN(MediaInfo.videoBitDepth) ) {
      response.infoLog += "videoBR or videoBitDepth still NaN, giving up.\n";
      throw ("MediaInfo.videoBR or videoBitDepth still NaN, giving up.");
    }
  }

  // If the overall bitrate is less than the videoBR, then something is wacky.
  if ( MediaInfo.videoBR > MediaInfo.overallBR ) {
    response.infoLog += `videoBR (${MediaInfo.videoBR} was greater than overallBR (${MediaInfo.overallBR}), 
      which is impossible. Updating stats.\n`;
    updateTrackStats(file);
    getMediaInfo(file);
    if ( MediaInfo.videoBR > MediaInfo.overallBR ) {
      response.infoLog += `videoBR and overallBR still inconsistent, giving up.\n`;
      throw (`videoBR (${MediaInfo.videoBR}) and overallBR (${MediaInfo.overallBR}) still inconsistent, giving up.`);
    }
  }


  if ( file.forceProcessing !== true ) {
  if ( MediaInfo.JSRProcessed !== undefined && MediaInfo.JSRProcessed == true) {
    response.infoLog += `JSRPROCESSED metadata tag was true.  This file was already transcoded by this plugin.  Exiting...\n`;
    response.processFile = false;
    return response;
  }
}

  // Set decoding options here
  switch (file.ffProbeData.streams[0].codec_name) {
    case "hevc":
      response.preset = `-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v hevc_cuvid  `;
    break;
    case "h264":
      response.preset = `-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v h264_cuvid `;
    break;
    case "vc1":
      response.preset = `-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vc1_cuvid `;
  break;
  case "vp8":
      response.preset = `-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vp8_cuvid `;
  break;
  case "vp9":
      response.preset = `-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vp9_cuvid `;
    break;
  } //end switch(codec)

// Resize high resolution videos to 1080p.
if ( resolutionOrder.indexOf(file.video_resolution) > resolutionOrder.indexOf(maxResolution) ) {
  // File resolution exceeds limit, need to resize.
  response.preset += ` -resize ${resolutions[maxResolution].dimensions} `;
  response.infoLog += `Resizing to ${resolutions[maxResolution].dimensions}.\n`;
  response.processFile = true;
  var targetBitrate = Math.round((resolutions[maxResolution].pixelCount*MediaInfo.videoFPS)*compressionFactor);
} else {
  // No resize needed.
  var targetBitrate = Math.round((MediaInfo.videoWidth*MediaInfo.videoHeight*MediaInfo.videoFPS)*compressionFactor);
}

// Calculate bitrates
response.infoLog += `Video details: ${file.ffProbeData.streams[0].codec_name}-${file.video_resolution} 
  ${MediaInfo.videoWidth}x${MediaInfo.videoHeight}x${MediaInfo.videoFPS}@8 bits.\n`;

var maxBitrate = Math.round(targetBitrate*1.3);
var minBitrate = Math.round(targetBitrate*0.7);
var bufsize = Math.round(MediaInfo.videoBR);


response.preset += `,-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc -rc:v vbr_hq -preset medium -profile:v main -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096 `;
response.infoLog += `Video bitrate is ${Math.round(MediaInfo.videoBR/1000)}Kbps, overall is ${Math.round(MediaInfo.overallBR/1000)}Kbps. `;
response.infoLog += `Calculated target is ${Math.round(targetBitrate/1000)}Kbps.\n`;


  // Adjust target bitrates by codec and bitrate
  switch (file.ffProbeData.streams[0].codec_name) {
    case "hevc":
      if ( (MediaInfo.videoBR > targetBitrate*1.5) || file.forceProcessing === true )  {
        response.processFile = true;
        response.preset +=` -b:v ${targetBitrate} -maxrate ${maxBitrate} -minrate ${minBitrate} -bufsize ${bufsize} `;
        response.infoLog += `☒HEVC Bitrate for ${file.video_resolution} exceeds ${Math.round(targetBitrate*1.5/1000)}Kbps, 
          downsampling to ${Math.round(targetBitrate/1000)}Kbps.\n`;
      } else {
        response.infoLog += `☑HEVC Bitrate is within limits.\n`
      }
    break; // case "hevc"
    case "h264":
      response.processFile = true;
      // We want the new bitrate to be 70% the h264 bitrate, but not higher than our target.
      new_bitrate = Math.min(Math.round(MediaInfo.videoBR*0.7),targetBitrate);
      // New bitrate should not be lower than our 60% of our target.
      new_bitrate = Math.max( new_bitrate, Math.min(MediaInfo.videoBR, targetBitrate*0.6) );
      response.preset +=` -b:v ${new_bitrate} -maxrate ${Math.round(new_bitrate*1.3)} -minrate ${Math.round(new_bitrate*0.7)}  -bufsize ${bufsize}`;
      response.infoLog += `☒H264 Resolution is ${file.video_resolution}, bitrate was ${Math.round(MediaInfo.videoBR/1000)}Kbps.  
        HEVC target bitrate will be ${Math.round(new_bitrate/1000)}Kbps.\n`;
    break; // case "h264"
    default:
      response.processFile = true;
      response.preset +=` -b:v ${targetBitrate} -maxrate ${maxBitrate} -minrate ${minBitrate}K -bufsize ${bufsize} `;
      response.infoLog += `☒${file.ffProbeData.streams[0].codec_name} resolution is ${file.video_resolution}, 
        bitrate was ${Math.round(MediaInfo.videoBR/1000)}Kbps.  HEVC target bitrate will be ${Math.round(new_bitrate/1000)}Kbps.\n`;
    break; // default
  } // switch (file.ffProbeData.streams[0].codec_name)



  if (response.processFile == true) {
    response.preset += ` -map_metadata:g -1 -metadata JSRVERSION=1 -metadata JSRPROCESSED=true -metadata JSRPROCESSEDTIME=${Date.now()} `;
    response.FFmpegMode = true;
    response.infoLog += `☒Transcoding to HEVC.`;
  } else {
    if (file.container != "mkv") {
      response_preset = ',-c copy -map 0';
      response.processFile = true;
      response.infoLog += `☒Remuxing to mkv.`;
    }
  }


 return response;
} // end plugin()

module.exports.details = details;
module.exports.plugin = plugin;
