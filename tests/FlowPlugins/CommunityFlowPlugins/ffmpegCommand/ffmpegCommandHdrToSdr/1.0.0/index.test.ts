import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandHdrToSdr/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('ffmpegCommandHdrToSdr Plugin', () => {
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
              width: 1920,
              height: 1080,
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
          container: 'mkv',
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

  describe('Basic HDR to SDR Processing', () => {
    it('should add HDR to SDR filter to video streams', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('-vf');
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
    });

    it('should not modify audio streams', () => {
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([]);
    });

    it('should preserve original stream structure', () => {
      const originalStreams = JSON.parse(JSON.stringify(baseArgs.variables.ffmpegCommand.streams));
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].index).toBe(originalStreams[0].index);
      expect(result.variables.ffmpegCommand.streams[0].codec_name).toBe(originalStreams[0].codec_name);
      expect(result.variables.ffmpegCommand.streams[0].codec_type).toBe(originalStreams[0].codec_type);
      expect(result.variables.ffmpegCommand.streams[1].index).toBe(originalStreams[1].index);
      expect(result.variables.ffmpegCommand.streams[1].codec_name).toBe(originalStreams[1].codec_name);
      expect(result.variables.ffmpegCommand.streams[1].codec_type).toBe(originalStreams[1].codec_type);
    });
  });

  describe('Multiple Video Streams', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'h265',
        codec_type: 'video',
        width: 3840,
        height: 2160,
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
      });
    });

    it('should add HDR to SDR filter to all video streams with different codecs', () => {
      const result = plugin(baseArgs);

      const videoStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'video',
      );

      expect(videoStreams).toHaveLength(2);
      expect(result.variables.ffmpegCommand.streams[0].codec_name).toBe('h264');
      expect(result.variables.ffmpegCommand.streams[2].codec_name).toBe('h265');

      videoStreams.forEach((stream) => {
        expect(stream.outputArgs).toContain('-vf');
        expect(stream.outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
      });
    });
  });

  describe('Stream Types', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1920,
          height: 1080,
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
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
        },
        {
          index: 3,
          codec_name: 'mjpeg',
          codec_type: 'video',
          width: 300,
          height: 300,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:3'],
        },
      ];
    });

    it('should only process video streams', () => {
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[2].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[3].outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
    });

    it('should handle streams with existing output args', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'libx264', '-preset', 'fast'];

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-c:v', 'libx264', '-preset', 'fast', '-vf', 'zscale=t=linear:npl=100,format=yuv420p',
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });

    it('should throw error when ffmpegCommand is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).ffmpegCommand = undefined;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams).toEqual([]);
    });
  });

  describe('Real World Scenarios', () => {
    it('should work with H264 sample file', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      // Initialize ffmpegCommand streams based on file data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseArgs.variables.ffmpegCommand.streams = sampleH264.ffProbeData.streams.map((stream: any) => ({
        ...stream,
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', `0:${stream.index}`],
      }));

      const result = plugin(baseArgs);

      const videoStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'video',
      );

      expect(videoStreams.length).toBeGreaterThan(0);
      videoStreams.forEach((stream) => {
        expect(stream.outputArgs).toContain('-vf');
        expect(stream.outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
      });
    });

    it('should work with H265 sample file', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265)) as IFileObject;
      // Initialize ffmpegCommand streams based on file data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseArgs.variables.ffmpegCommand.streams = sampleH265.ffProbeData.streams.map((stream: any) => ({
        ...stream,
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', `0:${stream.index}`],
      }));

      const result = plugin(baseArgs);

      const videoStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'video',
      );

      expect(videoStreams.length).toBeGreaterThan(0);
      videoStreams.forEach((stream) => {
        expect(stream.outputArgs).toContain('-vf');
        expect(stream.outputArgs).toContain('zscale=t=linear:npl=100,format=yuv420p');
      });
    });
  });

  describe('Filter Appending', () => {
    it('should handle existing output args correctly', () => {
      // Test with existing video filter
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-vf', 'scale=1280:720'];
      let result = plugin(baseArgs);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-vf', 'scale=1280:720', '-vf', 'zscale=t=linear:npl=100,format=yuv420p',
      ]);

      // Reset and test with non-filter args
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'libx264'];
      result = plugin(baseArgs);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-c:v', 'libx264', '-vf', 'zscale=t=linear:npl=100,format=yuv420p',
      ]);
    });
  });
});
