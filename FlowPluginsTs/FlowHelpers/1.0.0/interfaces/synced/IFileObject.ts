export interface IstatSync { // tlint-disable-line statSync
  mtimeMs: number,
  ctimeMs: number,

  ctime?: '',
  mtime?: '',
  atime?: '',
}

export interface Itags {
  language?: string,
  title?: string,
  [key:string]: string | undefined,
}
export interface Istreams {
  codec_name: string;
  codec_type: string,
  bit_rate?: number,
  channels?: number,
  tags?: Itags,
  avg_frame_rate?: string,
  nb_frames?: string,

  duration?: number;
  width?: number,
  height?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  [index: string]: any
}

export interface Iformat {
    'filename'?: string,
    'nb_streams'?: number,
    'nb_programs'?: number,
    'format_name'?: string,
    'format_long_name'?: string,
    'start_time'?: string,
    'duration'?: string,
    'size'?: string,
    'bit_rate'?: string,
    'probe_score'?: number,
    [key:string]: string | number | undefined
  }

export interface IffProbeData {
  streams?: Istreams[]
  format?: Iformat
}

export interface Imeta {
  TrackDuration?: number,
  MediaDuration?: number,
  'SourceFile'?: string,
  'errors'?: [],
  'Duration'?: number,
  'ExifToolVersion'?: number,
  'FileName'?: string,
  'Directory'?: string,
  'FileSize'?: string,
  'FileModifyDate'?: {
    'year'?: number,
    'month'?: number,
    'day'?: number,
    'hour'?: number,
    'minute'?: number,
    'second'?: number,
    'millisecond'?: number,
    'tzoffsetMinutes'?: number,
    'rawValue'?: string,
  },
  'FileAccessDate'?: {
    'year'?: number,
    'month'?: number,
    'day'?: number,
    'hour'?: number,
    'minute'?: number,
    'second'?: number,
    'millisecond'?: number,
    'tzoffsetMinutes'?: number,
    'rawValue'?: string,
  },
  'FileCreateDate'?: {
    'year'?: number,
    'month'?: number,
    'day'?: number,
    'hour'?: number,
    'minute'?: number,
    'second'?: number,
    'millisecond'?: number,
    'tzoffsetMinutes'?: number,
    'rawValue'?: string,
  },
  'FilePermissions'?: string,
  'FileType'?: string,
  'FileTypeExtension'?: string,
  'MIMEType'?: string,
  'EBMLVersion'?: 1,
  'EBMLReadVersion'?: 1,
  'DocType'?: string,
  'DocTypeVersion'?: 4,
  'DocTypeReadVersion'?: 2,
  'TimecodeScale'?: string,
  'MuxingApp'?: string,
  'WritingApp'?: string,
  'VideoFrameRate'?: number,
  'ImageWidth'?: number,
  'ImageHeight'?: number,
  'TrackNumber'?: number,
  'TrackLanguage'?: string,
  'CodecID'?: string,
  'TrackType'?: string,
  'AudioChannels'?: number,
  'AudioSampleRate'?: number,
  'AudioBitsPerSample'?: number,
  'TagName'?: 'DURATION',
  'TagString'?: string,
  'ImageSize'?: string,
  'Megapixels'?: number,
}

export interface ImediaInfo {
  track?: [{
    '@type': string,
    'StreamOrder': string,
    'UniqueID': string,
    'VideoCount': string,
    'AudioCount': string,
    'Format': string,
    'Format_Version': string,
    'FileSize': string,
    'Duration': string,
    'OverallBitRate': string,
    'FrameRate': string,
    'FrameCount': string,
    'IsStreamable': string,
    'Encoded_Application': string,
    'Encoded_Library': string,
     BitRate: number,
    'extra': {
      'ErrorDetectionType': string,
    }
  }],
}

export interface IFileObjectMin {
  _id: string,
  file: string,
  DB: string,
  footprintId: string,
}

type IbaseStatus = '' | 'Hold' | 'Queued'
export type IHealthCheck = IbaseStatus | 'Success' | 'Error' | 'Cancelled'
export type ITranscodeDecisionMaker = IbaseStatus | 'Transcode success'
  | 'Transcode error' | 'Transcode cancelled' | 'Not required'

export interface IFileObjectStripped extends IFileObjectMin {
  container: string,
  scannerReads: {
    ffProbeRead: string,
  }
  createdAt: number,
  lastPluginDetails: string,
  bit_rate: number,
  statSync: IstatSync, // tlint-disable-line statSync
  file_size: number,
  ffProbeData: IffProbeData,
  hasClosedCaptions: boolean,
  bumped: boolean,
  HealthCheck: IHealthCheck,
  TranscodeDecisionMaker: ITranscodeDecisionMaker,
  holdUntil: number,
  fileMedium: string,
  video_codec_name: string,
  audio_codec_name: string,
  video_resolution: string,

  lastHealthCheckDate: number,
  lastTranscodeDate: number,
  history: string,
  oldSize: number,
  newSize: number,
  videoStreamIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  [index: string]: any,
}

export interface IFileObject extends IFileObjectStripped {
  scannerReads: {
    ffProbeRead: string,
    exiftoolRead: string,
    mediaInfoRead: string,
    closedCaptionRead: string,
  }
  meta?: Imeta,
  mediaInfo?: ImediaInfo,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  [index: string]: any,
}
