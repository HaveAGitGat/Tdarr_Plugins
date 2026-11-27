import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandFixRotation/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandFixRotation Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              width: 1080,
              height: 1920,
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:0'],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              channels: 2,
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:1'],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Legacy rotate tag', () => {
    it('should fix a 90 degree rotation', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=1', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-noautorotate');
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(
        expect.arrayContaining(['-display_rotation:0', '0']),
      );
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should fix a 180 degree rotation', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '180' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'hflip,vflip', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should fix a 270 degree rotation', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '270' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=2', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should normalize a negative rotation angle', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '-90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=2', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should do nothing when rotate is 0', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '0' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.overallInputArguments).not.toContain('-noautorotate');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Display Matrix side data', () => {
    it('should fix a rotation reported via side_data_list', () => {
      // Display Matrix rotation is counter-clockwise, so -90 here means the same physical
      // correction as a legacy rotate=90 tag: rotate 90 degrees clockwise (transpose=1).
      baseArgs.variables.ffmpegCommand.streams[0].side_data_list = [
        { side_data_type: 'Display Matrix', rotation: -90 },
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=1', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
      expect(result.variables.ffmpegCommand.overallInputArguments).toContain('-noautorotate');
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(
        expect.arrayContaining(['-display_rotation:0', '0']),
      );
    });

    it('should fix a positive Display Matrix rotation in the opposite direction of the same tag value', () => {
      baseArgs.variables.ffmpegCommand.streams[0].side_data_list = [
        { side_data_type: 'Display Matrix', rotation: 90 },
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=2', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should prefer the legacy rotate tag over side data when both are present', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '90' };
      baseArgs.variables.ffmpegCommand.streams[0].side_data_list = [
        { side_data_type: 'Display Matrix', rotation: 180 },
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=1', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });
  });

  describe('Multiple video streams', () => {
    it('should index -display_rotation by the stream\'s own ffprobe index, not its array position', () => {
      baseArgs.variables.ffmpegCommand.streams.unshift({
        index: 2,
        codec_name: 'mjpeg',
        codec_type: 'video',
        width: 300,
        height: 300,
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
      });
      baseArgs.variables.ffmpegCommand.streams[1].tags = { rotate: '90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=1', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
      // The rotated stream's own ffprobe index is 0 (set in beforeEach), even though it sits
      // at array position 1 after the mjpeg cover art was unshifted to the front.
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(
        expect.arrayContaining(['-display_rotation:0', '0']),
      );
    });

    it('should not skip a rotated stream that sits after an attachment-typed stream', () => {
      // Begin Command retypes attached-picture streams to codec_type 'attachment'. A naive
      // "count video-typed streams seen so far" counter would then undercount any real video
      // stream positioned after it, since ffmpeg still numbers it as a video stream on the
      // input side. Addressing by the stream's own ffprobe index sidesteps this entirely.
      baseArgs.variables.ffmpegCommand.streams.unshift({
        index: 0,
        codec_name: 'mjpeg',
        codec_type: 'attachment',
        width: 300,
        height: 300,
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:0'],
      });
      baseArgs.variables.ffmpegCommand.streams[1].index = 1;
      baseArgs.variables.ffmpegCommand.streams[1].tags = { rotate: '90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'transpose=1', '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(
        expect.arrayContaining(['-display_rotation:1', '0']),
      );
    });
  });

  describe('Warnings', () => {
    it('should log when the rotation is not a multiple of 90 degrees', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '45' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('not a multiple of 90'));
    });
  });

  describe('Existing video filters', () => {
    it('should chain the transpose onto an existing -vf filter instead of adding a competing option', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '90' };
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-vf', 'scale=1280:720'];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'scale=1280:720,transpose=1',
        '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should chain the transpose onto an existing stream-specific filter option', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '180' };
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = [
        '-filter:v:{outputTypeIndex}', 'zscale=t=linear:npl=100,format=yuv420p',
      ];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}', 'zscale=t=linear:npl=100,format=yuv420p,hflip,vflip',
        '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });

    it('should not treat non-filter output args as an existing filter', () => {
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '90' };
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v:{outputTypeIndex}', 'libx265'];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-c:v:{outputTypeIndex}', 'libx265',
        '-filter:v:{outputTypeIndex}', 'transpose=1',
        '-metadata:s:v:{outputTypeIndex}', 'rotate=',
      ]);
    });
  });

  describe('No rotation metadata', () => {
    it('should not modify streams without rotation metadata', () => {
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([]);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Non-video streams', () => {
    it('should ignore rotation-like tags on non-video streams', () => {
      baseArgs.variables.ffmpegCommand.streams[1].tags = { rotate: '90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([]);
    });

    it('should skip removed video streams', () => {
      baseArgs.variables.ffmpegCommand.streams[0].removed = true;
      baseArgs.variables.ffmpegCommand.streams[0].tags = { rotate: '90' };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });
  });

  describe('Output', () => {
    it('should return outputNumber 1 and pass through the file object', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });
});
