const details = () => ({
  id: 'Tdarr_Plugin_advo_FFMPEG_NVENC_Tiered_MKV_with_rollback',
  Stage: 'Pre-processing',
  Name: 'Tiered FFMPEG NVENC with HDR tonemap and rollback',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
    - REQUIRES FFMPEG 5 or higher. Ideally just use the latest if possible. 
    Will not work right with the version of ffmpeg included with tdar.\n
    - Requires MediaInfo to be enabled for the library.\n
    - Post transcode size filter, but instead of cancelling stack, 
    will rollback to original video to allow other audio/subtitle plugins to execute.
    Recommended to place this as the first plugin, so the size filter will 
    only check the video stream size difference.\n
    - Will detect HDR and tonemap to SDR.\n
    - Uses different FFMPEG NVENC transcoding settings for 480p,576p,720p,1080p and 4KUHD.\n
    - 10 bit output.\n
    - The output container is mkv. Converts or strips streams which mkv doesn't support.\n
    - bFrame support.\n
    - Portions borrowed from Migz remux and iiDrakeii.\n\n`,
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,video only,nvenc h265',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 90,
      inputUI: {
        type: 'text',
      },
      tooltip:
          `Enter the upper bound % size for the new file. For example, if '90' is entered, 
          then if the new file size is larger than 90% of the original size then the original 
          video stream will be used instead of the transcoded video stream.`,
    },
    {
      name: 'hevcBitrateCutoff',
      type: 'string',
      defaultValue: '5000',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the bitrate cutoff for h265 reencoding in kilobytes. 
       \\nExample:\\n 
      
      2000`,
    },
    {
      name: 'h264BitrateCutoff',
      type: 'string',
      defaultValue: '2000',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the bitrate cutoff for h264 reencoding in kilobytes. 
       \\nExample:\\n 
      
      1000`,
    },
    {
      name: 'sdCQV',
      type: 'string',
      defaultValue: '24',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CQ:V value you want for 480p and 576p content. 
       \\nExample:\\n 
      
      21`,
    },
    {
      name: 'sdMaxBitrate',
      type: 'string',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the maximum bitrate cutoff you want for 480p and 576p content in kilobytes. 
      Use 0 for no bitrate limit (purely based on the CQ setting).
       \\nExample:\\n 
      
      3000`,
    },
    {
      name: 'hdCQV',
      type: 'string',
      defaultValue: '26',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CQ:V value you want for 720p content.  
      
      \\nExample:\\n
      23`,
    },
    {
      name: 'hdMaxBitrate',
      type: 'string',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the maximum bitrate cutoff you want for 720p content in kilobytes. 
      Use 0 for no bitrate limit (purely based on the CQ setting).
       \\nExample:\\n 
      
      4000`,
    },
    {
      name: 'fullhdCQV',
      type: 'string',
      defaultValue: '28',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CQ:V value you want for 1080p content.  
      
      \\nExample:\\n
      25`,
    },
    {
      name: 'fullhdMaxBitrate',
      type: 'string',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the maximum bitrate cutoff you want for 1080p content in kilobytes. 
      Use 0 for no bitrate limit (purely based on the CQ setting).
       \\nExample:\\n 
      
      5000`,
    },
    {
      name: 'uhdCQV',
      type: 'string',
      defaultValue: '30',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CQ:V value you want for 4K/UHD/2160p content.  
      
      \\nExample:\\n
      27`,
    },
    {
      name: 'uhdMaxBitrate',
      type: 'string',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the maximum bitrate cutoff you want for 4K/UHD/2160p content in kilobytes. 
      Use 0 for no bitrate limit (purely based on the CQ setting).
       \\nExample:\\n 
      
      14000`,
    },
    {
      name: 'bframe',
      type: 'string',
      defaultValue: '5',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify amount of b-frames to use, 0-5. Use 0 to disable. 
      (GPU must support this, turing and newer supports this, except for the 1650)  
      
      \\nExample:\\n
      5`,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  let cqv = 25;
  let maxBitrate = 0;

  let extraOptions = '';
  let transcode = 0; // if this var changes to 1 the file will be transcoded
  let bitrateprobe = 0; // bitrate from ffprobe
  const bitratetarget = 0;
  const bitratecheck = 0;
  let isHevc = false;
  let isHDR = false;
  let subcli = '';
  let maxmux = '';

  let filterCommand = '';
  let map = '-map 0 -c copy ';

  let duration = '';
  let videoTrackIdx = 0;
  let videoStream = {};
  let videoTrack = {};

  const newSize = file.file_size;
  const oldSize = otherArguments.originalLibraryFile.file_size;

  const ratio = parseInt((newSize / oldSize) * 100, 10);

  const getBound = (bound) => (bound / 100) * oldSize;

  // default values that will be returned
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: '',
    maxmux: false,
  };

  if (newSize > getBound(inputs.upperBound)
      && file.mediaInfo.track[0].extra !== undefined
      && file.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE !== undefined
      && file.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE === 'true'
      && file.mediaInfo.track[0].extra.ADVOVTRANSCODEDISCARDED === undefined) {
    if (otherArguments.originalLibraryFile.mediaInfo.track[0].extra !== undefined
      && otherArguments.originalLibraryFile.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE !== undefined
      && otherArguments.originalLibraryFile.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE === 'true') {
      response.processFile = false;
      response.infoLog += '☑File has already been transcoded! \n';
      return response;
    }

    const sizeText = `New file has size ${newSize.toFixed(3)} MB which is ${ratio}% `
      + `of original file size:  ${oldSize.toFixed(3)} MB`;

    response.infoLog += `${sizeText}. upperBound is ${inputs.upperBound}%. 
    Discarding transcoded video and using original.`;

    response.processFile = true;
    response.FFmpegMode = true;
    response.preset = `<io> -i "${otherArguments.originalLibraryFile.file}" -map 1:v -map 0:a? -map 0:s? `
      + '-map_metadata 0 -map_chapters 0 -c:v copy -c:a copy -c:s copy -max_muxing_queue_size 9999 '
      + '-metadata ADVOVTRANSCODEDISCARDED=true ';
    return response;
  }

  // find video stream
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const currStream = file.ffProbeData.streams[i];

    try {
      if (currStream.codec_type.toLowerCase() === 'video') {
        if (currStream.codec_name.toLowerCase() !== 'png'
          && currStream.codec_name.toLowerCase() !== 'bmp'
          && currStream.codec_name.toLowerCase() !== 'gif'
          && currStream.codec_name.toLowerCase() !== 'mjpeg') {
          videoTrackIdx = i;
          videoStream = currStream;
          break;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  // find video media info track
  for (let i = 1; i < file.mediaInfo.track.length; i += 1) {
    const currTrack = file.mediaInfo.track[i];

    try {
      if (currTrack.StreamOrder !== undefined && parseInt(currTrack.StreamOrder, 10) === videoTrackIdx) {
        videoTrack = currTrack;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  if (inputs.bframe > 0) {
    // only use temporal_aq if bframes are enabled.
    extraOptions += ` -bf ${inputs.bframe} -b_ref_mode 1 -temporal_aq:v 1 -aq-strength:v 8 `;
  }

  if (typeof file.meta.Duration !== 'undefined') {
    duration = file.meta.Duration / 60;
  } else {
    duration = videoTrack.Duration / 60;
  }

  // check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video! \n';
    return response;
  }

  bitrateprobe = videoTrack.BitRate;
  response.infoLog += `☑ BitRate: ${bitrateprobe} \n`;

  if (bitrateprobe == null || bitrateprobe < 100000) {
    bitrateprobe = videoTrack.OverallBitRate;
    response.infoLog += `☑ OverallBitRate: ${bitrateprobe} \n`;

    if (bitrateprobe == null || bitrateprobe < 100000) {
      bitrateprobe = videoTrack.BitRate_Maximum;
      response.infoLog += `☑ BitRate_Maximum: ${bitrateprobe} \n`;

      if (bitrateprobe == null || bitrateprobe < 100000) {
        bitrateprobe = file.bit_rate;
        response.infoLog += `☑ bit_rate: ${bitrateprobe} \n`;

        if (bitrateprobe == null || bitrateprobe < 100000) {
          bitrateprobe = (file.file_size / (duration * 0.0075)) * 1024;
          response.infoLog += `☑ estimated bit rate: ${bitrateprobe} \n`;
        }
      }
    }
  }

  response.infoLog += '☑File is a video! \n';

  if (file.mediaInfo.track[0].extra !== undefined
    && file.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE !== undefined
    && file.mediaInfo.track[0].extra.ADVOVTRANSCODEDONE === 'true') {
    response.processFile = false;
    response.infoLog += '☑File has already been transcoded! \n';
    return response;
  }

  response.infoLog += `☑ Codec: ${videoStream.codec_name} \n`;

  // codec will be checked so it can be transcoded correctly
  if (videoStream.codec_name.toLowerCase() === 'hevc') {
    isHevc = true;

    if (bitrateprobe == null || bitrateprobe < 100000) {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }

    if ((file.video_resolution === '480p' || file.video_resolution === '576p')
      && (bitrateprobe / 1024) < inputs.hevcBitrateCutoff * 0.5) {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }
    if (file.video_resolution === '720p' && (bitrateprobe / 1024) < inputs.hevcBitrateCutoff * 0.75) {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }

    if (file.video_resolution === '1080p' && (bitrateprobe / 1024) < inputs.hevcBitrateCutoff) {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }
    if (file.video_resolution === '4KUHD' && (bitrateprobe / 1024) < inputs.hevcBitrateCutoff * 1.5) {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }

    response.preset = '-c:v hevc_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'h264') {
    if (bitrateprobe == null || bitrateprobe < 100000) {
      response.processFile = false;
      response.infoLog += '☑File is below cutoff already! \n';
      return response;
    }
    if ((file.video_resolution === '480p' || file.video_resolution === '576p')
      && (bitrateprobe / 1024) < inputs.h264BitrateCutoff * 0.5) {
      response.processFile = false;
      response.infoLog += '☑File is below cutoff already! \n';
      return response;
    }
    if (file.video_resolution === '720p' && (bitrateprobe / 1024) < inputs.h264BitrateCutoff * 0.75) {
      response.processFile = false;
      response.infoLog += '☑File is below cutoff already! \n';
      return response;
    }

    if (file.video_resolution === '1080p' && (bitrateprobe / 1024) < inputs.h264BitrateCutoff) {
      response.processFile = false;
      response.infoLog += '☑File is below cutoff already! \n';
      return response;
    }
    if (file.video_resolution === '4KUHD' && (bitrateprobe / 1024) < inputs.h264BitrateCutoff * 1.5) {
      response.processFile = false;
      response.infoLog += '☑File is below cutoff already! \n';
      return response;
    }

    if (parseInt(videoTrack.BitDepth, 10) > 8) {
      // Remove HW Decoding for 10 bit
    } else {
      response.preset = '-c:v h264_cuvid';
    }
  } else if (file.video_codec_name.toLowerCase() === 'mjpeg') {
    response.preset = 'c:v mjpeg_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'mpeg1') {
    response.preset = '-c:v mpeg1_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'mpeg2') {
    response.preset = '-c:v mpeg2_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'mpeg4') {
    response.preset = '-c:v mpeg4_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'vc1') {
    response.preset = '-c:v vc1_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'vp8') {
    response.preset = '-c:v vp8_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'vp9') {
    response.preset = '-c:v vp9_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'av1') {
    response.preset = '-c:v av1_cuvid';
  } else if (file.video_codec_name.toLowerCase() === 'vc1') {
    response.preset = '-c:v vc1_cuvid';
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // strip streams not supported by mkv
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() === 'eia_608'
        || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'timed_id3'
        // || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'dvd_subtitle'
      ) {
        map += ` -map -0:${i} `;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }

    // convert mp4 subs that mkv doesn't support
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
          && file.ffProbeData.streams[i].codec_name.toLowerCase() === 'mov_text') {
        subcli += ` -c:${i} srt `;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }

    // mitigate TrueHD audio causing Too many packets error
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() === 'truehd'
        || (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'dts'
          && file.ffProbeData.streams[i].profile.toLowerCase() === 'dts-hd ma')
        || (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'aac'
          && file.ffProbeData.streams[i].sample_rate.toLowerCase() === '44100'
          && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio')
      ) {
        maxmux = ' -max_muxing_queue_size 9999';
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }

    // mitigate errors due to embeded pictures
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video'
        && (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'png'
          || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'bmp'
          || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'mjpeg')
      ) {
        map += ` -map -0:${i} `;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  if (file.video_resolution === '480p' || file.video_resolution === '576p') {
    cqv = inputs.sdCQV;
    maxBitrate = inputs.sdMaxBitrate;
    transcode = 1;
  }

  if (file.video_resolution === '720p') {
    cqv = inputs.hdCQV;
    maxBitrate = inputs.hdMaxBitrate;
    transcode = 1;
  }

  if (file.video_resolution === '1080p') {
    cqv = inputs.fullhdCQV;
    maxBitrate = inputs.fullhdMaxBitrate;
    transcode = 1;
  }

  if (file.video_resolution === '4KUHD') {
    cqv = inputs.uhdCQV;
    maxBitrate = inputs.uhdMaxBitrate;
    transcode = 1;
  }

  // need to find a reliable test for HDR content
  if (videoStream.color_transfer !== undefined
    && (videoStream.color_transfer.toLowerCase() === 'smpte2084'
    || videoStream.color_transfer.toLowerCase() === 'arib-std-b67')) {
    isHDR = true;
    if (filterCommand !== '') {
      filterCommand += ',';
    }
    filterCommand += 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,'
      + 'tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=p010le';
  }

  // check if the file is eligible for transcoding
  // if true the neccessary response values will be changed
  if (transcode === 1) {
    if (filterCommand !== '') {
      response.preset = ''; // hardware decoding doesn't seem to work with the HDR tonemapping filter. Not sure why
      filterCommand = `-vf "${filterCommand}"`;
    }

    response.preset += `<io> ${map} -dn -c:v hevc_nvenc -profile:v main10 -preset p5 -tune hq -pix_fmt p010le `
      + `${filterCommand} -rc:v vbr `
      + `-multipass 2 -bufsize 600M -b:v 0 -maxrate:v ${maxBitrate} -qmin 0 -qmax ${cqv} -cq:v ${cqv} `
      + `-rc-lookahead 32 -nonref_p 1 -a53cc 0 -threads 0 ${extraOptions} ${subcli} ${maxmux} `
      + '-metadata ADVOVTRANSCODEDONE=true';

    response.processFile = true;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution}!\n`;

    if (isHevc) {
      response.infoLog += '☒File is hevc, but above cutoff!\n';
    } else {
      response.infoLog += '☒File is not hevc!\n';
    }

    if (isHDR) {
      response.infoLog += '☒File is HDR, tonemapping to SDR!\n';
    }

    response.infoLog += `☒File bitrate is ${parseInt(bitrateprobe / 1024, 10)}kb!\n`;

    if (bitrateprobe < bitratecheck) {
      response.infoLog += 'File bitrate is LOWER than the Default Target Bitrate!\n';
    } else {
      response.infoLog += 'File bitrate is HIGHER than the Default Target Bitrate!\n';
    }

    response.infoLog += `☒Target Bitrate set to ${bitratetarget}kb!\n`;
    response.infoLog += 'File is being transcoded!\n';
  }

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
