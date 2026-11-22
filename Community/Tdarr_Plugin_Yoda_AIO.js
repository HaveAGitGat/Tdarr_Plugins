// tdarrSkipTest
// eslint-disable-next-line max-classes-per-file
const tick = '🟢';
const cross = '🔴';
const info = '🔵';

const TRUE_FALSE = ['true', 'false'];
const OFF_INCLUDE_EXCLUDE = ['off', 'include', 'exclude'];
const OFF_CLEAN_REMOVE = ['off', 'clean', 'remove'];
const MATROSKA_CONTAINER_LIST = ['mkv', 'mka', 'webm'];
const MP4_CONTAINER_LIST = ['mp4', 'm4a', 'm4b'];

const details = () => ({
  id: 'Tdarr_Plugin_Yoda_AIO',
  Stage: 'Pre-processing',
  Name: 'Yoda-Do All The Things',
  Type: 'Any',
  Operation: 'Transcode',
  Description: `Remux to new container (mkv/mp4), remove/clean titles, filter audio/subtitles based on language tag,
    convert video/audio/subtitles as required. The goal is to do everything in a single pass to reduce the overall
    processing time. Defaults are chosen based to allow streaming from Plex to Chromecast without any transcoding
    (remuxing is fine).
    \n
    \nDefaults:
    \n* streams are remuxed into mkv container (incompatible codecs are discarded if force_conform == true)
    \n* image format video streams are discarded
    \n* non-English audio streams are discarded
    \n* non-English subtitle streams are discarded
    \n* file title metadata is removed
    \n* video stream title metadata is cleaned
    \n* audio stream title metadata is cleaned
    \n* subtitle stream title metadata is untouched
    \n* video is transcoded to High Efficiency Video Coding (hevc aka h265) if it is not h264/h265/vp9 already - crf
        defaults to unspecified (uses ffmpeg defaults).\n
    \n* audio is transcoded to Opus (libopus) if it is not opus/vorbis/aac - bitrates depend on stream channel count\n
    \n* subtitles are transcoded to Web Video Text Tracks Format (webvtt) if not webvtt/subrip/ass/ssa\n
    `,
  Version: '0.3',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'original',
          ...MATROSKA_CONTAINER_LIST,
          ...MP4_CONTAINER_LIST,
        ],
      },
      tooltip: `Select the output container. 'original' keeps existing container.
                \\nExample:\\n
                original

                \\nExample:\\n
                mkv

                \\nExample:\\n
                mp4`,
    },
    {
      name: 'force_conform',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Discard stream types and codecs that cannot be encoded into selected container.
                \\n
                When false, some codecs / stream types may not be able to be encoded in the selected container.
                E.g. matroska (mkv, mka, webm) does not support data streams or mov_text subtitles.
                You will get an error in this case, but no data will be lost.
                \\nExample:\\n
                false
                \\n
                When true, codecs / stream types that cannot be encoded into the selected container will be discarded.
                E.g. for Matroska (mkv, mka, webm), mov_text subtitles will be discarded
                (unless subtitle transcoding is enabled).
                Bitmap-based subtitles will be discarded if the selected subtitle transcode codec is text-based,
                and vice-versa.
                \\nExample:\\n
                true`,
    },
    {
      name: 'keep_attachments',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Optionally keep attachment streams. Mostly seems to be used for extra fonts for displaying particularly
                fancy subtitles.
                \\n
                When false, attachment streams will be discarded.
                \\nExample:\\n
                false
                \\n
                When true, attachment streams will be remuxed to the new file.
                \\nExample:\\n
                true`,
    },
    {
      name: 'remove_images',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Enable/disable removal of unwanted image streams.
                \\nExample:\\n
                false

                \\nExample:\\n
                true`,
    },
    {
      name: 'optimise_for_streaming',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Enable/disable optimisation of file for Streaming.
                This only takes effect if other transcoding work is being done.
                \\nFor mp4, this adds the flag "-movflags faststart".
                \\nFor mkv, this adds the flag "-cues_to_front 1".
                \\nExample:\\n
                false

                \\nExample:\\n
                true`,
    },
    {
      name: 'filter_audio_languages',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Enable/disable filtering of audio streams.
                \\nExample:\\n
                false

                \\nExample:\\n
                true`,
    },
    {
      name: 'audio_filter_language',
      type: 'string',
      defaultValue: 'und,eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify language tag/s for the audio tracks you'd like to keep
                \\nRecommended to keep "und" as this stands for undertermined
                \\nSome files may not have the language specified.
                \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                und,eng

                \\nExample:\\n
                eng

                \\nExample:\\n
                und,eng,jpn`,
    },
    {
      name: 'filter_subtitle_languages',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Enable/disable filtering of subtitle streams.
                \\nExample:\\n
                false

                \\nExample:\\n
                true`,
    },
    {
      name: 'subtitle_filter_language',
      type: 'string',
      defaultValue: 'und,eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify language tag/s for the subtitle tracks you'd like to keep
                \\nRecommended to keep "und" as this stands for undertermined
                \\nSome files may not have the language specified.
                \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                und,eng

                \\nExample:\\n
                eng

                \\nExample:\\n
                und,eng,jpn

                \\nTip: to filter out all subtitle streams, use a value here that does not correspond to any language
                \\nExample:\\n
                nosuchlanguage`,
    },
    // TODO: optionally tag 'und' audio/subtitle streams with a user-provided language
    // TODO: optionally remove commentary audio/subtitles
    // TODO: optionally title untitled audio tracks according to the number of channels (e.g. 6ch -> title=5.1)
    // TODO: optionally title untitled subtitle tracks according to their language (e.g. 'eng' -> 'English')
    // TODO: sort audio streams by number of channels

    {
      name: 'clean_file_title',
      type: 'string',
      defaultValue: 'remove',
      inputUI: {
        type: 'dropdown',
        options: OFF_CLEAN_REMOVE,
      },
      tooltip: `Specify if global file metadata tile should be checked & cleaned.
                \\nWhen set to 'remove', unconditionally removes the title if it has one.
                \\nWhen set to 'clean', removes the title if it appears to be junk (is present but empty, contains more
                  than 3 consecutive periods, or matches the title_clean_matches option).
                \\nExample:\\n
                off

                \\nExample:\\n
                clean

                \\nExample:\\n
                remove`,
    },
    {
      name: 'clean_video_title',
      type: 'string',
      defaultValue: 'clean',
      inputUI: {
        type: 'dropdown',
        options: OFF_CLEAN_REMOVE,
      },
      tooltip: `Specify if video stream metadata tile should be checked & cleaned.
                \\nWhen set to 'remove', unconditionally removes the title if it has one.
                \\nWhen set to 'clean', removes the title if it appears to be junk (is present but empty, contains more
                  than 3 consecutive periods, or matches the title_clean_matches option).
                \\nExample:\\n
                off

                \\nExample:\\n
                clean

                \\nExample:\\n
                remove`,
    },
    {
      name: 'clean_audio_title',
      type: 'string',
      defaultValue: 'clean',
      inputUI: {
        type: 'dropdown',
        options: OFF_CLEAN_REMOVE,
      },
      tooltip: `Specify if audio stream metadata title should be checked & cleaned.
                \\nWhen set to 'remove', unconditionally removes the title if it has one.
                \\nWhen set to 'clean', removes the title if it appears to be junk (is present but empty, contains more
                  than 3 consecutive periods, or matches the title_clean_matches option).
                \\nExample:\\n
                off

                \\nExample:\\n
                clean

                \\nExample:\\n
                remove`,
    },
    {
      name: 'clean_subtitle_title',
      type: 'string',
      defaultValue: 'off',
      inputUI: {
        type: 'dropdown',
        options: OFF_CLEAN_REMOVE,
      },
      tooltip: `Specify if subtitle stream metadata title should be checked & cleaned.
                \\nWhen set to 'remove', unconditionally removes the title if it has one.
                \\nWhen set to 'clean', removes the title if it appears to be junk  (is present but empty, contains more
                  than 3 consecutive periods, or matches the title_clean_matches option).
                \\nExample:\\n
                off

                \\nExample:\\n
                clean

                \\nExample:\\n
                remove`,
    },
    {
      name: 'title_clean_matches',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `This only operates if the corresponding stream cleaning option is set to 'clean'.
                \\nTo identify junk titles, the plugin looks for titles with 3 or more periods \`.\`.
                \\nHere you can specify your own text for it to also search. If any of the comma-separated entries are
                found, the title is also removed.
                \\nComma separated. Optional.
                \\nExample:\\n
                MiNX - Small HD episodes

                \\nExample:\\n
                MiNX - Small HD episodes,GalaxyTV - small excellence!`,
    },
    {
      name: 'video_transcode',
      type: 'string',
      defaultValue: 'exclude',
      inputUI: {
        type: 'dropdown',
        options: OFF_INCLUDE_EXCLUDE,
      },
      tooltip: `Toggle video stream conversion behaviour.
                \\nWhen 'off', video streams will not be transcoded; they will be remuxed only.
                \\nExample:\\n
                off

                \\nWhen 'include', video streams will only be transcoded if they match any of the codecs specified in
                'video_transcode_include_codec'.
                \\nExample:\\n
                include

                \\nWhen 'exclude', video streams will only be transcoded if they do not match any of the codecs
                specified in 'video_transcode_exclude_codec'.
                \\nExample:\\n
                exclude`,
    },
    {
      name: 'video_transcode_include_codec',
      type: 'string',
      defaultValue: 'mpeg4',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to transcode.
                \\nThis is only used when 'video_transcode' is set to 'include'.
                \\ni.e. when 'video_transcode' is 'include', transcode only these codecs.
                \\nExample:\\n
                mpeg4

                \\nExample:\\n
                h264,mpeg4,mpeg2video`,
    },
    {
      name: 'video_transcode_exclude_codec',
      type: 'string',
      defaultValue: 'h264,hevc,vp9',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to not transcode.
                \\nThis is only used when 'video_transcode' is set to 'exclude'.
                \\ni.e. when 'video_transcode' is 'exclude', transcode all video except these codecs.
                \\nExample:\\n
                hevc,h264,vp9

                \\nExample:\\n
                hevc`,
    },
    {
      name: 'video_transcode_codec',
      type: 'string',
      defaultValue: 'libx265',
      inputUI: {
        type: 'dropdown',
        options: ['libx265', 'libx264'],
      },
      tooltip: `Codec to use for transcoding video.
                \\nUse the ffmpeg codec name (e.g. libh265 rather than hevc)
                \\nExample:\\n
                hevc

                \\nExample:\\n
                libh264`,
    },
    {
      name: 'video_transcode_crf',
      type: 'number',
      defaultValue: -1,
      inputUI: {
        type: 'text',
      },
      tooltip: `CRF to use when transcoding video. The number to use varies based on codec.
                \\nFor h264, 17-18 is visually lossless, 23 is default, higher than 28 is visually bad.
                https://trac.ffmpeg.org/wiki/Encode/H.264
                \\nFor h265, 28 is default. 17-18 is probably visually lossless, but I have not found documentation
                to confirm.
                https://trac.ffmpeg.org/wiki/Encode/H.265
                \\nUse -1 to use ffmpeg's default.

                \\nExample:\\n
                -1

                \\nExample:\\n
                23

                \\nExample:\\n
                18`,
    },
    {
      name: 'audio_transcode',
      type: 'string',
      defaultValue: 'exclude',
      inputUI: {
        type: 'dropdown',
        options: OFF_INCLUDE_EXCLUDE,
      },
      tooltip: `Toggle audio stream conversion behaviour.
                \\nWhen 'off', audio streams will not be transcoded; they will be remuxed only.
                \\nExample:\\n
                off

                \\nWhen 'include', audio streams will only be transcoded if they match any of the codecs specified in
                'audio_transcode_include_codec'.
                \\nExample:\\n
                include

                \\nWhen 'exclude', audio streams will only be transcoded if they do not match any of the codecs
                specified in 'audio_transcode_exclude_codec'.
                \\nExample:\\n
                exclude`,
    },
    {
      name: 'audio_transcode_include_codec',
      type: 'string',
      defaultValue: 'mp3,eac3,ac3',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to transcode.
                \\nThis is only used when 'audio_transcode' is set to 'include'.
                \\ni.e. when 'audio_transcode' is 'include', transcode only these codecs.
                \\nExample:\\n
                mp3,eac3,ac3

                \\nExample:\\n
                mp3,aac,eac3,ac3`,
    },
    {
      name: 'audio_transcode_exclude_codec',
      type: 'string',
      defaultValue: 'vorbis,opus,aac,flac',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to not transcode.
                \\nThis is only used when 'audio_transcode' is set to 'exclude'.
                \\ni.e. when 'audio_transcode' is 'exclude', transcode all audio except these codecs.
                \\nExample:\\n
                vorbis,opus,aac,flac

                \\nExample:\\n
                aac,ac3`,
    },
    {
      name: 'audio_transcode_codec',
      type: 'string',
      defaultValue: 'libopus',
      inputUI: {
        type: 'dropdown',
        options: ['libopus', 'libvorbis'],
      },
      tooltip: `Codec to use for transcoding audio.
                \\nUse the ffmpeg codec name (e.g. libopus rather than Opus)
                \\nExample:\\n
                libopus

                \\nExample:\\n
                libvorbis`,
    },
    {
      name: 'subtitle_transcode',
      type: 'string',
      defaultValue: 'exclude',
      inputUI: {
        type: 'dropdown',
        options: OFF_INCLUDE_EXCLUDE,
      },
      tooltip: `Toggle subtitle stream conversion behaviour.
                \\nWhen 'off', subtitle streams will not be transcoded; they will be remuxed only.
                \\nExample:\\n
                off

                \\nWhen 'include', subtitle streams will only be transcoded if they match any of the codecs specified in
                'subtitle_transcode_include_codec'.
                \\nExample:\\n
                include

                \\nWhen 'exclude', subtitle streams will only be transcoded if they do not match any of the codecs
                specified in 'subtitle_transcode_exclude_codec'.
                \\nExample:\\n
                exclude`,
    },
    {
      name: 'subtitle_transcode_include_codec',
      type: 'string',
      defaultValue: 'mov_text',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to transcode.
                \\nThis is only used when 'subtitle_transcode' is set to 'include'.
                \\ni.e. when 'subtitle_transcode' is 'include', transcode only these codecs.
                \\nExample:\\n
                mov_text

                \\nExample:\\n
                mov_text,subrip`,
    },
    {
      name: 'subtitle_transcode_exclude_codec',
      type: 'string',
      defaultValue: 'ass,ssa,subrip',
      inputUI: {
        type: 'text',
      },
      tooltip: `Comma-separated list of codecs to not transcode.
                \\nThis is only used when 'subtitle_transcode' is set to 'exclude'.
                \\ni.e. when 'subtitle_transcode' is 'exclude', transcode all subtitles except these codecs.
                \\nExample:\\n
                ass,ssa,subrip

                \\nExample:\\n
                mov_text,ssa`,
    },
    {
      name: 'subtitle_transcode_incompatible_behaviour',
      type: 'string',
      defaultValue: 'keep',
      inputUI: {
        type: 'dropdown',
        options: ['keep', 'discard'],
      },
      tooltip: `Whether to keep or discard subtitles that cannot be transcoded.
                \\nSubtitles can either be text-based or bitmap-based. fmpeg can only transcode text->text /
                bitmap->bitmap.
                \\nThis toggles the behaviour for whether a subtitle stream is kept or discarded if it cannot be
                transcoded into the target codec because of this incompatibility.
                \\nE.g. If the 'subtitle_transcode_codec' option is set to 'webvtt' (a text-based codec) and this option
                is set to 'keep', then any bitmap-based subtitles (e.g. dvdsub) will be kept as-is. If this option is
                set to 'discard', those same bitmap-based subtitles would be discarded as they cannot be transcoded.
                \\nExample:\\n
                keep

                \\nExample:\\n
                discard`,
    },
    // TODO: have two separate subtitle codec options, one for text-based and one for bitmap-based
    // do I really want to do this? i'm not a fan of bitmap-based subtitles and transcoding
    // them is unlikely to provide any benefit.
    // keeping formats which cannot be transcoded is probably enough.
    {
      name: 'subtitle_transcode_codec',
      type: 'string',
      defaultValue: 'ass',
      inputUI: {
        type: 'dropdown',
        options: ['webvtt', 'ass', 'ssa', 'subrip', 'dvd_subtitle'],
      },
      tooltip: `Codec to use for transcoding subtitles.
                \\nUse the ffmpeg codec name (e.g. libh265 rather than hevc)
                \\nExample:\\n
                ass

                \\nExample:\\n
                subrip`,
    },
    {
      name: 'subtitle_extract',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: TRUE_FALSE,
      },
      tooltip: `Extract subtitles to separate files
                (in addition to remuxing/transcoding - if no other work is being performed this does nothing).
                \\nWhen true, the subtitle stream will be extracted to a file alongside the output file in addition to
                being included as a subtitle stream within the output file.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
    },
  ],
});

class Imports {
  static get fs() {
    const fs = require('fs');
    return fs;
  }

  static get path() {
    const path = require('path');
    return path;
  }
}

class Stream {
  // the original stream passed to us
  #stream;

  // a boolean property to determine if we've been excluded from mapping
  isMarkedForDiscard = false;

  // a boolean property to determine if we're doing transcoding work
  isMarkedForTranscode = false;

  // a boolean property to determine if we're cleaning the stream title
  isMarkedForTitleClean = false;

  // a boolean property to determine if we're going to extract the stream to a separate file
  isMarkedForExtract = false;

  // the tags/properties we might override
  // convention: if undefined, we are not overriding
  // if null, we are removing the thing
  // if a string, we are setting the thing
  #language;

  static TYPE = Object.freeze({
    audio: Symbol('audio'),
    video: Symbol('video'),
    subtitle: Symbol('subtitle'),
    data: Symbol('data'),
    attachment: Symbol('attachment'),
  });

  constructor(stream) {
    this.#stream = stream;
  }

  markForDiscard() {
    this.isMarkedForDiscard = true;
  }

  markForTitleClean() {
    this.isMarkedForTitleClean = true;
  }

  markForTranscode() {
    this.isMarkedForTranscode = true;
  }

  markForExtract() {
    this.isMarkedForExtract = true;
  }

  get type() {
    const t = this.#stream.codec_type.toLowerCase();
    if (!Object.hasOwnProperty.call(Stream.TYPE, t)) {
      throw new Error(`Unknown stream type [${t}]`);
    }
    return Stream.TYPE[t];
  }

  get isVideo() {
    return this.type === Stream.TYPE.video;
  }

  get isAudio() {
    return this.type === Stream.TYPE.audio;
  }

  get isSubtitle() {
    return this.type === Stream.TYPE.subtitle;
  }

  get isData() {
    return this.type === Stream.TYPE.data;
  }

  get isAttachment() {
    return this.type === Stream.TYPE.attachment;
  }

  get language() {
    if (this.#language !== undefined) {
      return this.#language;
    }
    return this.readLanguageTag();
  }

  set language(language = undefined) {
    if (typeof language !== 'string' || language.length !== 3) {
      throw new Error('language must be a 3-character ISO 639-2 language code');
    }
    this.#language = language;
  }

  readLanguageTag() {
    let ret = this.#stream.tags?.language?.toLowerCase();
    if (ret === undefined) {
      ret = 'und';
    }
    return ret;
  }

  get title() {
    return this.#stream.tags?.title?.toLowerCase();
  }

  get codecName() {
    return this.#stream.codec_name;
  }

  get isImageVideo() {
    if (this.type !== Stream.TYPE.video) {
      return false;
    }

    if (this.#stream.disposition.attached_pic === 1) {
      return true;
    }

    return false;
  }

  get index() {
    return this.#stream.index;
  }

  get audioChannels() {
    return this.#stream.channels;
  }

  get bitRate() {
    return this.#stream.bit_rate;
  }

  get bitRatePretty() {
    const formatter = Intl.NumberFormat('en', {
      notation: 'compact',
      style: 'unit',
      unit: 'bit-per-second',
      unitDisplay: 'short',
      roundingMode: 'trunc',
    });
    const result = formatter.format(this.bitRate);
    return result;
  }

  get sampleRate() {
    return this.#stream.sample_rate;
  }

  get channelLayout() {
    return this.#stream.channel_layout;
  }

  static TEXT_SUBTITLES = ['webvtt', 'ass', 'ssa', 'subrip', 'mov_text'];

  static BITMAP_SUBTITLES = ['dvdsub', 'hdmv_pgs_subtitle', 'dvd_subtitle', 'dvb_subtitle'];

  static isTextSubtitle(codec) {
    return Stream.TEXT_SUBTITLES.includes(codec);
  }

  static isBitmapSubtitle(codec) {
    return Stream.BITMAP_SUBTITLES.includes(codec);
  }

  static getSubtitleType(codec) {
    if (Stream.isTextSubtitle(codec)) {
      return 'text';
    }

    if (Stream.isBitmapSubtitle(codec)) {
      return 'bitmap';
    }

    throw new Error(`Unknown subtitle codec, is this text or bitmap? ${codec}`);
  }

  get subtitleType() {
    return Stream.getSubtitleType(this.codecName);
  }

  get isBitmapSubtitle() {
    return this.isSubtitle && Stream.isBitmapSubtitle(this.codecName);
  }

  get isTextSubtitle() {
    return this.isSubtitle && Stream.isTextSubtitle(this.codecName);
  }

  get dispositions() {
    let ret = [];

    Object.entries(this.#stream.disposition).forEach(([k, v]) => {
      if (v === 1) {
        // flag hearing_impaired streams as subtitles for the deaf and hard of hearing (sdh)
        if (k === 'hearing_impaired') {
          ret.push('sdh');
        } else {
          ret.push(k);
        }
      }
    });

    ret = ret.join('.');

    return ret;
  }
}

class File {
  // the original files passed to us
  #file;

  #originalFile;

  isMarkedForTitleClean = false;

  // the list of our streams (instance of class Stream)
  #streams = [];

  constructor(file, originalFile) {
    this.#file = file;
    this.#originalFile = originalFile;
    this.#file.ffProbeData.streams.forEach((stream) => {
      this.#streams.push(new Stream(stream));
    });
  }

  markForTitleClean() {
    this.isMarkedForTitleClean = true;
  }

  getStreamsByType(type) {
    const ret = [];
    this.#streams.forEach((stream) => {
      if (stream.type === type) {
        ret.push(stream);
      }
    });
    return ret;
  }

  get videoStreams() {
    return this.getStreamsByType(Stream.TYPE.video);
  }

  get numVideoStreams() {
    return this.videoStreams.length;
  }

  // excludes attached images, which are 'video' streams in mp4
  get realVideoStreams() {
    return this.videoStreams.filter((stream) => !stream.isImageVideo);
  }

  get numRealVideoStreams() {
    return this.realVideoStreams.length;
  }

  get outputVideoStreams() {
    return this.videoStreams.filter((stream) => !stream.isMarkedForDiscard);
  }

  get numOutputVideoStreams() {
    return this.outputVideoStreams.length;
  }

  get outputRealVideoStreams() {
    return this.realVideoStreams.filter((stream) => !stream.isMarkedForDiscard);
  }

  get numOutputRealVideoStreams() {
    return this.outputRealVideoStreams.length;
  }

  get audioStreams() {
    return this.getStreamsByType(Stream.TYPE.audio);
  }

  get subtitleStreams() {
    return this.getStreamsByType(Stream.TYPE.subtitle);
  }

  get attachmentStreams() {
    return this.getStreamsByType(Stream.TYPE.attachment);
  }

  get dataStreams() {
    return this.getStreamsByType(Stream.TYPE.data);
  }

  get streams() {
    return this.#streams.slice();
  }

  get title() {
    return this.#file.meta?.Title;
  }

  pathnamed = false;

  // full original path of the file
  get pathname() {
    return this.#originalFile.file;
  }

  // full original directory of the file, without trailing /
  get dirname() {
    return Imports.path.dirname(this.pathname);
  }

  // full filename of original file without path
  get filename() {
    return Imports.path.basename(this.pathname);
  }

  // extension of original filename with leading .
  get extension() {
    return Imports.path.extname(this.filename);
  }

  // filename of original file without path or extension
  get basename() {
    return Imports.path.basename(this.filename, this.extension);
  }
}

class Plugin {
  // config is raw inputs from tdarr
  #config;

  // settings is what should be used, it's the parsed config from loadDefaultValues
  #settings;

  // our subclass instance of the file passed to us from tdarr, has helper functions to abstract away some logic
  #file;

  // all log messages displayed in the UI get gathered here
  #logs = [];

  constructor(file, librarySettings, inputs, otherArguments) {
    this.#config = {
      file,
      librarySettings,
      inputs,
      otherArguments,
    };
  }

  #loadDefaults(raw_inputs) {
    const lib = require('../methods/lib')();
    let inputs = raw_inputs;
    inputs = lib.loadDefaultValues(inputs, details);
    return inputs;
  }

  #log(...msg) {
    // eslint-disable-next-line no-console
    console.log(details().id, ...msg);
    this.#logs.push(...msg);
  }

  #debug(...msg) {
    // eslint-disable-next-line no-console
    console.debug(details().id, ...msg);
  }

  #loadConfiguration() {
    this.#settings = this.#loadDefaults(this.#config.inputs);
    this.#debug('config:', this.#config);
    this.#debug('settings:', this.#settings);
  }

  #parseFile() {
    this.#file = new File(
      this.#config.file,
      this.#config.otherArguments.originalLibraryFile,
    );
    this.#debug('processing file:', this.#file.pathname);
  }

  #filterImages() {
    if (!this.#settings.remove_images) {
      return;
    }
    this.#file.videoStreams.forEach((stream) => {
      if (stream.isImageVideo) {
        this.#log(`${cross} video stream 0:${stream.index} is unwanted image`);
        stream.markForDiscard();
      }
    });
  }

  get #audioFilterLanguages() {
    let ret = [];

    if (typeof this.#settings.audio_filter_language === 'string') {
      ret = this.#settings.audio_filter_language.split(',');
    }

    return ret;
  }

  get #subtitleFilterLanguages() {
    let ret = [];

    if (typeof this.#settings.subtitle_filter_language === 'string') {
      ret = this.#settings.subtitle_filter_language.split(',');
    }

    return ret;
  }

  #isWantedAudioLanguage(lang) {
    return this.#audioFilterLanguages.includes(lang);
  }

  #isWantedSubtitleLanguage(lang) {
    return this.#subtitleFilterLanguages.includes(lang);
  }

  #filterAudioLanguages() {
    if (!this.#settings.filter_audio_languages) {
      return;
    }

    // determine if we would have discarded all audio streams
    const countAudioStreams = this.#file.audioStreams.length;
    // conflicts with implicit-arrow-linebreak arrow-body-style
    // eslint-disable-next-line max-len
    const countWantedAudioStreams = this.#file.audioStreams.filter((stream) => this.#isWantedAudioLanguage(stream.language)).length;
    const discardedAll = countAudioStreams !== 0 && countWantedAudioStreams === 0;

    this.#file.audioStreams.forEach((stream) => {
      if (!this.#isWantedAudioLanguage(stream.language)) {
        // if we would have discarded all audios, let the user know we're keeping this one
        if (discardedAll) {
          this.#log(
            `${cross} audio stream 0:${stream.index} is unwanted language '${stream.language}' but discarding would`
              + 'result in zero audio streams, keeping',
          );
        } else {
          this.#log(
            `${cross} audio stream 0:${stream.index} is unwanted language '${stream.language}', discarding`,
          );
          stream.markForDiscard();
        }
      }
    });
  }

  #filterSubtitleLanguages() {
    if (!this.#settings.filter_subtitle_languages) {
      return;
    }
    this.#file.subtitleStreams.forEach((stream) => {
      if (!this.#isWantedSubtitleLanguage(stream.language)) {
        this.#log(
          `${cross} subtitle stream 0:${stream.index} is unwanted language '${stream.language}'`,
        );
        stream.markForDiscard();
      }
    });
  }

  #filterLanguages() {
    this.#filterAudioLanguages();
    this.#filterSubtitleLanguages();
  }

  get #customTitleMatches() {
    let ret = [];

    if (typeof this.#settings.title_clean_matches === 'string') {
      ret = this.#settings.title_clean_matches.split(',');
    }

    ret.forEach((r, i) => {
      ret[i] = new RegExp(r);
    });

    return ret;
  }

  #titleRequiresCleaning(title) {
    // if no title tag, doesn't require cleaning
    if (typeof title === 'undefined') {
      this.#debug("no title tag, doesn't require cleaning");
      return false;
    }

    // null/empty title - let's remove the tag entirely
    if (!title) {
      this.#debug('null/empty title, removing title tag');
      return true;
    }

    // more than 3 periods in the string - it's probably junk
    if (title.split('.').length > 3) {
      this.#debug('more than 3 periods in title, removing title tag');
      return true;
    }

    return this.#customTitleMatches.some((re) => {
      const ret = re.test(title);
      this.#debug('testing title against custom regex:', re, ret);
      return ret;
    });
  }

  #cleanFileTitle() {
    switch (this.#settings.clean_file_title) {
      case 'off':
        return;
      case 'clean':
        if (this.#titleRequiresCleaning(this.#file.title)) {
          this.#log(`${cross} file title requires cleaning`);
          this.#file.markForTitleClean();
        }
        break;
      case 'remove':
        if (this.#file.title !== undefined) {
          this.#log(`${cross} file title is being removed`);
          this.#file.markForTitleClean();
        }
        break;
      default:
        throw new Error(
          `Unknown configuration option for clean_file_title: '${
            this.#settings.clean_file_title
          }'`,
        );
    }
  }

  #cleanVideoTitles() {
    switch (this.#settings.clean_video_title) {
      case 'off':
        return;
      case 'clean':
        this.#file.videoStreams.forEach((stream) => {
          if (this.#titleRequiresCleaning(stream.title)) {
            this.#log(
              `${cross} video stream 0:${stream.index} title requires cleaning`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      case 'remove':
        this.#file.videoStreams.forEach((stream) => {
          if (typeof this.title !== 'undefined') {
            this.#log(
              `${cross} video stream 0:${stream.index} title is being removed`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      default:
        throw new Error(
          `unknown option for clean_video_title: '${
            this.#settings.clean_video_title
          }`,
        );
    }
  }

  #cleanAudioTitles() {
    switch (this.#settings.clean_audio_title) {
      case 'off':
        return;
      case 'clean':
        this.#file.videoStreams.forEach((stream) => {
          if (this.#titleRequiresCleaning(stream.title)) {
            this.#log(
              `${cross} audio stream 0:${stream.index} title requires cleaning`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      case 'remove':
        this.#file.videoStreams.forEach((stream) => {
          if (typeof this.title !== 'undefined') {
            this.#log(
              `${cross} audio stream 0:${stream.index} title is being removed`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      default:
        throw new Error(
          `unknown option for clean_audio_title: '${
            this.#settings.clean_audio_title
          }`,
        );
    }
  }

  #cleanSubtitleTitles() {
    switch (this.#settings.clean_subtitle_title) {
      case 'off':
        return;
      case 'clean':
        this.#file.videoStreams.forEach((stream) => {
          if (this.#titleRequiresCleaning(stream.title)) {
            this.#log(
              `${cross} subtitle stream 0:${stream.index} title requires cleaning`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      case 'remove':
        this.#file.videoStreams.forEach((stream) => {
          if (typeof this.title !== 'undefined') {
            this.#log(
              `${cross} subtitle stream 0:${stream.index} title is being removed`,
            );
            stream.markForTitleClean();
          }
        });
        break;
      default:
        throw new Error(
          `unknown option for clean_subtitle_title: '${
            this.#settings.clean_subtitle_title
          }`,
        );
    }
  }

  #cleanTitles() {
    this.#cleanFileTitle();
    this.#cleanVideoTitles();
    this.#cleanAudioTitles();
    this.#cleanSubtitleTitles();
  }

  #getCodecsForOperation(type, inexclude) {
    let ret = [];

    const key = `${type}_transcode_${inexclude}_codec`;

    if (typeof this.#settings[key] === 'string') {
      ret = this.#settings[key].split(',');
    }

    return ret;
  }

  shouldTranscodeStream(transcodeSetting, type, stream) {
    return (
      (transcodeSetting === 'include'
        && this.#getCodecsForOperation(type, transcodeSetting).includes(
          stream.codecName,
        ))
      || (transcodeSetting === 'exclude'
        && !this.#getCodecsForOperation(type, transcodeSetting).includes(
          stream.codecName,
        ))
    );
  }

  #transcodeStreamType(type) {
    const transcodeSettingKey = `${type}_transcode`;
    const transcodeSetting = this.#settings[transcodeSettingKey];
    const transcodeCodecKey = `${type}_transcode_codec`;
    const transcodeCodec = this.#settings[transcodeCodecKey];
    const forceConform = this.#settings.force_conform;
    const subtitleTranscodeIncompatibleBehaviour = this.#settings.subtitle_transcode_incompatible_behaviour;
    switch (transcodeSetting) {
      case 'off':
        return;
      case 'include':
      case 'exclude':
        this.#file[`${type}Streams`].forEach((stream) => {
          if (stream.isMarkedForDiscard) {
            return;
          }
          // don't transcode if no change to codec
          if (transcodeCodec === stream.codecName) {
            return;
          }

          // don't transcode image video streams
          if (stream.isImageVideo) {
            return;
          }

          // remove incompatible codecs
          if (!this.shouldTranscodeStream(transcodeSetting, type, stream)) {
            if (forceConform) {
              if (MATROSKA_CONTAINER_LIST.includes(this.container)) {
                // these subtitle codecs are not permitted in matroska
                if (
                  ['mov_text', 'eia_608', 'timed_id3'].includes(
                    stream.codecName,
                  )
                ) {
                  this.#log(
                    `${cross} ${type} stream 0:${stream.index} has codec '${stream.codecName}' incompatible with `
                      + `chosen container ${this.container}, discarding`,
                  );
                  stream.markForDiscard();
                  return;
                }
              }
              if (MP4_CONTAINER_LIST.includes(this.container)) {
                // these subtitle codecs are not permitted in mp4
                if (
                  [
                    'hdmv_pgs_subtitle',
                    'eia_608',
                    'subrip',
                    'timed_id3',
                  ].includes(stream.codecName)
                ) {
                  this.#log(
                    `${cross} ${type} stream 0:${stream.index} has codec '${stream.codecName}' incompatible with `
                      + `chosen container ${this.container}, discarding`,
                  );
                  stream.markForDiscard();
                  return;
                }
              }
            }
            return;
          }

          if (stream.isSubtitle) {
            if (
              stream.subtitleType !== Stream.getSubtitleType(transcodeCodec)
            ) {
              if (subtitleTranscodeIncompatibleBehaviour === 'discard') {
                this.#log(
                  `${cross} ${type} stream 0:${stream.index} is ${
                    stream.subtitleType
                  }/${
                    stream.codecName
                  } cannot be transcoded to ${Stream.getSubtitleType(
                    transcodeCodec,
                  )}/${transcodeCodec}, discarding (can only convert bitmap->bitmap / text->text)`,
                );
                stream.markForDiscard();
                return;
              }
              if (subtitleTranscodeIncompatibleBehaviour === 'keep') {
                this.#log(
                  `${cross} ${type} stream 0:${stream.index} is ${
                    stream[`${type}Type`]
                  }/${
                    stream.codecName
                  } cannot be transcoded to ${Stream.getSubtitleType(
                    transcodeCodec,
                  )}/${transcodeCodec}, skipping transcode (can only convert bitmap->bitmap / text->text)`,
                );
                return;
              }
            }
          }

          this.#log(
            `${cross} ${type} stream 0:${stream.index} has ${transcodeSetting}d codec ${stream.codecName}, `
              + `transcoding to ${transcodeCodec}`,
          );
          stream.markForTranscode();
        });
        break;
      default:
        throw new Error(
          `unknown option for ${transcodeSettingKey}: '${transcodeSetting}`,
        );
    }
  }

  #transcodeVideo() {
    this.#transcodeStreamType('video');
  }

  #transcodeAudio() {
    this.#transcodeStreamType('audio');
  }

  #transcodeSubtitle() {
    this.#transcodeStreamType('subtitle');
  }

  #transcodeStreams() {
    this.#transcodeVideo();
    this.#transcodeAudio();
    this.#transcodeSubtitle();
  }

  #extractSubtitles() {
    if (!this.#isDoingWork) {
      return;
    }
    if (!this.#settings.subtitle_extract) {
      return;
    }
    this.#file.subtitleStreams.forEach((stream) => {
      if (stream.isTextSubtitle) {
        stream.markForExtract();
      }
    });
  }

  #extractStreams() {
    this.#extractSubtitles();
  }

  main() {
    this.#loadConfiguration();
    this.#parseFile();

    // discard streams where we can to avoid processing them later
    this.#filterImages();
    this.#filterLanguages();

    // clean file title and stream titles
    this.#cleanTitles();

    // set up transcoding of streams
    this.#transcodeStreams();

    // set up streams for extraction (only used for subtitles)
    this.#extractStreams();
  }

  get container() {
    return this.#settings.container === 'original'
      ? this.#config.file.container
      : this.#settings.container;
  }

  get #isDoingWork() {
    return this.#file.streams.reduce(
      (doingWork, stream) => doingWork
        || this.#file.isMarkedForTitleClean
        || stream.isMarkedForTitleClean
        || stream.isMarkedForDiscard
        || stream.isMarkedForTranscode,
      // stream.extract is deliberately excluded
      // we can only extract streams if we're doing other work
      // so extraction of streams is _not_ considered 'doing work'
      false,
    );
  }

  generateResponse() {
    let index = 0;
    const commands = [];

    // tdarr can only detect one output file. this must be the multimedia file
    // and it must be the last file produced by ffmpeg.
    // therefore extract subtitles first, and dump them into the original file's folder.
    // we can only extract subtitles if we're doing other work, unless we "remux" the file without doing anything
    // but this would put us at risk of an infinite loop
    // as-is, I'm not prepared to force remuxing and risk an infinite loop just to extract subtitles.
    // this may change in future.
    if (this.#isDoingWork) {
      const SUBTITLE_CODEC_EXTENSIONS = {
        webvtt: 'vtt',
        ass: 'ass',
        ssa: 'ssa',
        subrip: 'srt',
      };
      if (this.#settings.subtitle_extract) {
        const subtitles = new Map();
        this.#file.subtitleStreams.forEach((stream) => {
          if (stream.isMarkedForDiscard) {
            return;
          }
          if (stream.isMarkedForExtract) {
            let subfile = this.#file.basename;

            this.#debug(
              `subtitle stream 0:${stream.index} is flagged for extraction`,
            );

            // append language
            subfile = `${subfile}.${stream.language}`;

            // should add dot-separated tags like 'forced' / 'default' / 'descriptions.sdh'
            if (stream.dispositions) {
              subfile = `${subfile}.${stream.dispositions}`;
            }

            // assume the extension and path will be the same for all subtitles we're extracting
            // if we've generated the same name previously, append a number this time
            if (subtitles.has(subfile)) {
              subtitles.set(subfile, subtitles.get(subfile) + 1);
              subfile = `${subfile}.${subtitles.get(subfile)}`;
            } else {
              subtitles.set(subfile, 0);
            }

            // append the extension
            subfile = `${subfile}.${
              SUBTITLE_CODEC_EXTENSIONS[this.#settings.subtitle_transcode_codec]
            }`;

            // prepend full path
            subfile = `${this.#file.dirname}${Imports.path.sep}${subfile}`;

            this.#debug('subfile', subfile);

            if (Imports.fs.existsSync(subfile)) {
              this.#debug('subfile already exists, not extracting');
              return;
            }

            this.#log(
              `${info} subtitle stream 0:${stream.index} (${stream.language}${
                stream.dispositions ? `-${stream.dispositions}` : ''
              }) is being extracted to file`,
            );

            commands.push(
              `-map 0:${stream.index} -c:0 ${
                this.#settings.subtitle_transcode_codec
              } "${subfile}"`,
            );
          }
        });
      }
    }

    if (this.#file.isMarkedForTitleClean) {
      commands.push('-metadata title=');
    }

    // for each video stream, get mapping and tagging commands
    this.#file.videoStreams.forEach((stream) => {
      if (stream.isMarkedForDiscard) {
        return;
      }
      if (stream.isImageVideo) {
        // i want images as attachments with a higher stream index than the video and audio streams
        return;
      }
      commands.push(`-map 0:${stream.index}`);
      if (stream.isMarkedForTitleClean) {
        commands.push(`-metadata:s:${index} title=`);
      }
      if (stream.isMarkedForTranscode) {
        commands.push(`-c:${index} ${this.#settings.video_transcode_codec}`);
        if (this.#settings.video_transcode_crf > -1) {
          commands.push(`-crf:${index} ${this.#settings.video_transcode_crf}`);
        }
      } else {
        commands.push(`-c:${index} copy`);
      }
      index += 1;
    });

    // for each audio stream, get mapping and tagging commands
    this.#file.audioStreams.forEach((stream) => {
      if (stream.isMarkedForDiscard) {
        return;
      }
      commands.push(`-map 0:${stream.index}`);
      if (stream.isMarkedForTitleClean) {
        commands.push(`-metadata:s:${index} title=`);
      }
      if (stream.isMarkedForTranscode) {
        commands.push(`-c:${index} ${this.#settings.audio_transcode_codec}`);

        if (this.#settings.audio_transcode_codec === 'libopus') {
          // ffmpeg leverages opusenc for encoding libopus
          // i assume that if no bitrate is specified to ffmpeg, it doesn't pass a bitrate flag to opusenc
          // so opusenc would use its own default bitrate
          // when opusenc is in vbr (variable bit rate) mode (which is the default if unspecified)
          // it will use 64 kbit/s for each mono stream, and 96 kbit/s for each coupled pair (stereo)
          // for sample rates 44.1 kHz or higher
          // (no information about lower kHz rates)
          // there does not appear to be a way to specify a qrf.
          // there is --comp, but it's already set to maximum quality

          // testing on file with:
          // * sample rate 22.05 kHz (sample_rate == 22050)
          // * bitrate of 62 kb/s (bit_rate == 62794)
          // * two audio channels (channels == 2)
          // per the ffmpeg/libopus output, if bit rate is not set, it defaults to 96000 bps
          // > No bit rate set. Defaulting to 96000 bps.
          // it's unclear if this came from opusenc or libopus (assuming libopus is a wrapper for opusenc)
          // sample rate is matched, bitrate is set to 96000

          // might wanna do something here that sets up a bitrate based on the source material
          // it's possible that opusenc makes more a sophisticated decision than 96k for stereo and 64k for mono
          // but if it doesn't, it's going to hurt the quality of high-bitrate source material
          // counterpoint: 64k per stream is 'transparent' according to opus docs
          if (
            // for stereo, opusenc will use 96 kbit/s
            // if this is stereo, and the origical bitrate is less, preserve the original bitrate
            // (under the assumption that opus will have better quality at the same bitrate of/at the source material)
            // (otherwise don't specify bitrate and let opusenc decide)
            (stream.audioChannels === 1 && stream.bitRate < 64000) // mono
            || (stream.audioChannels === 2 && stream.bitRate < 96000) // stereo
            // TODO: add support for 5.1 ?
            // the goal here is preserve the original bitrate if the source bitrate is below opus defaults
            // this is in order to conserve file size for low-bitrate source material
            // which is mostly audiobooks
            // and the idea of 5.1 is kinda antithetical to the audiobook experience
          ) {
            this.#log(
              `${info} source material bitrate is less than 96k, `
              + `preserving original bitrate of ${stream.bitRatePretty} (${stream.bitRate})`,
            );
            commands.push(`-b:${index} ${stream.bitRate}`);
            // commands.push(`-ar:${index} ${stream.sampleRate}`);
            // opusenc automatically selects a good sample rate for encoding, but reports 48000 when decoding
            // for reasons I don't understand,
            // opus is pretty much always decoded at 48000 regardless of the encoding sample rate
            // so reading the sample rate from the resulting file is misleading
            // but the ffmpeg logs do indicate the sample rate used for encoding
          }

          // TODO: remove this when ffmpeg bug is fixed
          // https://trac.ffmpeg.org/ticket/8939
          // https://trac.ffmpeg.org/ticket/5759
          // the default mapping_family=-1 uses older encoding techniques.
          // mapping_family=1 works great for surround sound, but falls apart for stereo.
          // mapping_family=0 should only be used for stereo (or presumably mono) as it doesn't do surround sound stuff,
          // but still uses newer encoding method
          if (stream.audioChannels <= 2) {
            commands.push(`-mapping_family:${index} 0`);
          } else {
            commands.push(`-mapping_family:${index} 1`);
          }

          // TODO: remove this when ffmpeg bug is fixed
          // https://trac.ffmpeg.org/ticket/5718
          if (stream.channelLayout === '5.1(side)') {
            commands.push(`-filter:${index} channelmap=channel_layout=5.1`);
          }
        }

        // TODO: maybe set up options for other codecs too?
      } else {
        commands.push(`-c:${index} copy`);
      }
      index += 1;
    });

    // for each subtitle stream, get mapping and tagging commands
    this.#file.subtitleStreams.forEach((stream) => {
      if (stream.isMarkedForDiscard) {
        return;
      }
      commands.push(`-map 0:${stream.index}`);
      if (stream.isMarkedForTitleClean) {
        commands.push(`-metadata:s:${index} title=`);
      }
      if (stream.isMarkedForTranscode) {
        commands.push(`-c:${index} ${this.#settings.subtitle_transcode_codec}`);
      } else {
        commands.push(`-c:${index} copy`);
      }
      index += 1;
    });

    // attach image video streams
    this.#file.videoStreams.forEach((stream) => {
      if (stream.isMarkedForDiscard) {
        return;
      }
      if (!stream.isImageVideo) {
        return;
      }
      commands.push(`-map 0:${stream.index}`);
      if (stream.isMarkedForTitleClean) {
        commands.push(`-metadata:s:${index} title=`);
      }
      commands.push(`-c:${index} copy`);
      index += 1;
    });

    // only add extra bits if we're actually producing a multimedia file
    if (this.#isDoingWork) {
      // copy attachment streams if enabled
      if (this.#settings.keep_attachments) {
        commands.push('-map 0:t? -c:t copy');
      }

      // discard data streams for matroska, keep for mp4
      if (MATROSKA_CONTAINER_LIST.includes(this.container)) {
        if (this.#settings.force_conform) {
          commands.push('-map -0:d?');
        } else {
          // keeping data streams for matroska will produce ffmpeg error
          // but we assume at this point that the user explicitly desires this
          commands.push('-map 0:d? -c:d copy');
        }
      }
      if (MP4_CONTAINER_LIST.includes(this.container)) {
        commands.push('-map 0:d? -c:d copy');
      }

      if (this.#settings.optimise_for_streaming) {
        if (MATROSKA_CONTAINER_LIST.includes(this.container)) {
          commands.push('-cues_to_front 1');
        }
        if (MP4_CONTAINER_LIST.includes(this.container)) {
          commands.push('-movflags +faststart');
        }
      }

      if (
        this.#file.numRealVideoStreams > 0
        && this.#file.numOutputRealVideoStreams === 0
      ) {
        throw new Error(
          'Cancelling plugin to avoid discarding all video streams',
        );
      }

      // explicitly specify output container for mp4
      // ffmpeg doesn't like opus in m4b but it is permitted
      if (MP4_CONTAINER_LIST.includes(this.container)) {
        commands.push('-f mp4');
      }
    }

    if (!this.#isDoingWork) {
      this.#log(`${tick} No work required`);
    }

    const ret = {
      processFile: this.#isDoingWork,
      reQueueAfter: false,
      preset: `<io>${commands.join(' ')}`,
      container: `.${this.container}`,
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: this.#logs.join('\n'),
    };

    this.#log(ret);

    return ret;
  }
}

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const p = new Plugin(file, librarySettings, inputs, otherArguments);
  p.main();
  return p.generateResponse();
};

module.exports.details = details;
module.exports.plugin = plugin;
