import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Adjust Video Bitrate From h264 to h265',
  description: 'Adjust Video Bitrate when transcoding from x264 to x265, based on the logic that h265 can have a lower bitrate than h264 without losing quality.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Bitrate ratio (%)',
      name: 'bitrate_ratio',
      type: 'number',
      defaultValue: '50',
      inputUI: {
        type: 'slider',
        sliderOptions: {max: 90, min: 10 }
      },
      tooltip: `Specify the ratio used to adjust the bitrate.
                          \\nExample:\\n
                          50
      
                          \\nExample:\\n
                          60`,
    },
    {
      label: 'Bitrate cutoff (kbps)',
      name: 'bitrate_cutoff',
      type: 'number',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the cutoff value for the bitrate. If the calculated target bitrate is lower then the cutoff value will used as the target bitrate.
                          \\n Leave empty to disable.
                          \\nExample:\\n
                          2500
      
                          \\nExample:\\n
                          3500`,
    }],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const bitrate_cutoff = Number(args.inputs.bitrate_cutoff);
  const bitrate_ratio = Number(args.inputs.bitrate_ratio);

  // Duration can be found (or not) at multiple spots, trying to cover all of them here.
  const duration =
    Number(args.inputFileObj.ffProbeData?.format?.duration)
    || args.inputFileObj.meta?.Duration
    || args.inputFileObj.ffProbeData.streams?.find(stream => stream.codec_type === 'video')?.duration
    || -1;

  if (duration !== -1 && typeof args.inputFileObj.file_size) {
    const durationInMinutes = duration * 0.0166667;

    const currentBitrate = ~~(args.inputFileObj.file_size / (durationInMinutes * 0.0075));
    const calculatedAdjustedBitrate = ~~(currentBitrate * bitrate_ratio / 100);
    const targetBitrate = ~~(calculatedAdjustedBitrate > bitrate_cutoff ? calculatedAdjustedBitrate : bitrate_cutoff);
    const calculatedMinimumBitrate = ~~(targetBitrate * 0.7);
    const minimumBitrate = ~~(calculatedMinimumBitrate > bitrate_cutoff ? calculatedMinimumBitrate : bitrate_cutoff);
    const maximumBitrate = ~~(targetBitrate * 1.3);

    args.jobLog(`currentBitrate ${String(currentBitrate)}k; calculatedAdjustedBitrate ${String(calculatedAdjustedBitrate)}k; targetBitrate ${String(targetBitrate)}k; minimumBitrate ${String(minimumBitrate)}k; maximumBitrate ${String(maximumBitrate)}k`);
    args.variables.ffmpegCommand.streams.forEach((stream) => {
      if (stream.codec_type === 'video') {
        stream.outputArgs.push(`-b:${getFfType(stream.codec_type)}:{outputTypeIndex}`, `${String(targetBitrate)}k`);
        stream.outputArgs.push('-minrate', `${String(minimumBitrate)}k`);
        stream.outputArgs.push('-maxrate', `${String(maximumBitrate)}k`);
        stream.outputArgs.push('-bufsize', `${String(currentBitrate)}k`);
      }
    });
  } else
    args.jobLog('Some data is missing (duration or file_size). Could not calculate bitrate.');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};