import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Basic Video or Audio Settings',
  description: `Basic Video or Audio settings designed to replicate
   the Basic Video or Basic Audio  settings in the library settings.
   `,
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Basic Settings Type',
      name: 'basicSettingsType',
      type: 'string',
      defaultValue: 'video',
      inputUI: {
        type: 'dropdown',
        options: [
          'video',
          'audio',
        ],
      },
      tooltip: 'Specify the basic settings type for the type of files being processed',
    },
    {
      label: 'Output File Container',
      name: 'outputFileContainer',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the output file container',
    },
    {
      label: 'CLI Tool',
      name: 'cliTool',
      type: 'string',
      defaultValue: 'handbrake',
      inputUI: {
        type: 'dropdown',
        options: [
          'handbrake',
          'ffmpeg',
        ],
      },
      tooltip: 'Specify the CLI tool to use',
    },
    {
      label: 'CLI Arguments',
      name: 'cliArguments',
      type: 'string',
      defaultValue: '-Z "Very Fast 1080p30"',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify HandBrake or FFmpeg arguments',
    },
    {
      label: 'Codec Filter',
      name: 'codecFilter',
      type: 'string',
      defaultValue: 'ignore',
      inputUI: {
        type: 'dropdown',
        options: [
          'ignore',
          'allow',
        ],
      },
      tooltip: 'Specify whether to ignore or allow the following codecs',
    },
    {
      label: 'Codecs',
      name: 'codecs',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify comma separated list of codecs to ignore or allow',
    },
    {
      label: 'File Size Range Min MB',
      name: 'fileSizeRangeMinMB',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify minimum file size in MB of files to process',
    },
    {
      label: 'File Size Range Max MB',
      name: 'fileSizeRangeMaxMB',
      type: 'number',
      defaultValue: '200000',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify maximum file size in MB of files to process',
    },

    {
      label: 'Video Height Range Min',
      name: 'videoHeightRangeMin',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'basicSettingsType',
                  value: 'video',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify minimum video height in pixels of files to process',
    },
    {
      label: 'Video Height Range Max',
      name: 'videoHeightRangeMax',
      type: 'number',
      defaultValue: '5000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'basicSettingsType',
                  value: 'video',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify maximum video height in pixels of files to process',
    },
    {
      label: 'Video Width Range Min',
      name: 'videoWidthRangeMin',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'basicSettingsType',
                  value: 'video',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify minimum video width in pixels of files to process',
    },
    {
      label: 'Video Width Range Max',
      name: 'videoWidthRangeMax',
      type: 'number',
      defaultValue: '8000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'basicSettingsType',
                  value: 'video',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify maximum video width in pixels of files to process',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const basicSettingsType = String(args.inputs.basicSettingsType);
  let container = String(args.inputs.outputFileContainer).split('.').join('');
  const cliTool = String(args.inputs.cliTool);
  const cliArguments = String(args.inputs.cliArguments);
  const codecFilter = String(args.inputs.codecFilter);
  const codecs = String(args.inputs.codecs).split(',').map((codec) => codec.trim());
  const fileSizeRangeMinMB = Number(args.inputs.fileSizeRangeMinMB);
  const fileSizeRangeMaxMB = Number(args.inputs.fileSizeRangeMaxMB);
  const videoHeightRangeMin = Number(args.inputs.videoHeightRangeMin);
  const videoHeightRangeMax = Number(args.inputs.videoHeightRangeMax);
  const videoWidthRangeMin = Number(args.inputs.videoWidthRangeMin);
  const videoWidthRangeMax = Number(args.inputs.videoWidthRangeMax);

  const noTranscodeResponse = {
    outputFileObj: {
      _id: args.inputFileObj._id,
    },
    outputNumber: 1,
    variables: args.variables,
  };

  const size = args.inputFileObj.file_size;

  if (size < fileSizeRangeMinMB || size > fileSizeRangeMaxMB) {
    args.jobLog(`Skipping ${args.inputFileObj._id} due to size ${size}MB not in `
    + `range ${fileSizeRangeMinMB}MB to ${fileSizeRangeMaxMB}MB`);
    return noTranscodeResponse;
  }
  args.jobLog(`Processing ${args.inputFileObj._id} due to size ${size}MB in `
  + `range ${fileSizeRangeMinMB}MB to ${fileSizeRangeMaxMB}MB`);

  if (!args.inputFileObj.ffProbeData.streams) {
    throw new Error('No streams found in file FFprobe data');
  }

  const mainStream = args.inputFileObj.ffProbeData.streams.find((stream) => stream.codec_type === basicSettingsType);

  if (!mainStream) {
    throw new Error(`No ${basicSettingsType} stream found in file FFprobe data`);
  }

  if (basicSettingsType === 'video') {
    const height = mainStream.height || 0;
    const width = mainStream.width || 0;
    if (height < videoHeightRangeMin || height > videoHeightRangeMax) {
      args.jobLog(`Skipping ${args.inputFileObj._id} due to height ${height} not in `
      + `range ${videoHeightRangeMin} to ${videoHeightRangeMax}`);
      return noTranscodeResponse;
    }
    args.jobLog(`Processing ${args.inputFileObj._id} due to height ${height} in `
    + `range ${videoHeightRangeMin} to ${videoHeightRangeMax}`);

    if (width < videoWidthRangeMin || width > videoWidthRangeMax) {
      args.jobLog(`Skipping ${args.inputFileObj._id} due to width ${width} not in `
      + `range ${videoWidthRangeMin} to ${videoWidthRangeMax}`);
      return noTranscodeResponse;
    }
    args.jobLog(`Processing ${args.inputFileObj._id} due to width ${width} in `
    + `range ${videoWidthRangeMin} to ${videoWidthRangeMax}`);
  }

  const codec = mainStream.codec_name;
  if (codecFilter === 'allow') {
    if (!codecs.includes(codec)) {
      args.jobLog(`Skipping ${args.inputFileObj._id} due to codec ${codec} not in list ${codecs}`);
      return noTranscodeResponse;
    }
    args.jobLog(`Processing ${args.inputFileObj._id} due to codec ${codec} in list ${codecs}`);
  } else {
    if (codecs.includes(codec)) {
      args.jobLog(`Skipping ${args.inputFileObj._id} due to codec ${codec} in list ${codecs}`);
      return noTranscodeResponse;
    }
    args.jobLog(`Processing ${args.inputFileObj._id} due to codec ${codec} not in list ${codecs}`);
  }

  if (container === 'original') {
    container = getContainer(args.inputFileObj._id);
  }

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

  let cliArgs:string[] = [];
  let cliPath = '';

  if (cliTool === 'handbrake') {
    cliPath = args.handbrakePath;
    cliArgs = [
      '-i',
      `${args.inputFileObj._id}`,
      '-o',
      `${outputFilePath}`,
      ...args.deps.parseArgsStringToArgv(cliArguments, '', ''),
    ];
  } else {
    cliPath = args.ffmpegPath;
    let argsSplit;
    if (cliArguments.includes('<io>')) {
      argsSplit = cliArguments.split('<io>');
    } else {
      argsSplit = cliArguments.split(',');
    }

    cliArgs = [
      ...args.deps.parseArgsStringToArgv(argsSplit[0], '', ''),
      '-i',
      `${args.inputFileObj._id}`,
      ...args.deps.parseArgsStringToArgv(argsSplit[1], '', ''),
      `${outputFilePath}`,
    ];
  }

  args.updateWorker({
    CLIType: cliPath,
    preset: cliArgs.join(' '),
  });

  const cli = new CLI({
    cli: cliPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog(`Running ${cliTool} failed`);
    throw new Error(`Running ${cliTool} failed`);
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
export {
  details,
  plugin,
};
