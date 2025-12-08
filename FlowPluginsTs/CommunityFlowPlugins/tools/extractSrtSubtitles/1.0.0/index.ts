import { existsSync } from 'fs';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { iso6392BTo1, iso6392TTo1 } from './iso6392';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';

const details = (): IpluginDetails => ({
  name: 'Extract SRT Subtitles',
  description: 'Extract SRT subtitles from video',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faClosedCaptioning',
  inputs: [
    {
      label: 'Input Codec',
      name: 'inputCodec',
      type: 'string',
      defaultValue: 'subrip',
      inputUI: {
        type: 'text',
      },
      tooltip: `
        Comma separated list of input subtitle codecs to be processed.
        They should be text based format subtitle.
        Supported values are subrip, srt, ass, ssa.
          \\nExample:\\n
          subrip,srt
      `,
    },
    {
      label: 'Languages',
      name: 'languages',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `
        Comma separated language tag(s) to be kept.
        \\nMust follow ISO-639-2 3 letter format.
        https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.
          \\nExample:\\n
          eng,ind
      `,
    },
    {
      label: 'Overwrite Existing File',
      name: 'overwriteFile',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to overwrite existing subtitle file if found',
    },
    {
      label: 'Use ISO 639-1 Output Filename',
      name: 'useISO6391',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: `
        Toggle whether to use ISO 639-1 2 letter format for output file.
        \\nThis is so that it is compatible with Bazarr default format.
        \\nMeaning that with this turned on the output file will be
        '<name>.en.srt' instead of '<name>.eng.srt' for English subtitle.
      `,
    },
    {
      label: 'Enable Hearing Impaired Detection',
      name: 'enableHI',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: `
        Toggle whether to enable Hearing Impaired subtitle detection.
        \\nThe detection is done by checking if one of these conditions is true:
        \\n  - The title tag contains "HI" or "SDH"
        \\n  - The stream has "disposition.hearing_impaired: 1"
      `,
    },
    {
      label: 'Hearing Impaired Filename Flag',
      name: 'hiTag',
      type: 'string',
      defaultValue: 'hi',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableHI',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
        String to add to the filename if subtitle is detected as Hearing Impaired subtitle.
        \\nFor instance, the resulting filename will be "<name>.<lang>.hi.srt" if you set this
        to "hi" and the subtitle is detected as Hearing Impaired subtitle.
      `,
    },
    {
      label: 'Enable Forced Detection',
      name: 'enableForced',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: `
        Toggle whether to enable Forced subtitle detection.
        \\nThe detection is done by checking if one of these conditions is true:
        \\n  - The title tag contains case insensitive "forced"
        \\n  - The stream has "disposition.forced: 1"
      `,
    },
    {
      label: 'Forced Filename Flag',
      name: 'forcedTag',
      type: 'string',
      defaultValue: 'forced',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableForced',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
        String to add to the filename if subtitle is detected as Forced subtitle.
        \\nFor instance, the resulting filename will be "<name>.<lang>.forced.srt" if you set
        this to "forced" and the subtitle is detected as Forced subtitle.
      `,
    },
    {
      label: 'Enable Default Detection',
      name: 'enableDefault',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: `
        Toggle whether to enable Default subtitle detection.
        \\nThe detection is done by checking if this condition is true:
        \\n  - The stream has "disposition.default: 1"
      `,
    },
    {
      label: 'Default Filename Flag',
      name: 'defaultTag',
      type: 'string',
      defaultValue: 'default',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableDefault',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
        String to add to the filename if subtitle is detected as Default subtitle.
        \\nFor instance, the resulting filename will be "<name>.<lang>.default.srt" if you set
        this to "default" and the subtitle is detected as Default subtitle.
      `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Subtitle(s) extracted',
    },
    {
      number: 2,
      tooltip: 'No Subtitle extracted',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const inputCodec = String(args.inputs.inputCodec)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const languages = String(args.inputs.languages)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const overwriteFile = Boolean(args.inputs.overwriteFile);
  const useISO6391 = Boolean(args.inputs.useISO6391);

  const validCodecs = ['subrip', 'srt', 'ass', 'ssa'];
  const invalidCodecs = inputCodec.filter(
    (codec) => !validCodecs.includes(codec),
  );
  if (invalidCodecs.length > 0) {
    throw new Error(
      `Unsupported inputCodec: ${invalidCodecs.join(',')}`
      + '. Supported values are:'
      + ' "subrip", "srt", "ass", "ssa".',
    );
  }

  const inputFilename = args.inputFileObj._id;
  const subStreams = args.inputFileObj.ffProbeData.streams?.filter(
    (stream) => stream.codec_type.toLowerCase() === 'subtitle',
  );

  if (subStreams === undefined || subStreams.length === 0) {
    args.jobLog("No subtitle stream found, there's nothing to do");
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`Found ${subStreams.length} subtitle stream(s), processing...`);

  type ffmpegStreamArg = {
    mapArgs: string[],
    inputArgs: string[],
    outputFile: string,
  };

  const ffmpegCommand = {
    inputArgs: ['-y', '-i', `${inputFilename}`],
    streamArgs: [] as ffmpegStreamArg[],
  };

  subStreams.forEach((stream, index) => {
    const codecName = stream.codec_name.toLowerCase();
    let lang = stream.tags?.language || '';
    const title = stream.tags?.title || '';
    const isCommentary = stream.disposition?.comment === 1
      || title.toLowerCase().includes('commentary')
      || title.toLowerCase().includes('description');

    args.jobLog(
      `Subtitle stream[${index}] => {
      \n  codec: "${codecName}",
      \n  lang: "${lang}",
      \n  title: "${title}",
      \n  isCommentary: "${isCommentary}"
      }`,
    );

    if (
      !languages.includes(lang)
      || !inputCodec.includes(codecName)
      || isCommentary
    ) {
      args.jobLog(
        `Subtitle stream[${index}] doesn't match input "languages" `
        + 'or "input" or "is a commentary subtitle". Skipping...',
      );
      return;
    }
    args.jobLog(`Subtitle stream[${index}] will be processed...`);

    if (useISO6391) {
      // try to get the 639-1 language code, fallback to detected language
      lang = iso6392BTo1[lang] ?? iso6392TTo1[lang] ?? lang;
    }

    const isHI = stream.disposition?.hearing_impaired === 1
      || title.includes('HI')
      || title.includes('SDH');
    const isForced = stream.disposition?.forced === 1
      || title.toLowerCase().includes('forced');
    const isDefault = stream.disposition?.default === 1;

    // determine the output filename
    const out = inputFilename.split('.');
    out[out.length - 1] = 'srt';
    out[out.length - 2] += `.${lang}`;

    if (isHI && Boolean(args.inputs.enableHI)) {
      out[out.length - 2] += `.${String(args.inputs.hiTag).toLowerCase()}`;
    }

    if (isForced && Boolean(args.inputs.enableForced)) {
      out[out.length - 2] += `.${String(args.inputs.forcedTag).toLowerCase()}`;
    }

    if (isDefault && Boolean(args.inputs.enableDefault)) {
      out[out.length - 2] += `.${String(args.inputs.defaultTag).toLowerCase()}`;
    }

    const outputFile = out.join('.');

    args.jobLog(`Output filename for subtitle stream[${index}]: "${outputFile}"`);

    if (existsSync(outputFile) && !overwriteFile) {
      args.jobLog(
        `"${outputFile}" already exists`
        + '. Skipping because "overwriteFile" is set to "false"...',
      );
      return;
    }

    const streamArg: ffmpegStreamArg = {
      mapArgs: ['-map', `0:s:${index}`],
      inputArgs: ['-c:s', 'srt'],
      outputFile,
    };

    args.jobLog(
      `Generated FFmpeg args for subtitle stream[${index}]:`
      + `\n${JSON.stringify({ streamArg })}`,
    );

    ffmpegCommand.streamArgs.push(streamArg);
  });

  if (ffmpegCommand.streamArgs.length === 0) {
    args.jobLog('No stream needed to be processed. Exiting...');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const spawnArgs = ffmpegCommand.inputArgs;

  ffmpegCommand.streamArgs.forEach((arg) => {
    spawnArgs.push(...arg.mapArgs, ...arg.inputArgs, arg.outputFile);
  });

  args.jobLog('Sending job to worker node...');
  args.jobLog(JSON.stringify({ spawnArgs }));

  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: spawnArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '',
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const result = await cli.runCli();

  if (result.cliExitCode !== 0) {
    args.jobLog('FFmpeg command failed');
    throw new Error('FFmpeg failed');
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export { details, plugin };
