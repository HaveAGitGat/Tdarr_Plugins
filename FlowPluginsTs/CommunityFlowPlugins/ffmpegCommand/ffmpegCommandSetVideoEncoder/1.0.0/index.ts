/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = (): IpluginDetails => ({
  name: 'Set Video Encoder',
  description: 'Set the video encoder for all streams',
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
      label: 'Output Codec',
      name: 'outputCodec',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc',
          // 'vp9',
          'h264',
          // 'vp8',
          'av1',
        ],
      },
      tooltip: 'Specify codec of the output file',
    },
    {
      label: 'Enable FFmpeg Preset',
      name: 'ffmpegPresetEnabled',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to use an FFmpeg preset',
    },
    {
      label: 'FFmpeg Preset',
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'fast',
      inputUI: {
        type: 'dropdown',
        options: [
          'veryslow',
          'slower',
          'slow',
          'medium',
          'fast',
          'faster',
          'veryfast',
          'superfast',
          'ultrafast',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'ffmpegPresetEnabled',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'FFmpeg preset. Auto-converts for GPU encoders: NVENC uses p1-p7,'
        + ' AMF uses quality/balanced/speed, QSV uses CPU names directly.'
        + ' Ignored for VAAPI/rkmpp/videotoolbox.',
    },
    {
      label: 'Enable FFmpeg Quality',
      name: 'ffmpegQualityEnabled',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to set crf (or qp for GPU encoding)',
    },
    {
      label: 'FFmpeg Quality',
      name: 'ffmpegQuality',
      type: 'number',
      defaultValue: '25',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'ffmpegQualityEnabled',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify ffmpeg quality crf (or qp for GPU encoding)',
    },
    {
      label: 'Hardware Encoding',
      name: 'hardwareEncoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to use hardware encoding if available',
    },
    {
      label: 'Hardware Type',
      name: 'hardwareType',
      type: 'string',
      defaultValue: 'auto',
      inputUI: {
        type: 'dropdown',
        options: [
          'auto',
          'nvenc',
          'rkmpp',
          'qsv',
          'vaapi',
          'videotoolbox',
        ],
      },
      tooltip: 'Specify codec of the output file',
    },
    {
      label: 'Hardware Decoding',
      name: 'hardwareDecoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to use hardware decoding if available',
    },
    {
      label: 'Force Encoding',
      name: 'forceEncoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to force encoding if stream already has the target codec',
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

  checkFfmpegCommandInit(args);

  const hardwareDecoding = args.inputs.hardwareDecoding === true;
  const hardwareType = String(args.inputs.hardwareType);
  args.variables.ffmpegCommand.hardwareDecoding = hardwareDecoding;

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];

    if (stream.codec_type === 'video' && stream.codec_name !== 'mjpeg') {
      const targetCodec = String(args.inputs.outputCodec);
      const { ffmpegPresetEnabled, ffmpegQualityEnabled } = args.inputs;
      const ffmpegPreset = String(args.inputs.ffmpegPreset);
      const ffmpegQuality = String(args.inputs.ffmpegQuality);
      const forceEncoding = args.inputs.forceEncoding === true;
      const hardwarEncoding = args.inputs.hardwareEncoding === true;

      if (
        forceEncoding
        || stream.codec_name !== targetCodec
      ) {
        args.variables.ffmpegCommand.shouldProcess = true;

        // eslint-disable-next-line no-await-in-loop
        const encoderProperties = await getEncoder({
          targetCodec,
          hardwareEncoding: hardwarEncoding,
          hardwareType,
          args,
        });

        stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);

        if (ffmpegQualityEnabled) {
          if (encoderProperties.isGpu) {
            if (encoderProperties.encoder === 'hevc_qsv') {
              stream.outputArgs.push('-global_quality', ffmpegQuality);
            } else {
              stream.outputArgs.push('-qp', ffmpegQuality);
            }
          } else {
            stream.outputArgs.push('-crf', ffmpegQuality);
          }
        }

        if (ffmpegPresetEnabled) {
          if (targetCodec !== 'av1' && ffmpegPreset) {
            let presetToUse: string | null = ffmpegPreset;
            // Convert CPU preset names to GPU-specific presets for hardware encoders
            if (encoderProperties.isGpu) {
              if (encoderProperties.encoder.includes('nvenc')) {
                const nvencPresetMap: Record<string, string> = {
                  veryslow: 'p7',
                  slower: 'p7',
                  slow: 'p6',
                  medium: 'p5',
                  fast: 'p4',
                  faster: 'p3',
                  veryfast: 'p2',
                  superfast: 'p1',
                  ultrafast: 'p1',
                };
                presetToUse = nvencPresetMap[ffmpegPreset] || 'p5';
              } else if (encoderProperties.encoder.includes('amf')) {
                const amfPresetMap: Record<string, string> = {
                  veryslow: 'quality',
                  slower: 'quality',
                  slow: 'quality',
                  medium: 'balanced',
                  fast: 'balanced',
                  faster: 'speed',
                  veryfast: 'speed',
                  superfast: 'speed',
                  ultrafast: 'speed',
                };
                presetToUse = amfPresetMap[ffmpegPreset] || 'balanced';
              } else if (encoderProperties.encoder.includes('qsv')) {
                // QSV: Uses CPU-style preset names directly
              } else {
                // VAAPI, rkmpp, videotoolbox: -preset not supported
                presetToUse = null;
              }
            }
            if (presetToUse) {
              stream.outputArgs.push('-preset', presetToUse);
            }
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
