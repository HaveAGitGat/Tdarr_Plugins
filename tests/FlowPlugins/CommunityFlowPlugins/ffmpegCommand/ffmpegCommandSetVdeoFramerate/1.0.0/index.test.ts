import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVdeoFramerate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH264_2 = require('../../../../../sampleData/media/sampleH264_2.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('ffmpegCommandSetVdeoFramerate Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        framerate: '30',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:0'],
              avg_frame_rate: '25/1',
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:1'],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: true,
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

  describe('Basic Framerate Setting', () => {
    it('should set desired framerate when file framerate is higher', () => {
      // File has 25fps, desired is 30fps, so should use 25fps (file framerate)
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '25/1';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('25');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Desired framerate: 30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 25');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is lower than desired framerate. Using file framerate.',
      );
    });

    it('should set desired framerate when file framerate is lower', () => {
      // File has 60fps, desired is 30fps, so should use 30fps (desired framerate)
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '60/1';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 60');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is greater than desired framerate. Using desired framerate.',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should use desired framerate when framerates are equal', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '30/1';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is greater than desired framerate. Using desired framerate.',
      );
    });
  });

  describe('Fractional Framerates', () => {
    it('should handle fractional framerates like 29.97 (30000/1001)', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '30000/1001';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('29.97002997002997');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 29.97002997002997');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is lower than desired framerate. Using file framerate.',
      );
    });

    it('should handle fractional framerates like 23.976 (24000/1001)', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '24000/1001';
      baseArgs.inputs.framerate = '25';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('23.976023976023978');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 23.976023976023978');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is lower than desired framerate. Using file framerate.',
      );
    });

    it('should handle high fractional framerates like 59.94 (60000/1001)', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '60000/1001';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File framerate: 59.94005994005994');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File framerate is greater than desired framerate. Using desired framerate.',
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should use desired framerate when avg_frame_rate is missing', () => {
      delete baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate;
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should use desired framerate when avg_frame_rate is empty', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should use desired framerate when avg_frame_rate is malformed', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = 'invalid/format';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should use desired framerate when avg_frame_rate has zero denominator', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '30/0';
      baseArgs.inputs.framerate = '25';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('25');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should use desired framerate when avg_frame_rate has zero numerator', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '0/1';
      baseArgs.inputs.framerate = '24';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('24');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });

    it('should handle negative framerate values gracefully', () => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '-25/1';
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using desired framerate.');
    });
  });

  describe('Multiple Video Streams', () => {
    it('should process multiple video streams', () => {
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'hevc',
        codec_type: 'video',
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
        avg_frame_rate: '60/1',
      });
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // First video stream (25fps -> use file framerate)
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('25');
      // Second video stream (60fps -> use desired framerate)
      expect(baseArgs.variables.ffmpegCommand.streams[2].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[2].outputArgs).toContain('30');
    });

    it('should skip non-video streams', () => {
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Video stream should be processed
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      // Audio stream should not be processed
      expect(baseArgs.variables.ffmpegCommand.streams[1].outputArgs).not.toContain('-r');
    });
  });

  describe('Different Framerate Values', () => {
    it.each([
      ['24', '24', '60/1'],
      ['25', '25', '60/1'],
      ['30', '30', '60/1'],
      ['50', '50', '60/1'],
      ['60', '60', '60/1'],
      ['120', '120', '200/1'], // File framerate higher than desired
    ])('should handle framerate %s', (inputFramerate, expectedFramerate, fileFramerate) => {
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = fileFramerate;
      baseArgs.inputs.framerate = inputFramerate;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain(expectedFramerate);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Desired framerate: ${Number(inputFramerate)}`);
    });
  });

  describe('Real Sample Data', () => {
    it('should work with real H264 sample data', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '25/1'; // From sample data
      baseArgs.inputs.framerate = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('25');
    });

    it('should work with real H264_2 sample data', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264_2)) as IFileObject;
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '30/1';
      baseArgs.inputs.framerate = '24';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('24');
    });

    it('should work with real H265 sample data', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265)) as IFileObject;
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '50/1';
      baseArgs.inputs.framerate = '60';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('50');
    });
  });

  describe('Default Values', () => {
    it('should use default framerate value when not provided', () => {
      delete baseArgs.inputs.framerate;
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '60/1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('30'); // Default value
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Desired framerate: 30');
    });

    it('should handle string input for framerate', () => {
      baseArgs.inputs.framerate = '25.5';
      baseArgs.variables.ffmpegCommand.streams[0].avg_frame_rate = '30/1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('-r');
      expect(baseArgs.variables.ffmpegCommand.streams[0].outputArgs).toContain('25.5');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Desired framerate: 25.5');
    });
  });
});
