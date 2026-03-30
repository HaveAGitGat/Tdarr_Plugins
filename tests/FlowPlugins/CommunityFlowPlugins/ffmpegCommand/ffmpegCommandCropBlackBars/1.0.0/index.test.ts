import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCropBlackBars/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require('child_process');

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const makeCropdetectOutput = (w: number, h: number, x: number, y: number, count: number): string => {
  let output = '';
  for (let i = 0; i < count; i += 1) {
    output += `[Parsed_cropdetect_0 @ 0x0] x1:0 x2:${w - 1} y1:${y} y2:${y + h - 1}`
      + ` w:${w} h:${h} x:${x} y:${y} pts:${i * 40} t:${(i * 40) / 1000} crop=${w}:${h}:${x}:${y}\n`;
  }
  return output;
};

describe('ffmpegCommandCropBlackBars Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        cropMode: 'most_common',
        cropThreshold: '24',
        sampleCount: '5',
        framesPerSample: '30',
        minCropPercent: '2',
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
              width: 1920,
              height: 1080,
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:0'],
              inputArgs: [],
              outputArgs: [],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:1'],
              inputArgs: [],
              outputArgs: [],
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
      } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      ffmpegPath: '/usr/bin/ffmpeg',
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('FFmpeg Command Validation', () => {
    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });

    it('should throw error when ffmpegCommand is undefined', () => {
      (baseArgs.variables as Partial<IpluginInputArgs['variables']>).ffmpegCommand = undefined;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });

    it('should throw error when variables is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Testing runtime behavior
      delete baseArgs.variables;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });
  });

  describe('Duration Handling', () => {
    it('should skip when duration is unknown (zero)', () => {
      if (baseArgs.inputFileObj.ffProbeData.format) {
        baseArgs.inputFileObj.ffProbeData.format.duration = '0';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Cannot detect crop: video duration unknown');
    });

    it('should skip when duration is missing', () => {
      if (baseArgs.inputFileObj.ffProbeData.format) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete baseArgs.inputFileObj.ffProbeData.format.duration;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Video Dimension Handling', () => {
    it('should skip when video dimensions are unknown', () => {
      baseArgs.variables.ffmpegCommand.streams[0].width = undefined;
      baseArgs.variables.ffmpegCommand.streams[0].height = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Cannot detect crop: video dimensions unknown');
    });
  });

  describe('Black Bar Detection', () => {
    it('should detect and crop letterbox black bars (top/bottom)', () => {
      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('-vf');
      expect(videoStream.outputArgs).toContain('crop=1920:800:0:140');
    });

    it('should detect and crop pillarbox black bars (left/right)', () => {
      const cropOutput = makeCropdetectOutput(1440, 1080, 240, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1440:1080:240:0');
    });

    it('should not crop when no black bars detected', () => {
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
    });

    it('should skip crop when below minimum percentage threshold', () => {
      const cropOutput = makeCropdetectOutput(1920, 1070, 0, 5, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });

    it('should use the most common crop value across samples by default', () => {
      let callCount = 0;
      childProcess.execSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          return makeCropdetectOutput(1920, 800, 0, 140, 30);
        }
        return makeCropdetectOutput(1920, 810, 0, 135, 30);
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1920:800:0:140');
    });

    it('should use minimum crop (least aggressive) when cropMode is minimum', () => {
      baseArgs.inputs.cropMode = 'minimum';
      let callCount = 0;
      childProcess.execSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          // Smaller content area (more aggressive crop)
          return makeCropdetectOutput(1920, 800, 0, 140, 30);
        }
        // Larger content area (less aggressive crop) - this should be picked
        return makeCropdetectOutput(1920, 900, 0, 90, 30);
      });

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1920:900:0:90');
    });

    it('should use maximum crop (most aggressive) when cropMode is maximum', () => {
      baseArgs.inputs.cropMode = 'maximum';
      let callCount = 0;
      childProcess.execSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          // Smaller content area (more aggressive crop) - this should be picked
          return makeCropdetectOutput(1920, 800, 0, 140, 30);
        }
        // Larger content area (less aggressive crop)
        return makeCropdetectOutput(1920, 900, 0, 90, 30);
      });

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1920:800:0:140');
    });
  });

  describe('Error Handling', () => {
    it('should handle cropdetect failure gracefully', () => {
      childProcess.execSync.mockImplementation(() => {
        throw new Error('ffmpeg not found');
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No crop values detected');
    });

    it('should continue when some samples fail', () => {
      let callCount = 0;
      childProcess.execSync.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          throw new Error('timeout');
        }
        return makeCropdetectOutput(1920, 800, 0, 140, 30);
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });
  });

  describe('Audio Stream Handling', () => {
    it('should not modify audio streams', () => {
      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.outputArgs).toEqual([]);
    });
  });

  describe('Plugin Flow Integration', () => {
    it('should preserve existing ffmpegCommand state', () => {
      baseArgs.variables.ffmpegCommand.overallInputArguments = ['-t', '60'];
      baseArgs.variables.ffmpegCommand.overallOuputArguments = ['-movflags', '+faststart'];

      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(['-t', '60']);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual(['-movflags', '+faststart']);
    });

    it('should preserve shouldProcess if already true', () => {
      baseArgs.variables.ffmpegCommand.shouldProcess = true;

      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should return correct output structure and preserve references', () => {
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      const result = plugin(baseArgs);

      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });

  describe('Configuration', () => {
    it('should use custom sample count', () => {
      baseArgs.inputs.sampleCount = '3';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      plugin(baseArgs);

      expect(childProcess.execSync).toHaveBeenCalledTimes(3);
    });

    it('should pass crop threshold to ffmpeg', () => {
      baseArgs.inputs.cropThreshold = '16';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      plugin(baseArgs);

      const call = childProcess.execSync.mock.calls[0][0] as string;
      expect(call).toContain('cropdetect=16:2:0');
    });

    it('should pass frames per sample to ffmpeg', () => {
      baseArgs.inputs.framesPerSample = '60';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.execSync.mockReturnValue(cropOutput);

      plugin(baseArgs);

      const call = childProcess.execSync.mock.calls[0][0] as string;
      expect(call).toContain('-frames:v 60');
    });
  });
});
