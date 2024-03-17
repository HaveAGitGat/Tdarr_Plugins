import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Audio Codec',
  description: 'Check if a file has a specific audio codec',
  style: {
    borderColor: 'orange',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Codec',
      name: 'codec',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'dropdown',
        options: [
          'aac',
          'ac3',
          'eac3',
          'dca',
          'dts',
          'flac',
          'mp2',
          'mp3',
          'opus',
          'truehd',
          'vorbis',
          'wav',
          'wma',
        ],
      },
      tooltip: 'Specify the codec check for',
    },
    {
      label: 'Check Bitrate',
      name: 'checkBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to check the bitrate of the audio codec is within a range.',
    },

    {
      label: 'Greater Than',
      name: 'greaterThan',
      type: 'number',
      defaultValue: '50000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'checkBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify lower bound.',
    },
    {
      label: 'Less Than',
      name: 'lessThan',
      type: 'number',
      defaultValue: '1000000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'checkBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify upper bound.',
    },
    {
      label: 'Check Stream Position',
      name: 'checkStreamPosition',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to check the position of the audio codec.',
    },
    {
      label: 'Position',
      name: 'streamPosition',
      type: 'number',
      defaultValue: '1',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'checkStreamPosition',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify expected stream position.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has codec',
    },
    {
      number: 2,
      tooltip: 'File does not have codec',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const checkBitrate = Boolean(args.inputs.checkBitrate);
  const greaterThan = Number(args.inputs.greaterThan);
  const lessThan = Number(args.inputs.lessThan);
  let hasBitrate = false;

  const checkStreamPosition = Boolean(args.inputFileObj.checkStreamPosition);
  const streamPosition = Number(args.inputs.streamPosition);
  let hasStreamPosition = false;

  let hasCodec = false;

  if (args.inputFileObj.ffProbeData.streams) {
    args.inputFileObj.ffProbeData.streams.forEach((stream, index) => {
      // reset for each stream
      hasStreamPosition = false;
      hasBitrate = false;

      if (stream.codec_type === 'audio' && stream.codec_name === args.inputs.codec) {
        args.jobLog(`test ${index}`);
        if (checkStreamPosition) {
          hasStreamPosition = (index + 1) === streamPosition;
          if (hasStreamPosition) {
            args.jobLog(`File has codec at stream position: ${index}`);
          } else {
            args.jobLog(`File does not have codec at stream position: ${index}`);
          }
        }

        if (checkBitrate) {
          const ffprobeBitrate = Number(stream.bit_rate || 0);
          if (ffprobeBitrate > greaterThan && ffprobeBitrate < lessThan) {
            args.jobLog(`File has codec: ${args.inputs.codec} with bitrate`
            + ` ${ffprobeBitrate} between ${greaterThan} and ${lessThan}`);
            hasBitrate = true;
          }

          const mediaInfoBitrate = Number(args.inputFileObj.mediaInfo?.track?.[index + 1]?.BitRate || 0);

          if (mediaInfoBitrate > greaterThan && mediaInfoBitrate < lessThan) {
            args.jobLog(`File has codec: ${args.inputs.codec} with bitrate`
            + ` ${mediaInfoBitrate} between ${greaterThan} and ${lessThan}`);
            hasBitrate = true;
          }

          if (!hasBitrate) {
            args.jobLog(`File does not have codec: ${args.inputs.codec} ${checkBitrate ? 'with '
            + `bitrate between ${greaterThan} and ${lessThan}` : ''}`);
          }
        }

        if ((!checkStreamPosition || hasStreamPosition) && (!checkBitrate || hasBitrate)) {
          args.jobLog(`File has codec: ${args.inputs.codec}`);
          hasCodec = true;
        }
      }
    });
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: hasCodec ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
