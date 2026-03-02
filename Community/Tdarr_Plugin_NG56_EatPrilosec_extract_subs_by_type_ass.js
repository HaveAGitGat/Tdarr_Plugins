// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_NG56_EatPrilosec_extract_subs_by_type_ass',
  Stage: 'Pre-processing',
  Name: 'Extract embedded SubStation Alpha (ass/ssa) to specified extension and optionally remove them',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin extracts embedded SubStation Alpha subs  \n\n ',
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
      tooltip: `Do you want to remove subtitles after they are extracted? (only removes extracted subs)
        
        \\nExample:\\n
        
        yes
        
        \\nExample:\\n
        
        no
        `,
    },
	{
      name: 'ssa_extension',
      type: 'string',
      defaultValue: 'ass',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set custom extension for SubStation Alpha output file 
        
        \\nExample:\\n
        
        ass
		
		\\nExample:\\n
        
        ssa
        `,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')(); const fs = require('fs');
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  
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
    response.infoLog += `No subs in file... \n`;
    response.processFile = false;
    return response;
  }
  response.infoLog += `Found some subs, time to check type \n`;

  let command = '-y <io>';
  var removecmd = 'none';
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

    const { index } = subStream;

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
    
    if (subStream.codec_name.toLowerCase().includes('ass') || subStream.codec_name.toLowerCase().includes('ssa')) {
      subsFile[subsFile.length - 1] = inputs.ssa_extension;
      var thisformat = 'ass';
	  if (removecmd === 'none') {
      var removecmd = `-map -0:${index}`;
	  } else {
      removecmd += ` -map -0:${index}`; 
	  }
    } else  {
	  var processsubs = 'no';
      response.infoLog += `subs in stream ${index} are not extractable by this plugin \n`;
    }

    subsFile = subsFile.join('.');
    
	if (processsubs === 'yes') {
		if (fs.existsSync(`${subsFile}`)) {
		  response.infoLog += `${subsFile} already exists. Skipping! \\n`;
		} else {
		  response.infoLog += `Extracting ${subsFile} \\n`;
		  command += ` -f:${index} ${thisformat} -map 0:${index} -scodec copy "${subsFile}"`;
		}
    }
  }

  if (command === '-y <io>') {
    response.infoLog += `All subs already extracted!\n`;
    response.processFile = false;
    return response;
  }

  response.preset = command;

  if (inputs.remove_subs === 'yes') {
    if (removecmd === 'none') {
      response.preset += ` -map 0 -c copy`;
    } else {
      response.preset += ` -map 0 ${removecmd} -c copy`; 
    }
  }

  if (inputs.remove_subs === 'no') {
    response.preset += ' -map 0 -c copy';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;