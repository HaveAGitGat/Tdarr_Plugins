import {
  IffmpegCommandV2Request,
  IffmpegCommandV2Stream,
  IpluginInputArgs,
} from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../sampleData/media/sampleH264_1.json');

export const createDefaultV2Streams = (): IffmpegCommandV2Stream[] => [
  {
    index: 0,
    sourceIndex: 0,
    codec_name: 'h264',
    codec_type: 'video',
    width: 1280,
    height: 720,
    avg_frame_rate: '30000/1001',
    removed: false,
  },
  {
    index: 1,
    sourceIndex: 1,
    codec_name: 'aac',
    codec_type: 'audio',
    channels: 2,
    tags: {
      language: 'eng',
    },
    removed: false,
  },
];

export const createV2Args = ({
  inputs = {},
  streams = createDefaultV2Streams(),
  requests = [],
}: {
  inputs?: Record<string, unknown>,
  streams?: IffmpegCommandV2Stream[],
  requests?: IffmpegCommandV2Request[],
} = {}): IpluginInputArgs => {
  const inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
  inputFileObj._id = '/tmp/source.mp4';
  inputFileObj.container = 'mp4';
  inputFileObj.video_resolution = '720p';

  return {
    inputs,
    variables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ffmpegCommand: {} as any,
      ffmpegCommandV2: {
        version: 2,
        init: true,
        container: 'mp4',
        streams: JSON.parse(JSON.stringify(streams)),
        requests: JSON.parse(JSON.stringify(requests)),
      },
      flowFailed: false,
      user: {},
    },
    inputFileObj,
    jobLog: jest.fn(),
    ffmpegPath: '/usr/bin/ffmpeg',
    updateWorker: jest.fn(),
    logOutcome: jest.fn(),
    logFullCliOutput: false,
    workDir: '/tmp/work',
    deps: {
      fsextra: {
        ensureDirSync: jest.fn(),
      },
      parseArgsStringToArgv: jest.fn((str: string) => str.split(' ').filter(Boolean)),
      importFresh: jest.fn(),
      axiosMiddleware: jest.fn(),
      requireFromString: jest.fn(),
      upath: {
        join: (...paths: string[]) => paths.join('/'),
        basename: (path: string) => path.split('/').pop() || '',
        extname: (path: string) => {
          const name = path.split('/').pop() || '';
          const dotIndex = name.lastIndexOf('.');
          return dotIndex > 0 ? name.substring(dotIndex) : '';
        },
      },
      gracefulfs: {},
      mvdir: jest.fn(),
      ncp: jest.fn(),
      axios: {},
      crudTransDBN: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configVars: {} as any,
    },
  } as Partial<IpluginInputArgs> as IpluginInputArgs;
};

export const expectV2Request = (
  args: IpluginInputArgs,
  requestType: string,
  pluginName: string,
  inputs: Record<string, unknown>,
): void => {
  expect(args.variables.ffmpegCommandV2?.requests).toHaveLength(1);
  expect(args.variables.ffmpegCommandV2?.requests[0]).toEqual({
    pluginName,
    pluginVersion: '2.0.0',
    requestType,
    inputs,
  });
};
