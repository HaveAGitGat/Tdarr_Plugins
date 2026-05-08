import {
  createDefaultV2Streams,
  createV2CropBlackBarsRequest,
  createV2CustomArgumentsRequest,
  createV2NormalizeAudioRequest,
  createV2VideoBitrateRequest,
} from './scenarioUtils';
import type { IffmpegCommandV2Scenario } from './scenarioUtils';

const customScenarios: IffmpegCommandV2Scenario[] = [
  {
    id: 'custom-arguments-conflict-warning',
    description: 'Custom args are preserved and command-shaping output args are logged',
    streams: createDefaultV2Streams(),
    requests: [
      createV2CustomArgumentsRequest({
        inputArguments: '-threads 2',
        outputArguments: '-vf scale=1280:-2 -movflags +faststart',
      }),
    ],
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      jobLogs: [
        'Custom FFmpeg output arguments include command-shaping options that may conflict with v2 rendering.',
      ],
      spawnArgs: [
        '-y',
        '-threads',
        '2',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'copy',
        '-map',
        '0:1',
        '-c:1',
        'copy',
        '-vf',
        'scale=1280:-2',
        '-movflags',
        '+faststart',
      ],
    },
  },
  {
    id: 'noop-requests-are-logged',
    description: 'Currently no-op v2 requests are consumed explicitly without processing',
    streams: createDefaultV2Streams(),
    requests: [
      createV2CropBlackBarsRequest(),
      createV2NormalizeAudioRequest(),
    ],
    expected: {
      shouldProcess: false,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      jobLogs: [
        'Crop Black Bars v2 request has no render action yet; leaving streams unchanged.',
        'Normalize Audio v2 request has no render action yet; leaving streams unchanged.',
      ],
      spawnArgs: [
        '-y',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-c:0',
        'copy',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
  {
    id: 'fixed-video-bitrate',
    description: 'Video bitrate requests scope bitrate args to video output stream indexes',
    streams: createDefaultV2Streams(),
    requests: [
      createV2VideoBitrateRequest({
        bitrate: '3000',
      }),
    ],
    expected: {
      shouldProcess: true,
      container: 'mp4',
      sourceIndexes: [0, 1],
      codecTypes: ['video', 'audio'],
      jobLogs: [
        'Using fixed bitrate. Setting video bitrate as 3000k',
      ],
      spawnArgs: [
        '-y',
        '-i',
        '/tmp/source.mp4',
        '-map',
        '0:0',
        '-b:v:0',
        '3000k',
        '-map',
        '0:1',
        '-c:1',
        'copy',
      ],
    },
  },
];

export default customScenarios;
