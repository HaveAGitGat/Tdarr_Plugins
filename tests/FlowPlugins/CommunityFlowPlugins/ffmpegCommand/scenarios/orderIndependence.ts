import {
  createV2HdrToSdrOperation,
  createV2MockEncoder,
  createV2Set10BitOperation,
  createV2VideoEncoderOperation,
  createV2VideoFramerateOperation,
  createV2VideoResolutionOperation,
} from './scenarioUtils';
import type { IffmpegCommandV2Scenario } from './scenarioUtils';

const qsvEncoderOperation = createV2VideoEncoderOperation();
const resolution1080Operation = createV2VideoResolutionOperation('1080p');
const hdrToSdrOperation = createV2HdrToSdrOperation();
const framerate24Operation = createV2VideoFramerateOperation('24');
const tenBitOperation = createV2Set10BitOperation();
const softwareEncoderOperation = createV2VideoEncoderOperation({
  outputCodec: 'h264',
  hardwareEncoding: false,
  hardwareType: 'auto',
  hardwareDecoding: false,
});
const av1EncoderOperation = createV2VideoEncoderOperation({
  outputCodec: 'av1',
  hardwareEncoding: false,
  hardwareType: 'auto',
  hardwareDecoding: false,
});

const orderIndependenceScenarios: IffmpegCommandV2Scenario[] = [
  {
    id: 'qsv-encoder-resolution',
    description: 'QSV encoder and resolution render the same command regardless of operation order',
    operations: [qsvEncoderOperation, resolution1080Operation],
    operationVariants: [
      [qsvEncoderOperation, resolution1080Operation],
      [resolution1080Operation, qsvEncoderOperation],
    ],
    encoder: createV2MockEncoder(),
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      spawnArgs: [
        '-y',
        '-hwaccel',
        'qsv',
        '-hwaccel_output_format',
        'qsv',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'hevc_qsv',
        '-global_quality',
        '25',
        '-preset',
        'fast',
        '-filter:v:0',
        'vpp_qsv=w=1920:h=1080',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
  {
    id: 'software-filter-chain-order',
    description: 'HDR, resolution, and framerate operations produce one stable video filter chain',
    operations: [softwareEncoderOperation, hdrToSdrOperation, resolution1080Operation, framerate24Operation],
    operationVariants: [
      [softwareEncoderOperation, hdrToSdrOperation, resolution1080Operation, framerate24Operation],
      [framerate24Operation, resolution1080Operation, softwareEncoderOperation, hdrToSdrOperation],
      [resolution1080Operation, hdrToSdrOperation, framerate24Operation, softwareEncoderOperation],
    ],
    encoder: createV2MockEncoder({
      encoder: 'libx264',
      inputArgs: [],
      isGpu: false,
    }),
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      spawnArgs: [
        '-y',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'libx264',
        '-crf',
        '25',
        '-preset',
        'fast',
        '-filter:v:0',
        'zscale=t=linear:npl=100,format=yuv420p,scale=1920:-2,fps=24',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
  {
    id: 'av1-10bit-order',
    description: 'AV1 encoder and 10-bit operation keep stable libsvtav1 args regardless of order',
    operations: [av1EncoderOperation, tenBitOperation],
    operationVariants: [
      [av1EncoderOperation, tenBitOperation],
      [tenBitOperation, av1EncoderOperation],
    ],
    encoder: createV2MockEncoder({
      encoder: 'libsvtav1',
      inputArgs: [],
      isGpu: false,
    }),
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      spawnArgs: [
        '-y',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'libsvtav1',
        '-crf',
        '25',
        '-pix_fmt:v:0',
        'yuv420p10le',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
];

export default orderIndependenceScenarios;
