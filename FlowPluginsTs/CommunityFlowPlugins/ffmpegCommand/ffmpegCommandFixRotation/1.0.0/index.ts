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
        // ffmpeg's Display Matrix rotation is a counter-clockwise angle (av_display_rotation_get),
        // the opposite sign convention of the legacy clockwise "rotate" tag. Negate it so both
        // paths feed getTransposeFilter() the same "degrees to rotate clockwise" convention.
        return normalizeAngle(-parsed);
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
  let inputVideoTypeIndex = -1;

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'video') {
      return;
    }

    // Tracks this stream's index among the *input* file's video streams (unaffected by
    // `removed`), since -display_rotation below is an input-side option and must address
    // the original demuxed stream layout, not our flow's filtered output layout.
    inputVideoTypeIndex += 1;

    if (stream.removed) {
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

    // Baking the rotation into the pixels is not enough: ffmpeg copies any pre-existing
    // "Display Matrix" side data straight through to the output stream, so without this
    // the fixed file would still carry the original rotation instruction and get rotated
    // a second time by any player that actually honors it. -display_rotation overrides
    // the input's side data to 0 so nothing stale survives into the encode.
    args.variables.ffmpegCommand.overallInputArguments.push(
      `-display_rotation:v:${inputVideoTypeIndex}`,
      '0',
    );

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
