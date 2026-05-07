import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCropBlackBars/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
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

const makeSpawnOutput = (output: string, status = 0) => ({
  stdout: '',
  stderr: output,
  status,
  signal: null,
});

const makeStdoutSpawnOutput = (output: string) => ({
  stdout: output,
  stderr: '',
  status: 0,
  signal: null,
});

describe('ffmpegCommandCropBlackBars Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        cropMode: 'mostCommon',
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
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('-filter:v:{outputTypeIndex}');
      expect(videoStream.outputArgs).toContain('crop=1920:800:0:140');
    });

    it('should merge crop into an existing video filter chain', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-vf', 'scale=1920:-2'];
      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(videoStream.outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}',
        'crop=1920:800:0:140,scale=1920:-2',
      ]);
    });

    it('should detect and crop pillarbox black bars (left/right)', () => {
      const cropOutput = makeCropdetectOutput(1440, 1080, 240, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1440:1080:240:0');
    });

    it('should crop only the detected video stream when other video streams have different dimensions', () => {
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'h264',
        codec_type: 'video',
        width: 320,
        height: 180,
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:2'],
        inputArgs: [],
        outputArgs: [],
      });

      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      const mainVideoStream = result.variables.ffmpegCommand.streams[0];
      const secondaryVideoStream = result.variables.ffmpegCommand.streams[2];
      expect(mainVideoStream.outputArgs).toContain('crop=1920:800:0:140');
      expect(secondaryVideoStream.outputArgs).toEqual([]);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      const mapIndex = call.indexOf('-map');
      expect(call.slice(mapIndex, mapIndex + 2)).toEqual(['-map', '0:0']);
    });

    it('should scope merged crop filters when other video streams are present', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-vf', 'scale=1920:-2'];
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'h264',
        codec_type: 'video',
        width: 320,
        height: 180,
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:2'],
        inputArgs: [],
        outputArgs: [],
      });

      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}',
        'crop=1920:800:0:140,scale=1920:-2',
      ]);
      expect(result.variables.ffmpegCommand.streams[2].outputArgs).toEqual([]);
    });

    it('should detect and crop the next active video stream when an earlier video stream is removed', () => {
      baseArgs.variables.ffmpegCommand.streams[0].removed = true;
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'h264',
        codec_type: 'video',
        width: 320,
        height: 180,
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:2'],
        inputArgs: [],
        outputArgs: [],
      });

      const cropOutput = makeCropdetectOutput(320, 100, 0, 40, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[2].outputArgs).toEqual([
        '-filter:v:{outputTypeIndex}',
        'crop=320:100:0:40',
      ]);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      const mapIndex = call.indexOf('-map');
      expect(call.slice(mapIndex, mapIndex + 2)).toEqual(['-map', '0:2']);
    });

    it('should parse cropdetect output from stdout', () => {
      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.spawnSync.mockReturnValue(makeStdoutSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('crop=1920:800:0:140');
    });

    it('should not crop when no black bars detected', () => {
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
    });

    it('should skip crop when below minimum percentage threshold', () => {
      const cropOutput = makeCropdetectOutput(1920, 1070, 0, 5, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });

    it('should use the most common crop value across samples by default', () => {
      let callCount = 0;
      childProcess.spawnSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          return makeSpawnOutput(makeCropdetectOutput(1920, 800, 0, 140, 30));
        }
        return makeSpawnOutput(makeCropdetectOutput(1920, 810, 0, 135, 30));
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
      childProcess.spawnSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          // Smaller content area (more aggressive crop)
          return makeSpawnOutput(makeCropdetectOutput(1920, 800, 0, 140, 30));
        }
        // Larger content area (less aggressive crop) - this should be picked
        return makeSpawnOutput(makeCropdetectOutput(1920, 900, 0, 90, 30));
      });

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1920:900:0:90');
    });

    it('should use maximum crop (most aggressive) when cropMode is maximum', () => {
      baseArgs.inputs.cropMode = 'maximum';
      let callCount = 0;
      childProcess.spawnSync.mockImplementation(() => {
        callCount += 1;
        if (callCount <= 3) {
          // Smaller content area (more aggressive crop) - this should be picked
          return makeSpawnOutput(makeCropdetectOutput(1920, 800, 0, 140, 30));
        }
        // Larger content area (less aggressive crop)
        return makeSpawnOutput(makeCropdetectOutput(1920, 900, 0, 90, 30));
      });

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('crop=1920:800:0:140');
    });
  });

  describe('Error Handling', () => {
    it('should handle cropdetect failure gracefully', () => {
      childProcess.spawnSync.mockReturnValue({
        ...makeSpawnOutput(''),
        error: new Error('ffmpeg not found'),
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No crop values detected');
    });

    it('should continue when some samples fail', () => {
      let callCount = 0;
      childProcess.spawnSync.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          return makeSpawnOutput('', 1);
        }
        return makeSpawnOutput(makeCropdetectOutput(1920, 800, 0, 140, 30));
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });
  });

  describe('Audio Stream Handling', () => {
    it('should not modify audio streams', () => {
      const cropOutput = makeCropdetectOutput(1920, 800, 0, 140, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

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
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(['-t', '60']);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual(['-movflags', '+faststart']);
    });

    it('should preserve shouldProcess if already true', () => {
      baseArgs.variables.ffmpegCommand.shouldProcess = true;

      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should return correct output structure and preserve references', () => {
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

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
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      expect(childProcess.spawnSync).toHaveBeenCalledTimes(3);
    });

    it('should pass crop threshold to ffmpeg', () => {
      baseArgs.inputs.cropThreshold = '16';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      expect(call).toContain('cropdetect=16:2:0');
    });

    it('should pass explicit zero crop threshold to ffmpeg', () => {
      baseArgs.inputs.cropThreshold = '0';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      expect(call).toContain('cropdetect=0:2:0');
    });

    it('should use default crop threshold for non-numeric input', () => {
      baseArgs.inputs.cropThreshold = 'not-a-number';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      expect(call).toContain('cropdetect=24:2:0');
    });

    it('should apply sub-threshold crops when minimum crop percentage is zero', () => {
      baseArgs.inputs.minCropPercent = '0';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1070, 0, 5, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('crop=1920:1070:0:5');
    });

    it('should use default minimum crop percentage for non-numeric input', () => {
      baseArgs.inputs.minCropPercent = 'not-a-number';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1070, 0, 5, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Crop too small (0.9% < 2% threshold), skipping');
    });

    it('should pass frames per sample to ffmpeg', () => {
      baseArgs.inputs.framesPerSample = '60';
      baseArgs.inputs.sampleCount = '1';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      const call = childProcess.spawnSync.mock.calls[0][1] as string[];
      expect(call).toEqual(expect.arrayContaining(['-frames:v', '60']));
    });

    it('should pass ffmpeg path and input file as literal spawn arguments', () => {
      baseArgs.inputs.sampleCount = '1';
      baseArgs.ffmpegPath = '/usr/bin/ffmpeg $(echo unsafe)';
      baseArgs.inputFileObj._id = 'C:\\Media\\100% Real\\movie `test` $(echo unsafe).mkv';
      const cropOutput = makeCropdetectOutput(1920, 1080, 0, 0, 30);
      childProcess.spawnSync.mockReturnValue(makeSpawnOutput(cropOutput));

      plugin(baseArgs);

      const call = childProcess.spawnSync.mock.calls[0];
      expect(call[0]).toBe(baseArgs.ffmpegPath);
      expect(call[1]).toEqual(expect.arrayContaining(['-i', baseArgs.inputFileObj._id]));
      expect(call[2]).toEqual(expect.objectContaining({ shell: false }));
    });
  });
});
