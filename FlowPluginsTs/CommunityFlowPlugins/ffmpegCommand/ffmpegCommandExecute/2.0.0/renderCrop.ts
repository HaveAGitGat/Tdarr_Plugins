import { IpluginInputArgs } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  ICropDetectionSettings,
  ICropTargetStream,
  ICropValues,
  IworkingStream,
} from './renderTypes';
import { parseNumberInput } from './renderUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

const parseCropValues = (output: string): ICropValues[] => {
  const results: ICropValues[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/crop=(\d+):(\d+):(\d+):(\d+)/);
    if (match) {
      results.push({
        w: parseInt(match[1], 10),
        h: parseInt(match[2], 10),
        x: parseInt(match[3], 10),
        y: parseInt(match[4], 10),
      });
    }
  }

  return results;
};

const selectCrop = (crops: ICropValues[], mode: string): ICropValues | null => {
  if (crops.length === 0) {
    return null;
  }

  if (mode === 'minimum') {
    let result = crops[0];

    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) > (result.w * result.h)) {
        result = crops[i];
      }
    }

    return result;
  }

  if (mode === 'maximum') {
    let result = crops[0];

    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) < (result.w * result.h)) {
        result = crops[i];
      }
    }

    return result;
  }

  const counts = new Map<string, { count: number, crop: ICropValues }>();

  for (let i = 0; i < crops.length; i += 1) {
    const key = `${crops[i].w}:${crops[i].h}:${crops[i].x}:${crops[i].y}`;
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, crop: crops[i] });
    }
  }

  let bestCount = 0;
  let bestCrop: ICropValues | null = null;

  counts.forEach((entry) => {
    if (entry.count > bestCount) {
      bestCount = entry.count;
      bestCrop = entry.crop;
    }
  });

  return bestCrop;
};

const getCropDetectionSettings = (inputs: Record<string, unknown>): ICropDetectionSettings => ({
  cropMode: String(inputs.cropMode || 'mostCommon'),
  cropThreshold: Math.max(0, Math.min(255, parseNumberInput(inputs.cropThreshold, 24))),
  sampleCount: Math.max(1, Math.floor(parseNumberInput(inputs.sampleCount, 5))),
  framesPerSample: Math.max(1, Math.floor(parseNumberInput(inputs.framesPerSample, 30))),
  minCropPercent: Math.max(0, parseNumberInput(inputs.minCropPercent, 2)),
});

const getCropTargetStream = (streams: IworkingStream[]): ICropTargetStream | null => {
  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];
    const width = Number(stream.width);
    const height = Number(stream.height);

    if (!stream.removed && stream.codec_type === 'video' && width > 0 && height > 0) {
      return {
        stream,
        width,
        height,
      };
    }
  }

  return null;
};

const getCropPercent = (target: ICropTargetStream, crop: ICropValues): number => {
  const originalPixels = target.width * target.height;
  const croppedPixels = originalPixels - (crop.w * crop.h);
  return (croppedPixels / originalPixels) * 100;
};

const detectCropValues = (
  args: IpluginInputArgs,
  target: ICropTargetStream,
  settings: ICropDetectionSettings,
  duration: number,
): ICropValues[] => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process');
  const allCrops: ICropValues[] = [];

  for (let s = 0; s < settings.sampleCount; s += 1) {
    const seekTime = Math.floor(duration * (0.1 + (0.8 * (s + 1)) / (settings.sampleCount + 1)));

    try {
      const ffmpegArgs = [
        '-ss',
        String(seekTime),
        '-i',
        args.inputFileObj._id,
        '-map',
        `0:${target.stream.sourceIndex}`,
        '-frames:v',
        String(settings.framesPerSample),
        '-vf',
        `cropdetect=${settings.cropThreshold}:2:0`,
        '-f',
        'null',
        '-',
      ];

      const result = childProcess.spawnSync(args.ffmpegPath, ffmpegArgs, {
        timeout: 30000,
        windowsHide: true,
        encoding: 'utf8',
        shell: false,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new Error(`ffmpeg exited with status ${result.status}`);
      }

      const output = `${result.stdout || ''}${result.stderr || ''}`;
      const crops = parseCropValues(output);
      allCrops.push(...crops);
      args.jobLog(`Sample ${s + 1}/${settings.sampleCount} at ${seekTime}s: ${crops.length} crop values detected`);
    } catch (err) {
      args.jobLog(`Sample ${s + 1}/${settings.sampleCount} at ${seekTime}s failed: ${err}`);
    }
  }

  return allCrops;
};

const applyCropBlackBars = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const settings = getCropDetectionSettings(inputs);
  const duration = Number(args.inputFileObj.ffProbeData?.format?.duration) || 0;

  if (duration <= 0) {
    args.jobLog('Cannot detect crop: video duration unknown');
    return false;
  }

  const cropTarget = getCropTargetStream(streams);
  if (!cropTarget) {
    args.jobLog('Cannot detect crop: video dimensions unknown');
    return false;
  }

  args.jobLog(
    `Detecting black bars on stream ${cropTarget.stream.sourceIndex} `
    + `(${cropTarget.width}x${cropTarget.height}, duration: ${duration}s)`,
  );

  const allCrops = detectCropValues(args, cropTarget, settings, duration);

  if (allCrops.length === 0) {
    args.jobLog('No crop values detected');
    return false;
  }

  const crop = selectCrop(allCrops, settings.cropMode);

  if (!crop) {
    args.jobLog('Could not determine consistent crop values');
    return false;
  }

  const cropPercent = getCropPercent(cropTarget, crop);

  if (crop.w >= cropTarget.width && crop.h >= cropTarget.height) {
    args.jobLog('No black bars detected, no cropping needed');
    return false;
  }

  if (cropPercent < settings.minCropPercent) {
    args.jobLog(`Crop too small (${cropPercent.toFixed(1)}% < ${settings.minCropPercent}% threshold), skipping`);
    return false;
  }

  args.jobLog(
    `Cropping stream ${cropTarget.stream.sourceIndex} from ${cropTarget.width}x${cropTarget.height}`
    + ` to ${crop.w}x${crop.h}`
    + ` (removing ${cropPercent.toFixed(1)}% of image)`,
  );

  // cropdetect measures the source frame, so this is prepended before scale/HDR/framerate filters later.
  cropTarget.stream.cropFilter = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`;

  return true;
};

export default applyCropBlackBars;
