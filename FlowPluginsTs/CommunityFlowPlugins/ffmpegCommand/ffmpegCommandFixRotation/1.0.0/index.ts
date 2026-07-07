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
    + 'which do not reliably honor rotation metadata during direct play. Requires ffmpeg 6.0+ (uses '
    + '-display_rotation); on older ffmpeg builds the job will fail with "Unrecognized option". Forces a real '
    + 'video re-encode, so pair this with a "Set Video Encoder" plugin if you want control over the output '
    + 'codec/quality - without one, ffmpeg falls back to its default encoder settings.',
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

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'video' || stream.removed) {
      return;
    }

    const rotation = getRotation(stream);
    const transposeFilter = getTransposeFilter(rotation);

    if (!transposeFilter) {
      if (rotation !== 0) {
        args.jobLog(`Found ${rotation}° rotation metadata on video stream index ${stream.index}, `
          + 'which is not a multiple of 90° - skipping as this plugin cannot handle non-90-degree rotations');
      }
      return;
    }

    if (stream.outputArgs.some((arg) => arg === '-vf' || arg.startsWith('-filter:v'))) {
      args.jobLog(`Warning: video stream index ${stream.index} already has a video filter set by an earlier `
        + 'plugin. ffmpeg only keeps the last filter option per stream, so one of them will be silently '
        + 'dropped - place Fix Rotation before other video filter plugins, or merge the filters manually.');
    }

    args.jobLog(`Found ${rotation}° rotation metadata on video stream index ${stream.index}, `
      + `applying '${transposeFilter}' and clearing rotation metadata`);

    // Use a stream-specific specifier (not the unqualified -vf/-filter:v alias) since an
    // unqualified filter option applies to every video output stream, not just this one -
    // it would collide fatally with any other, untouched video stream that Execute copies.
    stream.outputArgs.push('-filter:v:{outputTypeIndex}', transposeFilter);
    stream.outputArgs.push('-metadata:s:v:{outputTypeIndex}', 'rotate=');

    // Baking the rotation into the pixels is not enough: ffmpeg copies any pre-existing
    // "Display Matrix" side data straight through to the output stream, so without this
    // the fixed file would still carry the original rotation instruction and get rotated
    // a second time by any player that actually honors it. -display_rotation overrides
    // the input's side data to 0 so nothing stale survives into the encode.
    //
    // Addressed by the stream's own absolute ffprobe index (a plain numeric specifier, not
    // a "v:N" type-relative one) since that's the only addressing that stays correct
    // regardless of earlier flow plugins: Begin Command retypes attached-picture streams to
    // codec_type 'attachment' (so a naive video-only counter here would skip them, even
    // though ffmpeg still counts them as video streams for "v:N" input-side addressing),
    // and Reorder Streams mutates the streams array order in place.
    args.variables.ffmpegCommand.overallInputArguments.push(
      `-display_rotation:${stream.index}`,
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
