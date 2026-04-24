import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetContainer/1.0.0/index';
import {
  IpluginInputArgs,
  IffmpegCommandStream,
} from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandSetContainer Plugin', () => {
  let baseArgs: IpluginInputArgs;

  const createStream = (index: number, codec_name: string, codec_type: string) => ({
    index,
    codec_name,
    codec_type,
    removed: false,
    forceEncoding: false,
    inputArgs: [],
    outputArgs: [],
    mapArgs: ['-map', `0:${index}`],
  });

  beforeEach(() => {
    baseArgs = {
      inputs: {
        container: 'mkv',
        forceConform: 'false',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            createStream(0, 'h264', 'video'),
            createStream(1, 'aac', 'audio'),
          ],
          container: '',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Container Change', () => {
    it('should set container to mkv when input is mp4', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputFileObj._id = 'test.mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should set container to mp4 when input is mkv', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.mkv';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.container).toBe('mp4');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should not process when container is already the same', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.container).toBe('');
    });

    it('should not process when container is already mkv', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputFileObj._id = 'test.mkv';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Force Conform - MKV Container', () => {
    beforeEach(() => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputs.forceConform = true;
      baseArgs.inputFileObj._id = 'test.mp4';
    });

    it('should remove data streams when converting to mkv', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'subtitle', 'data'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should remove mov_text codec when converting to mkv', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'mov_text', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should remove eia_608 codec when converting to mkv', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'eia_608', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should remove timed_id3 codec when converting to mkv', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'timed_id3', 'data'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should keep supported streams when converting to mkv', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'aac', 'audio'),
        createStream(2, 'subrip', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[2].removed).toBe(false);
    });
  });

  describe('Force Conform - MP4 Container', () => {
    beforeEach(() => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputs.forceConform = true;
      baseArgs.inputFileObj._id = 'test.mkv';
    });

    it('should remove attachment streams when converting to mp4', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'truetype', 'attachment'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should remove hdmv_pgs_subtitle codec when converting to mp4', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'hdmv_pgs_subtitle', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
    });

    it('should remove multiple unsupported codecs when converting to mp4', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'subrip', 'subtitle'),
        createStream(2, 'ass', 'subtitle'),
        createStream(3, 'ssa', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(true);
      expect(result.variables.ffmpegCommand.streams[2].removed).toBe(true);
      expect(result.variables.ffmpegCommand.streams[3].removed).toBe(true);
    });

    it('should keep supported streams when converting to mp4', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'aac', 'audio'),
        createStream(2, 'mov_text', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[2].removed).toBe(false);
    });
  });

  describe('Container-specific Input Arguments', () => {
    it('should add genpts flag for TS container input', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.ts';
      baseArgs.inputFileObj.container = 'ts';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-fflags');
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('+genpts');
    });

    it('should add genpts flag for AVI container input', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.avi';
      baseArgs.inputFileObj.container = 'avi';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-fflags');
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('+genpts');
    });

    it('should add genpts flag for MPG container input', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.mpg';
      baseArgs.inputFileObj.container = 'mpg';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-fflags');
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('+genpts');
    });

    it('should add genpts flag for MPEG container input', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputFileObj._id = 'test.mpeg';
      baseArgs.inputFileObj.container = 'mpeg';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-fflags');
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('+genpts');
    });

    it('should not add genpts flag for normal containers', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputFileObj.container = 'mp4';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).not.toContain('-fflags');
      expect(result.variables.ffmpegCommand.overallInputArguments).not.toContain('+genpts');
    });
  });

  describe('Force Conform Off', () => {
    it('should not modify streams when forceConform is false', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputs.forceConform = false;
      baseArgs.inputFileObj._id = 'test.mp4';
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'mov_text', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(false);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should not modify streams when forceConform is string "false"', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputs.forceConform = 'false';
      baseArgs.inputFileObj._id = 'test.mkv';
      baseArgs.variables.ffmpegCommand.streams = [
        createStream(0, 'h264', 'video'),
        createStream(1, 'hdmv_pgs_subtitle', 'subtitle'),
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle streams with missing codec_type', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputs.forceConform = true;
      baseArgs.inputFileObj._id = 'test.mp4';
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: undefined as unknown,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
        },
      ] as IffmpegCommandStream[];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
    });

    it('should handle streams with missing codec_name', () => {
      baseArgs.inputs.container = 'mp4';
      baseArgs.inputs.forceConform = true;
      baseArgs.inputFileObj._id = 'test.mkv';
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: undefined as unknown,
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
        },
      ] as IffmpegCommandStream[];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
    });

    it('should handle empty streams array', () => {
      baseArgs.inputs.container = 'mkv';
      baseArgs.inputs.forceConform = true;
      baseArgs.inputFileObj._id = 'test.mp4';
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });
  });

  describe('Variable Loading', () => {
    it('should load default values for inputs', () => {
      // Remove inputs to test default loading
      baseArgs.inputs = {};
      baseArgs.inputFileObj._id = 'test.mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should use default container 'mkv' from plugin details
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
    });
  });
});
