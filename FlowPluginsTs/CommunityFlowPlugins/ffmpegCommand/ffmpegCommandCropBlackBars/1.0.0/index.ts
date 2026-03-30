import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Crop Black Bars',
  description: 'Automatically detect and crop black bars from video using ffmpeg cropdetect.'
    + ' Samples multiple points in the video to find consistent crop values.'
    + ' Only crops if black bars exceed the configured threshold.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Crop Mode',
      name: 'cropMode',
      type: 'string',
      defaultValue: 'most_common',
      inputUI: {
        type: 'dropdown',
        options: [
          'most_common',
          'minimum',
          'maximum',
        ],
      },
      tooltip: 'How to select the final crop from all detected values.'
        + ' "most_common" picks the crop value that appears most often across samples.'
        + ' "minimum" picks the least aggressive crop (preserves the most content).'
        + ' "maximum" picks the most aggressive crop (removes the most black bars).',
    },
    {
      label: 'Crop Threshold',
      name: 'cropThreshold',
      type: 'number',
      defaultValue: '24',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Threshold for cropdetect filter (0-255). Higher values detect less aggressively.'
        + ' Default is 24. Lower values may detect dark scenes as black bars.',
    },
    {
      label: 'Sample Count',
      name: 'sampleCount',
      type: 'number',
      defaultValue: '5',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Number of sample points to analyse across the video duration.'
        + ' More samples give more accurate detection but take longer. Default is 5.',
    },
    {
      label: 'Frames Per Sample',
      name: 'framesPerSample',
      type: 'number',
      defaultValue: '30',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Number of frames to analyse per sample point. Default is 30.',
    },
    {
      label: 'Minimum Crop Percentage',
      name: 'minCropPercent',
      type: 'number',
      defaultValue: '2',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Minimum percentage of the image that must be cropped for the crop to be applied.'
        + ' Prevents tiny crops that may be detection noise. Default is 2%.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

interface ICropValues {
  w: number;
  h: number;
  x: number;
  y: number;
}

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
  if (crops.length === 0) return null;

  if (mode === 'minimum') {
    // Least aggressive crop: largest w and h (preserves the most content)
    let result = crops[0];
    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) > (result.w * result.h)) {
        result = crops[i];
      }
    }
    return result;
  }

  if (mode === 'maximum') {
    // Most aggressive crop: smallest w and h (removes the most black bars)
    let result = crops[0];
    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) < (result.w * result.h)) {
        result = crops[i];
      }
    }
    return result;
  }

  // Default: most_common
  const counts = new Map<string, { count: number; crop: ICropValues }>();

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process');

  const cropMode = String(args.inputs.cropMode) || 'most_common';
  const cropThreshold = Math.max(0, Math.min(255, Number(args.inputs.cropThreshold) || 24));
  const sampleCount = Math.max(1, Number(args.inputs.sampleCount) || 5);
  const framesPerSample = Math.max(1, Number(args.inputs.framesPerSample) || 30);
  const minCropPercent = Math.max(0, Number(args.inputs.minCropPercent) || 2);

  const filePath = args.inputFileObj._id;
  const duration = Number(args.inputFileObj.ffProbeData?.format?.duration) || 0;

  if (duration <= 0) {
    args.jobLog('Cannot detect crop: video duration unknown');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  let videoWidth = 0;
  let videoHeight = 0;

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];
    if (stream.codec_type === 'video' && stream.width && stream.height) {
      videoWidth = stream.width;
      videoHeight = stream.height;
      break;
    }
  }

  if (videoWidth === 0 || videoHeight === 0) {
    args.jobLog('Cannot detect crop: video dimensions unknown');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog(`Detecting black bars on ${videoWidth}x${videoHeight} video (duration: ${duration}s)`);

  const allCrops: ICropValues[] = [];

  for (let s = 0; s < sampleCount; s += 1) {
    // Sample evenly across the video, avoiding the first and last 10%
    const seekTime = Math.floor(duration * (0.1 + (0.8 * (s + 1)) / (sampleCount + 1)));

    try {
      const cmd = `"${args.ffmpegPath}" -ss ${seekTime} -i "${filePath}"`
        + ` -frames:v ${framesPerSample} -vf cropdetect=${cropThreshold}:2:0 -f null - 2>&1`;

      const output: string = childProcess.execSync(cmd, {
        timeout: 30000,
        windowsHide: true,
        encoding: 'utf8',
      });

      const crops = parseCropValues(output);
      allCrops.push(...crops);

      args.jobLog(`Sample ${s + 1}/${sampleCount} at ${seekTime}s: ${crops.length} crop values detected`);
    } catch (err) {
      args.jobLog(`Sample ${s + 1}/${sampleCount} at ${seekTime}s failed: ${err}`);
    }
  }

  if (allCrops.length === 0) {
    args.jobLog('No crop values detected');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  const crop = selectCrop(allCrops, cropMode);

  if (!crop) {
    args.jobLog('Could not determine consistent crop values');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Check if the crop is significant enough
  const croppedPixels = (videoWidth * videoHeight) - (crop.w * crop.h);
  const cropPercent = (croppedPixels / (videoWidth * videoHeight)) * 100;

  if (crop.w >= videoWidth && crop.h >= videoHeight) {
    args.jobLog('No black bars detected, no cropping needed');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  if (cropPercent < minCropPercent) {
    args.jobLog(
      `Crop too small (${cropPercent.toFixed(1)}% < ${minCropPercent}% threshold), skipping`,
    );
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog(
    `Cropping from ${videoWidth}x${videoHeight} to ${crop.w}x${crop.h}`
    + ` (removing ${cropPercent.toFixed(1)}% of image)`,
  );

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type === 'video') {
      stream.outputArgs.push('-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`);
    }
  });

  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
