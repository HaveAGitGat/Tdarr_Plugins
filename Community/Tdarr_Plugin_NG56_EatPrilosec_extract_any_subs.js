// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_NG56_EatPrilosec_extract_any_subs',
  Stage: 'Pre-processing',
  Name: 'Extract any embedded subtitles to specified filetype and optionally remove them',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin extracts embedded subs *bitmap style friendly*  \n\n '
      + 'This plugin is a modified version of "Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT" but extracts '
      + 'any subtitle format supported by tdarr\'s ffmpeg to the specified extension in the options. the title of the subs will be added to the end of the subtitles before the language code.',
  Version: '1.00',
  Tags: 'pre-processing,subtitle only,ffmpeg,configurable',
  Inputs: [
    {
      name: 'remove_subs',
      type: 'string',
      defaultValue: 'no',
      inputUI: {
        type: 'text',
      },
      tooltip: `Do you want to remove subtitles after they are  extracted?
        
        \\nExample:\\n
        
        yes
        
        \\nExample:\\n
        
        no
        `,
    },
	{
      name: 'ass_extension',
      type: 'string',
      defaultValue: 'ass',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for ASS (Advanced SSA) subtitle (ass)
        
        \\nExample:\\n
        
        ass
        `,
    },
	{
      name: 'dvb_subtitle_extension',
      type: 'string',
      defaultValue: 'sub',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for DVB subtitles (dvb_subtitle)
        
        \\nExample:\\n
        
        sub
        `,
    },
	{
      name: 'dvd_subtitle_extension',
      type: 'string',
      defaultValue: 'sub',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for DVD subtitles (dvd_subtitle)
        
        \\nExample:\\n
        
        sub
        `,
    },
	{
      name: 'hdmv_pgs_subtitle_extension',
      type: 'string',
      defaultValue: 'sup',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for Presentation Grapic Stream Subtitle (hdmv_pgs_subtitle)
        
        \\nExample:\\n
        
        sup
        `,
    },
	{
      name: 'hdmv_text_subtitle_extension',
      type: 'string',
      defaultValue: 'sup',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for HDMV Text subtitle (hdmv_text_subtitle)
        
        \\nExample:\\n
        
        sup
        `,
    },
	{
      name: 'jacosub_extension',
      type: 'string',
      defaultValue: 'jss',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for JACOsub subtitle (jacosub)
        
        \\nExample:\\n
        
        jss
        `,
    },
	{
      name: 'microdvd_extension',
      type: 'string',
      defaultValue: 'sub',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for MicroDVD subtitle (microdvd)
        
        \\nExample:\\n
        
        sub
        `,
    },
	{
      name: 'mpl2_extension',
      type: 'string',
      defaultValue: 'mpl',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for MPL2 subtitle (mpl2)
        
        \\nExample:\\n
        
        mpl
        `,
    },
	{
      name: 'pjs_extension',
      type: 'string',
      defaultValue: 'pjs',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for PJS (Phoenix Japanimation Society) subtitle (pjs)
        
        \\nExample:\\n
        
        pjs
        `,
    },
	{
      name: 'realtext_extension',
      type: 'string',
      defaultValue: 'rt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for RealText subtitle (realtext)
        
        \\nExample:\\n
        
        rt
        `,
    },
	{
      name: 'sami_extension',
      type: 'string',
      defaultValue: 'smi',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SAMI subtitle (sami)
        
        \\nExample:\\n
        
        smi
        
        \\nExample:\\n
        
        sami
        `,
    },
	{
      name: 'srt_extension',
      type: 'string',
      defaultValue: 'srt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SubRip subtitle with embedded timing (srt)
        
        \\nExample:\\n
        
        srt
        `,
    },
	{
      name: 'ssa_extension',
      type: 'string',
      defaultValue: 'ssa',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SSA (SubStation Alpha) subtitle (ssa)
        
        \\nExample:\\n
        
        ssa
        `,
    },
	{
      name: 'stl_extension',
      type: 'string',
      defaultValue: 'stl',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for Spruce subtitle format (stl)
        
        \\nExample:\\n
        
        stl
        `,
    },
	{
      name: 'subrip_extension',
      type: 'string',
      defaultValue: 'srt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SubRip subtitle (subrip)
        
        \\nExample:\\n
        
        srt
        `,
    },
	{
      name: 'subviewer_extension',
      type: 'string',
      defaultValue: 'sub',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SubViewer subtitle (subviewer)
        
        \\nExample:\\n
        
        svb
        
        \\nExample:\\n
        
        sub
        `,
    },
	{
      name: 'subviewer1_extension',
      type: 'string',
      defaultValue: 'sub',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SubViewer v1 subtitle (subviewer1)
        
        \\nExample:\\n
        
        svb
        
        \\nExample:\\n
        
        sub
        `,
    },
	{
      name: 'vplayer_extension',
      type: 'string',
      defaultValue: 'txt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for VPlayer subtitle (vplayer)
        
        \\nExample:\\n
        
        txt
        `,
    },
	{
      name: 'webvtt_extension',
      type: 'string',
      defaultValue: 'vtt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for WebVTT subtitle (webvtt)
        
        \\nExample:\\n
        
        vtt
        `,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')(); const fs = require('fs');
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object at some point in the function else plugin will fail.
  const response = {
    processFile: true,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  if (inputs.remove_subs === undefined) {
    response.processFile = false;
    response.infoLog += '☒ Inputs not entered! \n';
    return response;
  }

  const subsArr = file.ffProbeData.streams.filter((row) => row.codec_type === 'subtitle');

  if (subsArr.length === 0) {
    response.infoLog += 'No subs in file to extract!\n';
    response.processFile = false;
    return response;
  }
  response.infoLog += 'Found subs to extract!\n';

  let command = '-y <io>';
  for (let i = 0; i < subsArr.length; i += 1) {
    const subStream = subsArr[i];
    let lang = '';
    let title = 'none';
	var processsubs = 'yes';
	var thisformat = '';
    if (subStream && subStream.tags && subStream.tags.language) {
      lang = subStream.tags.language;
    }

    if (subStream && subStream.tags && subStream.tags.title) {
      title = subStream.tags.title;
      titleFileName = title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
      titleFileName = titleFileName.replace(/ /g, "_")
      titleFileName = titleFileName.replace("___", "_")
      titleFileName = titleFileName.replace("__", "_")
    }

    

    const { originalLibraryFile } = otherArguments;

    let subsFile = '';

    // for Tdarr V2 (2.00.05+)
    if (originalLibraryFile && originalLibraryFile.file) {
      subsFile = originalLibraryFile.file;
    } else {
      // for Tdarr V1
      subsFile = file.file;
    }
    subsFile = subsFile.split('.');
    
    if (subStream && subStream.tags && subStream.tags.title) {
      subsFile[subsFile.length - 2] += `.${titleFileName}`;
    }

    subsFile[subsFile.length - 2] += `.${lang}`;
    
    if (subStream.codec_name.toLowerCase().includes('ass')) {
      subsFile[subsFile.length - 1] = inputs.ass_extension;
      var thisformat = 'ass';
    } else if (subStream.codec_name.toLowerCase().includes('dvb_subtitle')) {
      subsFile[subsFile.length - 1] = inputs.dvb_subtitle_extension;
      var thisformat = 'sub';
    } else if (subStream.codec_name.toLowerCase().includes('dvd_subtitle')) {
      subsFile[subsFile.length - 1] = inputs.dvd_subtitle_extension;
      var thisformat = 'sub';
    } else if (subStream.codec_name.toLowerCase().includes('hdmv_pgs_subtitle')) {
      subsFile[subsFile.length - 1] = inputs.hdmv_pgs_subtitle_extension;
      var thisformat = 'sup';
    } else if (subStream.codec_name.toLowerCase().includes('hdmv_text_subtitle')) {
      subsFile[subsFile.length - 1] = inputs.hdmv_text_subtitle_extension;
      var thisformat = 'sup';
    } else if (subStream.codec_name.toLowerCase().includes('jacosub')) {
      subsFile[subsFile.length - 1] = inputs.jacosub_extension;
      var thisformat = 'jss';
    } else if (subStream.codec_name.toLowerCase().includes('microdvd')) {
      subsFile[subsFile.length - 1] = inputs.microdvd_extension;
      var thisformat = 'sub';
    } else if (subStream.codec_name.toLowerCase().includes('mpl2')) {
      subsFile[subsFile.length - 1] = inputs.mpl2_extension;
      var thisformat = 'mpl';
    } else if (subStream.codec_name.toLowerCase().includes('pjs')) {
      subsFile[subsFile.length - 1] = inputs.pjs_extension;
      var thisformat = 'pjs';
    } else if (subStream.codec_name.toLowerCase().includes('realtext')) {
      subsFile[subsFile.length - 1] = inputs.realtext_extension;
      var thisformat = 'rt';
    } else if (subStream.codec_name.toLowerCase().includes('sami')) {
      subsFile[subsFile.length - 1] = inputs.sami_extension;
      var thisformat = 'sami';
    } else if (subStream.codec_name.toLowerCase().includes('srt')) {
      subsFile[subsFile.length - 1] = inputs.srt_extension;
      var thisformat = 'srt';
    } else if (subStream.codec_name.toLowerCase().includes('ssa')) {
      subsFile[subsFile.length - 1] = inputs.ssa_extension;
      var thisformat = 'ass';
    } else if (subStream.codec_name.toLowerCase().includes('stl')) {
      subsFile[subsFile.length - 1] = inputs.stl_extension;
      var thisformat = 'stl';
    } else if (subStream.codec_name.toLowerCase().includes('subrip')) {
      subsFile[subsFile.length - 1] = inputs.subrip_extension;
      var thisformat = 'srt';
    } else if (subStream.codec_name.toLowerCase().includes('subviewer')) {
      subsFile[subsFile.length - 1] = inputs.subviewer_extension;
      var thisformat = 'svb';
    } else if (subStream.codec_name.toLowerCase().includes('subviewer1')) {
      subsFile[subsFile.length - 1] = inputs.subviewer1_extension;
      var thisformat = 'svb';
    } else if (subStream.codec_name.toLowerCase().includes('vplayer')) {
      subsFile[subsFile.length - 1] = inputs.vplayer_extension;
      var thisformat = 'txt';
    } else if (subStream.codec_name.toLowerCase().includes('webvtt')) {
      subsFile[subsFile.length - 1] = inputs.webvtt_extension;
      var thisformat = 'vtt';
    } else {
	  var processsubs = 'no';
      response.infoLog += 'these subs are not extractable by the ffmpeg included with tdarr\n';
    }

    subsFile = subsFile.join('.');

    const { index } = subStream;
	if (processsubs === 'yes') {
		if (fs.existsSync(`${subsFile}`)) {
		  response.infoLog += `${lang}.srt already exists. Skipping!\n`;
		} else {
		  response.infoLog += `Extracting ${subsFile}\n`;
		  command += ` -f:${index} ${thisformat} -map 0:${index} -scodec copy "${subsFile}"`;
		}
    }
  }

  if (command === '-y <io>') {
    response.infoLog += 'All subs already extracted!\n';
    if (inputs.remove_subs === 'no') {
      response.processFile = false;
      return response;
    }
  }

  response.preset = command;

  if (inputs.remove_subs === 'yes') {
    response.preset += ' -map 0 -map -0:s -c copy';
  }

  if (inputs.remove_subs === 'no') {
    response.preset += ' -map 0 -c copy';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
