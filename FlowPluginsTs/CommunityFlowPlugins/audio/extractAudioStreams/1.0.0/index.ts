/* eslint-disable linebreak-style */
/* eslint-disable indent */
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir, getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const mapVideoContainerToAudio = (container: string): string => {
  switch (container) {
    case 'mkv':
      return 'mka';
    case 'mp4':
      return 'm4a';
    case 'avi':
      return 'wav';
    case 'mov':
      return 'm4a';
    case 'mpeg':
    case 'mpg':
      return 'mp3';
    default:
      return 'mka';
  }
};

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Extract audio stream',
  description: 'This plugin extracts an audio track from a given file.',
  style: {
    borderColor: 'green',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      name: 'preferredMainCodec',
      type: 'string',
      defaultValue: 'dts',
      inputUI: {
        type: 'dropdown',
        options: [
          'dts',
          'ac3',
          'eac3',
          'aac',
        ],
      },
      tooltip: 'Specify preferred main codec',
    },
    {
      name: 'preferredFallbackCodec',
      type: 'string',
      defaultValue: 'eac3',
      inputUI: {
        type: 'dropdown',
        options: [
          'dts',
          'ac3',
          'eac3',
          'aac',
        ],
      },
      tooltip: 'Specify preferred fallback codec',
    },
    {
      name: 'preferredResultCodec',
      type: 'string',
      defaultValue: 'eac3',
      inputUI: {
        type: 'dropdown',
        options: [
          'dts',
          'ac3',
          'eac3',
          'aac',
        ],
      },
      tooltip: 'Specify preferred result codec',
    },
    {
      name: 'maxChannels',
      type: 'number',
      defaultValue: '6',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the maximum amount of channels.',
    },
    {
      name: 'skipFileIfCodecExists',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'dropdown',
        options: [
          '',
          'dts',
          'ac3',
          'eac3',
          'aac',
        ],
      },
      tooltip: 'Do not process the file if this codec is present.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Audio stream extracted.',
    },
    {
      number: 2,
      tooltip: 'No audio stream extraction needed (Skipped).',
    },
    {
      number: 3,
      tooltip: 'No audio stream extracted (Could not find preferred or fallback codec).',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const preferredMainCodec = String(args.inputs.preferredMainCodec);
  const preferredFallbackCodec = String(args.inputs.preferredFallbackCodec);
  const preferredResultCodec = String(args.inputs.preferredResultCodec);
  const maxChannels = Number(args.inputs.maxChannels);
  const skipFileIfCodecExists = String(args.inputs.skipFileIfCodecExists);

  const cliArgs: string[] = [];

  const { ffProbeData } = args.inputFileObj;

  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }

  // Determine appropriate audio container
  const videoContainer = getContainer(args.inputFileObj._id);
  const audioContainer = mapVideoContainerToAudio(videoContainer);

  // Use the audio container in the output file name
  const outputFileName = `${getFileName(args.inputFileObj._id)}.${audioContainer}`;
  const outputFilePath = `${getPluginWorkDir(args)}/${outputFileName}`;

  // Filter out obsolete streams
  const audioStreams = ffProbeData.streams.filter(
    (stream: Istreams) => stream.codec_type === 'audio'
    && !/commentary/i.test(stream.tags?.title || ''),
  );

  // Check if we should skip the file
  if (skipFileIfCodecExists !== '') {
    const skipStreams = audioStreams.filter(
      (stream: Istreams) => stream.codec_name === skipFileIfCodecExists,
    );
    if (skipStreams.length > 0) {
      // Exit here since we want to skip processing
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 2,
        variables: args.variables,
      };
    }
  }

  // Try to get the preferred stream first.
  const preferredStreams = audioStreams.filter(
    (stream: Istreams) => stream.codec_name === preferredMainCodec,
  );

  let audioStream;

  if (preferredStreams.length > 0) {
    const preferredStream = preferredStreams[0];
    audioStream = preferredStream;
  } else {
    // Getting the preferred stream failed, let's check for an alternative.
    const fallbackStreams = audioStreams.filter(
      (stream: Istreams) => (stream.codec_name === preferredFallbackCodec),
    );
    if (fallbackStreams.length > 0) {
        const fallbackStream = fallbackStreams[0];
        audioStream = fallbackStream;
    } else {
      // Exit here if nothing was found
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 3,
        variables: args.variables,
      };
    }
  }

  cliArgs.push(
    '-y',
    '-i',
    `${args.inputFileObj._id}`,
    '-map', `0:a:${audioStream.index - 1}`,
    '-c:a',
    preferredResultCodec,
    '-ac',
    `${Math.min(maxChannels, Number(audioStream.channels))}`,
    `${outputFilePath}`,
  );

  const spawnArgs = cliArgs.map((row) => row.trim()).filter((row) => row !== '');

  args.jobLog('Processing file');
  args.jobLog(JSON.stringify({
    spawnArgs,
    outputFilePath,
  }));

  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: cliArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog('Running FFmpeg failed');
    throw new Error('Running FFmpeg failed');
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export { details, plugin };
