// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_Extract_SRT_Subs',
  Stage: 'Pre-processing',
  Name: 'tws101_SRT_Subtitle_Extractor',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin extracts embedded srt and forced srt subs in one pass inside Tdarr and will optionally remove them. \n\n '
      + 'The subs are placed in the original folder, not the cache folder or a seperate output folder.'
	  + 'Commentary and decriptive are skipped. The first stream of each language and the first forced stream of each language are extracted.',
  // Updated by tws101 as drpeppershaker no longer maintains his
  // Based on drpeppershaker with help from reddit user /u/jakejones48, lots of
  // improvements made after looking at "Tdarr_Plugin_078d" by HaveAGitGat.
  Version: '1.04',
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

  const subsArr = file.ffProbeData.streams.filter((row) => row.codec_name === 'subrip');

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

    if (subStream && subStream.tags && subStream.tags.language) {
      lang = subStream.tags.language;
    }

    if (subStream && subStream.tags && subStream.tags.title) {
      title = subStream.tags.title;
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
	
	if (typeof title === 'string'
	&& title.toLowerCase().includes('forced')) {
		subsFile = subsFile.split('.');
		subsFile[subsFile.length - 2] += `.forced.${lang}`;
		subsFile[subsFile.length - 1] = 'srt';
		subsFile = subsFile.join('.');
	} else {
		subsFile = subsFile.split('.');
		subsFile[subsFile.length - 2] += `.${lang}`;
		subsFile[subsFile.length - 1] = 'srt';
		subsFile = subsFile.join('.');
	}
	
    const { index } = subStream;
    if (fs.existsSync(`${subsFile}`)) {
      response.infoLog += `${lang}.srt already exists. Skipping!\n`;
    } else if (typeof title === 'string'
    && (title.toLowerCase().includes('commentary')
    || title.toLowerCase().includes('description'))) {
      response.infoLog += `Stream ${i} ${lang}.srt is a ${title} track. Skipping!\n`;
    } else {
      response.infoLog += `Extracting ${lang}.srt\n`;
      command += ` -map 0:${index} "${subsFile}"`;
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