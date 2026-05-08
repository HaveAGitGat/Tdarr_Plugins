import {
  createV2HdrToSdrRequest,
  createV2MockEncoder,
  createV2VideoEncoderRequest,
  createV2VideoResolutionRequest,
} from './scenarioUtils';
import type { IffmpegCommandV2Scenario } from './scenarioUtils';

const vaapiInputArgs = [
  '-hwaccel',
  'vaapi',
  '-hwaccel_device',
  '/dev/dri/renderD128',
  '-hwaccel_output_format',
  'vaapi',
];

const hardwareScenarios: IffmpegCommandV2Scenario[] = [
  {
    id: 'vaapi-hdr-resolution-bridge',
    description: 'VAAPI hardware decoding downloads for software filters and uploads before encoding',
    requests: [
      createV2VideoEncoderRequest({
        ffmpegQualityEnabled: false,
        hardwareType: 'vaapi',
        hardwareDecoding: true,
      }),
      createV2HdrToSdrRequest(),
      createV2VideoResolutionRequest('1080p'),
    ],
    encoder: createV2MockEncoder({
      encoder: 'hevc_vaapi',
      inputArgs: vaapiInputArgs,
    }),
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      spawnArgs: [
        '-y',
        '-vaapi_device',
        '/dev/dri/renderD128',
        '-hwaccel',
        'vaapi',
        '-hwaccel_device',
        '/dev/dri/renderD128',
        '-hwaccel_output_format',
        'vaapi',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'hevc_vaapi',
        '-filter:v:0',
        'hwdownload,format=nv12,zscale=t=linear:npl=100,format=yuv420p,scale=1920:-2,format=nv12,hwupload',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
];

export default hardwareScenarios;
