import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Fix Rotation',
  description: 'Detect rotation metadata (legacy "rotate" tag or "Display Matrix" side data) on the video '
    + 'stream, bake the rotation into the pixels, and strip the metadata. Fixes portrait/vertical videos '
    + 'that play sideways or upside-down on ExoPlayer-based apps (Plex, Kodi, Jellyfin on Android/Android TV), '
    + 'which do not reliably honor rotation metadata during direct play.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faRedo',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;

const getRotation = (stream: IffmpegCommandStream): number => {
  const tagRotate = stream?.tags?.rotate;
  if (tagRotate !== undefined) {
    const parsed = parseInt(String(tagRotate), 10);
    if (!Number.isNaN(parsed)) {
      return normalizeAngle(parsed);
    }
  }

  const sideDataList = stream?.side_data_list;
  if (Array.isArray(sideDataList)) {
    const displayMatrix = sideDataList.find((sideData) => (
      sideData?.side_data_type === 'Display Matrix' && sideData?.rotation !== undefined
    ));

    if (displayMatrix) {
      const parsed = parseInt(String(displayMatrix.rotation), 10);
      if (!Number.isNaN(parsed)) {
        return normalizeAngle(parsed);
      }
    }
  }

  return 0;
};

// Rotation angles are stored as the angle the player must rotate the raw pixels
// clockwise to display them correctly. `transpose` rotates 90 degrees at a time.
const getTransposeFilter = (rotation: number): string | undefined => {
  switch (rotation) {
    case 90:
      return 'transpose=1';
    case 180:
      return 'hflip,vflip';
    case 270:
      return 'transpose=2';
    default:
      return undefined;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  let rotationFixed = false;

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'video' || stream.removed) {
      return;
    }

    const rotation = getRotation(stream);
    const transposeFilter = getTransposeFilter(rotation);

    if (!transposeFilter) {
      return;
    }

    args.jobLog(`Found ${rotation}° rotation metadata on video stream index ${stream.index}, `
      + `applying '${transposeFilter}' and clearing rotation metadata`);

    stream.outputArgs.push('-vf', transposeFilter);
    stream.outputArgs.push('-metadata:s:v:{outputTypeIndex}', 'rotate=0');

    rotationFixed = true;
  });

  if (rotationFixed) {
    // Disable ffmpeg's built-in auto-rotate so it does not also apply the
    // rotation itself, which would double up on top of our manual transpose.
    if (!args.variables.ffmpegCommand.overallInputArguments.includes('-noautorotate')) {
      args.variables.ffmpegCommand.overallInputArguments.push('-noautorotate');
    }

    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
  }

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
