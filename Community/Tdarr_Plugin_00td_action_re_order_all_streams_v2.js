const details = () => ({
  id: 'Tdarr_Plugin_00td_action_re_order_all_streams_v2',
  Stage: 'Pre-processing',
  Name: 'Re-order All Streams V2',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This action has a built-in filter. Additional filters can be added. \n\n
  This plugin re-orders all streams based on: codecs,channels,languages,streamTypes.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'processOrder',
      type: 'string',
      defaultValue: 'codecs,channels,languages,streamTypes',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the process order.
For example, if 'languages' is first, the streams will be ordered based on that first.
So put the most important properties last.
The default order is suitable for most people.

        \\nExample:\\n
        codecs,channels,languages,streamTypes
        `,
    },
    {
      name: 'languages',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the language tags order, separated by commas. Leave blank to disable.
        \\nExample:\\n
        eng,fre
        `,
    },
    {
      name: 'channels',
      type: 'string',
      defaultValue: '7.1,5.1,2,1',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the channels order, separated by commas. Leave blank to disable.
          
          \\nExample:\\n
          7.1,5.1,2,1`,
    },
    {
      name: 'codecs',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the codec order, separated by commas. Leave blank to disable.
          
          \\nExample:\\n
          aac,ac3`,
    },
    {
      name: 'streamTypes',
      type: 'string',
      defaultValue: 'video,audio,subtitle',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the streamTypes order, separated by commas. Leave blank to disable.
        \\nExample:\\n
        video,audio,subtitle
        `,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: '',
  };

  if (!Array.isArray(file.ffProbeData.streams)) {
    throw new Error('FFprobe was unable to extract any streams info on this file.'
      + 'This may be due to a corrupt file or permissions issue when scanning the file.');
  }

  if (file.container === 'mp4' && file.fileMedium === 'video') {
    if (file.ffProbeData.streams[0].codec_type === 'video') {
      response.infoLog += 'File is mp4 and already has the video stream in the correct order!'
        + ' Due to FFmpeg issues when reordering streams in mp4 files, other stream ordering will be skipped';
      return response;
    }
    response.processFile = true;
    response.infoLog += 'File is mp4 and contains video but video is not first stream, remuxing';
    response.preset = ',-map 0:v? -map 0:a? -map 0:s? -map 0:d? -map 0:t? -c copy';
    return response;
  }

  let { streams } = JSON.parse(JSON.stringify(file.ffProbeData));

  streams.forEach((stream, index) => {
    // eslint-disable-next-line no-param-reassign
    stream.typeIndex = index;
  });

  const originalStreams = JSON.stringify(streams);

  const sortStreams = (sortType) => {
    const items = sortType.inputs.split(',');
    items.reverse();
    for (let i = 0; i < items.length; i += 1) {
      const matchedStreams = [];
      for (let j = 0; j < streams.length; j += 1) {
        if (String(sortType.getValue(streams[j])) === String(items[i])) {
          if (
            streams[j].codec_long_name
            && (
              streams[j].codec_long_name.includes('image')
              || streams[j].codec_name.includes('png')
            )
          ) {
            // do nothing, ffmpeg bug, doesn't move image streams
          } else {
            matchedStreams.push(streams[j]);
            streams.splice(j, 1);
            j -= 1;
          }
        }
      }
      streams = matchedStreams.concat(streams);
    }
  };

  let {
    processOrder,
  } = inputs;

  const {
    languages, codecs, channels, streamTypes,
  } = inputs;

  const sortTypes = {
    languages: {
      getValue: (stream) => {
        try {
          return stream.tags.language;
        } catch (err) {
          // err
        }
        return '';
      },
      inputs: languages,
    },
    codecs: {
      getValue: (stream) => {
        try {
          return stream.codec_name;
        } catch (err) {
          // err
        }
        return '';
      },
      inputs: codecs,
    },
    channels: {
      getValue: (stream) => {
        const chanMap = {
          8: '7.1',
          6: '5.1',
          2: '2',
          1: '1',
        };
        try {
          if (chanMap[stream.channels]) {
            return chanMap[stream.channels];
          }
        } catch (err) {
          // err
        }
        return '';
      },
      inputs: channels,
    },
    streamTypes: {
      getValue: (stream) => {
        try {
          return stream.codec_type;
        } catch (err) {
          // err
        }
        return '';
      },
      inputs: streamTypes,
    },
  };

  processOrder = processOrder.split(',');

  for (let k = 0; k < processOrder.length; k += 1) {
    if (sortTypes[processOrder[k]] && sortTypes[processOrder[k]].inputs) {
      sortStreams(sortTypes[processOrder[k]]);
    }
  }

  if (JSON.stringify(streams) !== originalStreams) {
    response.infoLog += 'Streams are not in the correct order!';
    response.processFile = true;
    let command = '<io> -c copy';

    for (let l = 0; l < streams.length; l += 1) {
      command += ` -map 0:${streams[l].typeIndex}`;
    }

    response.preset = command;
  } else {
    response.infoLog += 'Streams are in the correct order!';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
