import {
  createDefaultV2Streams,
  createV2CustomArgumentsOperation,
  createV2NormalizeAudioOperation,
  createV2VideoBitrateOperation,
} from './scenarioUtils';
import type { IffmpegCommandV2Scenario } from './scenarioUtils';

const customScenarios: IffmpegCommandV2Scenario[] = [
  {
    id: 'custom-arguments-conflict-warning',
    description: 'Custom args are preserved and command-shaping output args are logged',
    streams: createDefaultV2Streams(),
    operations: [
      createV2CustomArgumentsOperation({
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
    id: 'normalize-audio',
    description: 'Normalize audio scopes loudnorm and audio encode args to audio streams',
    streams: createDefaultV2Streams(),
    operations: [
      createV2NormalizeAudioOperation(),
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
        '-c:0',
        'copy',
        '-map',
        '0:1',
        '-c:1',
        'aac',
        '-b:a:0',
        '192k',
        '-filter:a:0',
        'loudnorm=print_format=summary:linear=true:I=-23.0:LRA=7.0:TP=-2.0:'
        + 'measured_i=-16.42:measured_lra=11.32:measured_tp=-0.23:'
        + 'measured_thresh=-26.83:offset=0.59',
      ],
    },
  },
  {
    id: 'fixed-video-bitrate',
    description: 'Video bitrate operations scope bitrate args to video output stream indexes',
    streams: createDefaultV2Streams(),
    operations: [
      createV2VideoBitrateOperation({
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
