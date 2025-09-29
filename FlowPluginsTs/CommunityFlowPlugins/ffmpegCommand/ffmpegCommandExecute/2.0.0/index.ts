import os from 'os';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getFileName, getPluginWorkDir, getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { checkFfmpegCommandV2Init } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import { getEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Execute',
  description: 'Execute the FFmpeg command using all gathered plugin inputs',
  style: {
    borderColor: 'green',
  },
  tags: 'video',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: 2,
  icon: 'faPlay',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getOuputStreamIndex = (streams: IffmpegCommandStream[], stream: IffmpegCommandStream): number => {
  let index = 0;

  for (let idx = 0; idx < streams.length; idx += 1) {
    if (streams[idx] === stream) {
      break;
    }
    index += 1;
  }

  return index;
};

const getOuputStreamTypeIndex = (streams: IffmpegCommandStream[], stream: IffmpegCommandStream): number => {
  let index = 0;

  for (let idx = 0; idx < streams.length; idx += 1) {
    if (streams[idx] === stream) {
      break;
    }
    if (streams[idx].codec_type === stream.codec_type) {
      index += 1;
    }
  }

  return index;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandV2Init(args);

  const cliArgs: string[] = [];
  const { pluginInputs } = args.variables.ffmpegCommand;

  // Ensure pluginInputs is defined
  if (!pluginInputs) {
    throw new Error('Plugin inputs not initialized. Make sure to use Begin Command first.');
  }

  cliArgs.push('-y');
  cliArgs.push('-i');
  cliArgs.push(args.inputFileObj._id);

  // Use the streams from the initialized ffmpegCommand structure
  let { shouldProcess, streams } = args.variables.ffmpegCommand;
  const ffmpegStreams: IffmpegCommandStream[] = [...streams];

  let hardwareDecoding = false;
  const overallInputArguments: string[] = [];
  const overallOutputArguments: string[] = [];

  // Process custom arguments first
  if (pluginInputs.ffmpegCommandCustomArguments) {
    const { inputArguments, outputArguments } = pluginInputs.ffmpegCommandCustomArguments;
    if (inputArguments) {
      overallInputArguments.push(...inputArguments.split(' '));
      shouldProcess = true;
    }
    if (outputArguments) {
      overallOutputArguments.push(...outputArguments.split(' '));
      shouldProcess = true;
    }
  }

  // Process video encoder settings
  if (pluginInputs.ffmpegCommandSetVideoEncoder) {
    const encoderSettings = pluginInputs.ffmpegCommandSetVideoEncoder;
    hardwareDecoding = encoderSettings.hardwareDecoding;

    for (let i = 0; i < ffmpegStreams.length; i += 1) {
      const stream = ffmpegStreams[i];

      if (stream.codec_type === 'video' && stream.codec_name !== 'mjpeg') {
        const targetCodec = encoderSettings.outputCodec;

        if (
          encoderSettings.forceEncoding
          || stream.codec_name !== targetCodec
        ) {
          shouldProcess = true;

          // eslint-disable-next-line no-await-in-loop
          const encoderProperties = await getEncoder({
            targetCodec,
            hardwareEncoding: encoderSettings.hardwareEncoding,
            hardwareType: encoderSettings.hardwareType,
            args,
          });

          stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);

          if (encoderSettings.ffmpegQualityEnabled) {
            if (encoderProperties.isGpu) {
              if (encoderProperties.encoder === 'hevc_qsv') {
                stream.outputArgs.push('-global_quality', encoderSettings.ffmpegQuality);
              } else {
                stream.outputArgs.push('-qp', encoderSettings.ffmpegQuality);
              }
            } else {
              stream.outputArgs.push('-crf', encoderSettings.ffmpegQuality);
            }
          }

          if (encoderSettings.ffmpegPresetEnabled) {
            if (targetCodec !== 'av1' && encoderSettings.ffmpegPreset) {
              stream.outputArgs.push('-preset', encoderSettings.ffmpegPreset);
            }
          }

          if (hardwareDecoding) {
            stream.inputArgs.push(...encoderProperties.inputArgs);
          }

          if (encoderProperties.outputArgs) {
            stream.outputArgs.push(...encoderProperties.outputArgs);
          }
        }
      }
    }
  }

  // Process 10-bit video settings
  if (pluginInputs.ffmpegCommand10BitVideo?.enabled) {
    for (let i = 0; i < ffmpegStreams.length; i += 1) {
      const stream = ffmpegStreams[i];
      if (stream.codec_type === 'video') {
        stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');

        if (stream.outputArgs.some((row) => row.includes('qsv')) && os.platform() !== 'win32') {
          stream.outputArgs.push('-vf', 'scale_qsv=format=p010le');
        } else {
          stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
        }
        shouldProcess = true;
      }
    }
  }

  // Process video bitrate settings
  if (pluginInputs.ffmpegCommandSetVideoBitrate) {
    const bitrateSettings = pluginInputs.ffmpegCommandSetVideoBitrate;

    ffmpegStreams.forEach((stream) => {
      if (stream.codec_type === 'video') {
        const ffType = getFfType(stream.codec_type);
        if (bitrateSettings.useInputBitrate) {
          args.jobLog('Attempting to use % of input bitrate as output bitrate');
          // check if input bitrate is available
          const tracks = args?.inputFileObj?.mediaInfo?.track;
          let inputBitrate = tracks?.find((x) => x.StreamOrder === stream.index.toString())?.BitRate;

          if (inputBitrate) {
            args.jobLog(`Found input bitrate: ${inputBitrate}`);
            // @ts-expect-error type
            inputBitrate = parseInt(inputBitrate, 10) / 1000;
            const targetBitrate = (inputBitrate * (parseInt(bitrateSettings.targetBitratePercent, 10) / 100));
            args.jobLog(`Setting video bitrate as ${targetBitrate}k`);
            stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${targetBitrate}k`);
          } else {
            args.jobLog(`Unable to find input bitrate, setting fallback bitrate as ${bitrateSettings.fallbackBitrate}k`);
            stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrateSettings.fallbackBitrate}k`);
          }
        } else {
          args.jobLog(`Using fixed bitrate. Setting video bitrate as ${bitrateSettings.bitrate}k`);
          stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrateSettings.bitrate}k`);
        }
        shouldProcess = true;
      }
    });
  }

  // Process container settings
  if (pluginInputs.ffmpegCommandSetContainer) {
    const containerSettings = pluginInputs.ffmpegCommandSetContainer;
    const currentContainer = args.inputFileObj.container.toLowerCase();

    if (currentContainer !== containerSettings.container) {
      shouldProcess = true;

      if (containerSettings.forceConform) {
        for (let i = 0; i < ffmpegStreams.length; i += 1) {
          const stream = ffmpegStreams[i];

          try {
            const codecType = stream.codec_type.toLowerCase();
            const codecName = stream.codec_name.toLowerCase();
            if (containerSettings.container === 'mkv') {
              if (
                codecType === 'data'
                || [
                  'mov_text',
                  'eia_608',
                  'timed_id3',
                ].includes(codecName)
              ) {
                stream.removed = true;
              }
            }

            if (containerSettings.container === 'mp4') {
              if (
                codecType === 'attachment'
                || [
                  'hdmv_pgs_subtitle',
                  'eia_608',
                  'timed_id3',
                  'subrip',
                  'ass',
                  'ssa',
                ].includes(codecName)
              ) {
                stream.removed = true;
              }
            }
          } catch (err) {
            // Error
          }
        }
      }

      // handle genpts if coming from odd container
      if (
        [
          'ts',
          'avi',
          'mpg',
          'mpeg',
        ].includes(currentContainer)
      ) {
        overallInputArguments.push('-fflags', '+genpts');
      }
    }
  }

  // Process video resolution settings
  if (pluginInputs.ffmpegCommandSetVdeoResolution) {
    const { targetResolution } = pluginInputs.ffmpegCommandSetVdeoResolution;

    const getVfScale = (resolution: string): string[] => {
      switch (resolution) {
        case '480p':
          return ['-vf', 'scale=720:-2'];
        case '576p':
          return ['-vf', 'scale=720:-2'];
        case '720p':
          return ['-vf', 'scale=1280:-2'];
        case '1080p':
          return ['-vf', 'scale=1920:-2'];
        case '1440p':
          return ['-vf', 'scale=2560:-2'];
        case '4KUHD':
          return ['-vf', 'scale=3840:-2'];
        default:
          return ['-vf', 'scale=1920:-2'];
      }
    };

    for (let i = 0; i < ffmpegStreams.length; i += 1) {
      const stream = ffmpegStreams[i];
      if (stream.codec_type === 'video') {
        if (targetResolution !== args.inputFileObj.video_resolution) {
          shouldProcess = true;
          const scaleArgs = getVfScale(targetResolution);
          stream.outputArgs.push(...scaleArgs);
        }
      }
    }
  }

  // Process video framerate settings
  if (pluginInputs.ffmpegCommandSetVdeoFramerate) {
    const { framerate } = pluginInputs.ffmpegCommandSetVdeoFramerate;
    const desiredFrameRate = framerate;

    args.jobLog(`Desired framerate: ${desiredFrameRate}`);

    ffmpegStreams.forEach((stream) => {
      if (stream.codec_type === 'video') {
        let fileFramerateUsed = false;

        if (stream.avg_frame_rate) {
          const parts = stream.avg_frame_rate.split('/');

          if (parts.length === 2) {
            const numerator = parseInt(parts[0], 10);
            const denominator = parseInt(parts[1], 10);

            if (numerator > 0 && denominator > 0) {
              const fileFramerate = numerator / denominator;

              args.jobLog(`File framerate: ${fileFramerate}`);

              if (fileFramerate < desiredFrameRate) {
                args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
                stream.outputArgs.push('-r', `${String(fileFramerate)}`);
                fileFramerateUsed = true;
              } else {
                args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
              }
            }
          }
        }

        if (!fileFramerateUsed) {
          args.jobLog('Using desired framerate.');
          stream.outputArgs.push('-r', `${String(desiredFrameRate)}`);
        }
        shouldProcess = true;
      }
    });
  }

  // Process HDR to SDR conversion
  if (pluginInputs.ffmpegCommandHdrToSdr?.enabled) {
    ffmpegStreams.forEach((stream) => {
      if (stream.codec_type === 'video') {
        stream.outputArgs.push('-vf', 'zscale=t=linear:npl=100,format=yuv420p');
        shouldProcess = true;
      }
    });
  }

  // Process remove subtitles
  if (pluginInputs.ffmpegCommandRemoveSubtitles?.enabled) {
    ffmpegStreams.forEach((stream) => {
      if (stream.codec_type === 'subtitle') {
        stream.removed = true;
        shouldProcess = true;
      }
    });
  }

  // Process remove stream by property
  if (pluginInputs.ffmpegCommandRemoveStreamByProperty) {
    const { propertyToCheck, valuesToRemove, condition } = pluginInputs.ffmpegCommandRemoveStreamByProperty;

    ffmpegStreams.forEach((stream) => {
      let target = '';
      if (propertyToCheck.includes('.')) {
        const parts = propertyToCheck.split('.');
        target = stream[parts[0]]?.[parts[1]];
      } else {
        target = stream[propertyToCheck];
      }

      if (target) {
        const prop = String(target).toLowerCase();
        for (let i = 0; i < valuesToRemove.length; i += 1) {
          const val = valuesToRemove[i].toLowerCase();
          const prefix = `Removing stream index ${stream.index} because ${propertyToCheck} of ${prop}`;
          if (condition === 'includes' && prop.includes(val)) {
            args.jobLog(`${prefix} includes ${val}\n`);
            stream.removed = true;
            shouldProcess = true;
          } else if (condition === 'not_includes' && !prop.includes(val)) {
            args.jobLog(`${prefix} not_includes ${val}\n`);
            stream.removed = true;
            shouldProcess = true;
          }
        }
      }
    });
  }

  // Process ensure audio stream
  if (pluginInputs.ffmpegCommandEnsureAudioStream) {
    const ensureSettings = pluginInputs.ffmpegCommandEnsureAudioStream;
    const { audioEncoder, language: langTag, channels: wantedChannelCount } = ensureSettings;
    const {
      enableBitrate, bitrate, enableSamplerate, samplerate,
    } = ensureSettings;

    let audioCodec = audioEncoder;
    if (audioEncoder === 'dca') {
      audioCodec = 'dts';
    }
    if (audioEncoder === 'libmp3lame') {
      audioCodec = 'mp3';
    }
    if (audioEncoder === 'libopus') {
      audioCodec = 'opus';
    }

    const getHighest = (first: any, second: any) => {
      if (first?.channels > second?.channels) {
        return first;
      }
      return second;
    };

    const langMatch = (stream: any) => (
      (langTag === 'und'
        && (stream.tags === undefined || stream.tags.language === undefined))
        || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(langTag)
        )
    );

    const attemptMakeStream = (targetLangTag: string): boolean => {
      const streamsWithLangTag = ffmpegStreams.filter((stream) => {
        if (stream.codec_type === 'audio' && langMatch(stream)) {
          return true;
        }
        return false;
      });

      if (streamsWithLangTag.length === 0) {
        args.jobLog(`No streams with language tag ${targetLangTag} found. Skipping \n`);
        return false;
      }

      const streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
      const highestChannelCount = Number(streamWithHighestChannel.channels);

      let targetChannels = 0;
      if (wantedChannelCount <= highestChannelCount) {
        targetChannels = wantedChannelCount;
        args.jobLog(`The wanted channel count ${wantedChannelCount} is <= than the highest available channel count (${streamWithHighestChannel.channels}). \n`);
      } else {
        targetChannels = highestChannelCount;
        args.jobLog(`The wanted channel count ${wantedChannelCount} is higher than the highest available channel count (${streamWithHighestChannel.channels}). \n`);
      }

      const hasStreamAlready = ffmpegStreams.filter((stream) => {
        if (
          stream.codec_type === 'audio'
          && langMatch(stream)
          && stream.codec_name === audioCodec
          && stream.channels === targetChannels
        ) {
          return true;
        }
        return false;
      });

      if (hasStreamAlready.length > 0) {
        args.jobLog(`File already has ${targetLangTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);
        return true;
      }

      args.jobLog(`Adding ${targetLangTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);

      const streamCopy = JSON.parse(JSON.stringify(streamWithHighestChannel));
      streamCopy.removed = false;
      streamCopy.index = ffmpegStreams.length;
      streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder);
      streamCopy.outputArgs.push('-ac', `${targetChannels}`);

      if (enableBitrate) {
        const ffType = getFfType(streamCopy.codec_type);
        streamCopy.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}`);
      }

      if (enableSamplerate) {
        streamCopy.outputArgs.push('-ar', `${samplerate}`);
      }

      shouldProcess = true;
      ffmpegStreams.push(streamCopy);
      return true;
    };

    const addedOrExists = attemptMakeStream(langTag);
    if (!addedOrExists) {
      attemptMakeStream('und');
    }
  }

  // Process stream reordering
  if (pluginInputs.ffmpegCommandRorderStreams) {
    const reorderSettings = pluginInputs.ffmpegCommandRorderStreams;
    let streams = JSON.parse(JSON.stringify(ffmpegStreams));

    streams.forEach((stream: any, index: number) => {
      stream.typeIndex = index;
    });

    const originalStreams = JSON.stringify(streams);

    const sortStreams = (sortType: {
      inputs: string,
      getValue: (stream: any) => string,
    }) => {
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

    const sortTypes: {
      [key: string]: any,
    } = {
      languages: {
        getValue: (stream: any) => {
          if (stream?.tags?.language) {
            return stream.tags.language;
          }
          return '';
        },
        inputs: reorderSettings.languages,
      },
      codecs: {
        getValue: (stream: any) => {
          try {
            return stream.codec_name;
          } catch (err) {
            // err
          }
          return '';
        },
        inputs: reorderSettings.codecs,
      },
      channels: {
        getValue: (stream: any) => {
          const chanMap: {
            [key: number]: string
          } = {
            8: '7.1',
            6: '5.1',
            2: '2',
            1: '1',
          };

          if (stream?.channels && chanMap[stream.channels]) {
            return chanMap[stream.channels];
          }
          return '';
        },
        inputs: reorderSettings.channels,
      },
      streamTypes: {
        getValue: (stream: any) => {
          if (stream.codec_type) {
            return stream.codec_type;
          }
          return '';
        },
        inputs: reorderSettings.streamTypes,
      },
    };

    const processOrderArr = reorderSettings.processOrder.split(',');

    for (let k = 0; k < processOrderArr.length; k += 1) {
      if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
        sortStreams(sortTypes[processOrderArr[k]]);
      }
    }

    if (JSON.stringify(streams) !== originalStreams) {
      shouldProcess = true;
      // Replace the ffmpegStreams with reordered streams
      ffmpegStreams.length = 0;
      ffmpegStreams.push(...streams);
    }
  }

  // Process remove data streams
  if (pluginInputs.ffmpegCommandRemoveDataStreams?.enabled) {
    ffmpegStreams.forEach((stream) => {
      if (stream.codec_type === 'data') {
        stream.removed = true;
        shouldProcess = true;
      }
    });
  }

  // Filter out removed streams
  const filteredStreams = ffmpegStreams.filter((stream) => !stream.removed);

  if (filteredStreams.length === 0) {
    args.jobLog('No streams mapped for new file');
    throw new Error('No streams mapped for new file');
  }

  // Build the final command
  for (let i = 0; i < filteredStreams.length; i += 1) {
    const stream = filteredStreams[i];

    // Replace placeholders in output args
    stream.outputArgs = stream.outputArgs.map((arg) => {
      if (arg.includes('{outputIndex}')) {
        // eslint-disable-next-line no-param-reassign
        arg = arg.replace('{outputIndex}', String(getOuputStreamIndex(filteredStreams, stream)));
      }

      if (arg.includes('{outputTypeIndex}')) {
        // eslint-disable-next-line no-param-reassign
        arg = arg.replace('{outputTypeIndex}', String(getOuputStreamTypeIndex(filteredStreams, stream)));
      }

      return arg;
    });

    cliArgs.push(...stream.mapArgs);

    if (stream.outputArgs.length === 0) {
      cliArgs.push(`-c:${getOuputStreamIndex(filteredStreams, stream)}`, 'copy');
    } else {
      cliArgs.push(...stream.outputArgs);
    }

    overallInputArguments.push(...stream.inputArgs);
  }

  // Add input arguments
  const idx = cliArgs.indexOf('-i');
  cliArgs.splice(idx, 0, ...overallInputArguments);

  // Add output arguments
  if (overallOutputArguments.length > 0) {
    cliArgs.push(...overallOutputArguments);
    shouldProcess = true;
  }

  if (!shouldProcess) {
    args.jobLog('No need to process file, already as required');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}`
  + `.${args.variables.ffmpegCommand.container}`;

  cliArgs.push(outputFilePath);

  const spawnArgs = cliArgs.map((row) => row.trim()).filter((row) => row !== '');

  args.jobLog('Processing file');
  args.jobLog(JSON.stringify({
    spawnArgs,
    outputFilePath,
  }));

  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: spawnArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs,
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
    args.jobLog('Running FFmpeg failed');
    throw new Error('FFmpeg failed');
  }

  args.logOutcome('tSuc');

  // Reset the v2.0.0 ffmpegCommand structure
  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.init = false;

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
