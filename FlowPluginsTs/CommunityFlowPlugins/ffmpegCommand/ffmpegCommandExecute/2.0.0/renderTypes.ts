import { IgetEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

export interface IworkingStream extends Istreams {
  removed: boolean,
  sourceIndex: number,
  outputArgs: string[],
  encoder?: IgetEncoder,
  hardwareDecoding?: boolean,
  cropFilter?: string,
}

export type IffmpegCommandV2WorkingStream = IworkingStream;

export interface IresolutionBoundary {
  resolution: string,
  widthMin: number,
  widthMax: number,
  heightMin: number,
  heightMax: number,
}

export interface ICropValues {
  w: number,
  h: number,
  x: number,
  y: number,
}

export interface ICropDetectionSettings {
  cropMode: string,
  cropThreshold: number,
  sampleCount: number,
  framesPerSample: number,
  minCropPercent: number,
}

export interface ICropTargetStream {
  stream: IworkingStream,
  width: number,
  height: number,
}

export interface INormalizeAudioSettings {
  i: string,
  lra: string,
  tp: string,
  maxGain: number,
}

export interface ILoudnormValues {
  input_i: string,
  input_tp: string,
  input_lra: string,
  input_thresh: string,
  target_offset: string,
}

export interface IffmpegCommandV2RenderResult {
  spawnArgs: string[],
  shouldProcess: boolean,
  container: string,
  streams: IffmpegCommandV2WorkingStream[],
}

export const singletonOperationTypes = [
  'setVideoEncoder',
  'setAudioEncoder',
  'setVideoResolution',
  'setVideoFramerate',
  'setVideoBitrate',
  'setContainer',
  'reorderStreams',
  'cropBlackBars',
  'normalizeAudio',
] as const;

export type SingletonOperationType = typeof singletonOperationTypes[number];
export type ISingletonOperationInputs = Partial<Record<SingletonOperationType, Record<string, unknown>>>;
