import {
  createV2HdrToSdrRequest,
  createV2MockEncoder,
  createV2Set10BitRequest,
  createV2VideoEncoderRequest,
  createV2VideoFramerateRequest,
  createV2VideoResolutionRequest,
} from './scenarioUtils';
import type { IffmpegCommandV2Scenario } from './scenarioUtils';

const qsvEncoderRequest = createV2VideoEncoderRequest();
const resolution1080Request = createV2VideoResolutionRequest('1080p');
const hdrToSdrRequest = createV2HdrToSdrRequest();
const framerate24Request = createV2VideoFramerateRequest('24');
const tenBitRequest = createV2Set10BitRequest();
const av1EncoderRequest = createV2VideoEncoderRequest({
  outputCodec: 'av1',
  hardwareEncoding: false,
  hardwareType: 'auto',
  hardwareDecoding: false,
});

const orderIndependenceScenarios: IffmpegCommandV2Scenario[] = [
  {
    id: 'qsv-encoder-resolution',
    description: 'QSV encoder and resolution render the same command regardless of request order',
    requests: [qsvEncoderRequest, resolution1080Request],
    requestVariants: [
      [qsvEncoderRequest, resolution1080Request],
      [resolution1080Request, qsvEncoderRequest],
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
    description: 'HDR, resolution, and framerate requests produce one stable video filter chain',
    requests: [hdrToSdrRequest, resolution1080Request, framerate24Request],
    requestVariants: [
      [hdrToSdrRequest, resolution1080Request, framerate24Request],
      [framerate24Request, resolution1080Request, hdrToSdrRequest],
      [resolution1080Request, hdrToSdrRequest, framerate24Request],
    ],
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
    description: 'AV1 encoder and 10-bit request keep stable libsvtav1 args regardless of order',
    requests: [av1EncoderRequest, tenBitRequest],
    requestVariants: [
      [av1EncoderRequest, tenBitRequest],
      [tenBitRequest, av1EncoderRequest],
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
