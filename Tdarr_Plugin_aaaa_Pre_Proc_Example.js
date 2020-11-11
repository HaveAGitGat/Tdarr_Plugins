module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_aaaa_Pre_Proc_Example",
    Stage: "Pre-processing", //Preprocessing or Post-processing. Determines when the plugin will be executed.
    Name: "No title meta data ",
    Type: "Video",
    Operation: "Transcode",
    Description: `This plugin removes metadata (if a title exists). The output container is the same as the original. \n\n`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugin_aaaa_Pre_Proc_Example",
    Tags: "ffmpeg,h265", //Provide tags to categorise your plugin in the plugin browser.Tag options: h265,hevc,h264,nvenc h265,nvenc h264,video only,audio only,subtitle only,handbrake,ffmpeg,radarr,sonarr,pre-processing,post-processing,configurable

    Inputs: [
      //(Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
      {
        name: "language",
        tooltip: `Enter one language tag here for the language of the subtitles you'd like to keep. 
      
      \\nExample:\\n 
      eng  
      
      \\nExample:\\n 
      
      fr  
      
      \\nExample:\\n 
      
      de`, //Each line following `Example:` will be clearly formatted. \\n used for line breaks
      },
      {
        name: "channels",
        tooltip: `Desired audio channel number.  
      
      \\nExample:\\n
      2`,
      },
    ],
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  //Must return this object at some point in the function else plugin will fail.

  var response = {
    processFile: false, //If set to false, the file will be skipped. Set to true to have the file transcoded.
    preset: "", //HandBrake/FFmpeg CLI arguments you'd like to use.
    //For FFmpeg, the input arguments come first followed by <io>, followed by the output argument.
    // Examples
    //HandBrake
    // '-Z "Very Fast 1080p30"'
    //FFmpeg
    // '-sn <io> -map_metadata -1 -c:v copy -c:a copy'
    container: ".mp4", // The container of the transcoded output file.
    handBrakeMode: false, //Set whether to use HandBrake or FFmpeg for transcoding
    FFmpegMode: false,
    reQueueAfter: true, //Leave as true. File will be re-qeued afterwards and pass through the plugin filter again to make sure it meets conditions.
    infoLog: "", //This will be shown when the user clicks the 'i' (info) button on a file in the output queue if
    //it has been skipped.
    // Give reasons why it has been skipped ('File has no title metadata, File meets conditions!')

    //Optional (include together)
    file,
    removeFromDB: false, //Tell Tdarr to remove file from database if true
    updateDB: false, //Change file object above and update database if true
  };

  console.log(inputs.language); //eng if user entered 'eng' in input box in Tdarr plugin UI
  console.log(inputs.channels); //2 if user entered '2' in input box in Tdarr plugin UI

  //Here we specify that we want the output file container to be the same as the current container.
  response.container = "." + file.container;

  //We will use FFmpeg for this procedure.
  response.FFmpegMode = true;

  //Check if file has title metadata
  if (file.meta.Title != undefined) {
    //if so, remove it

    response.infoLog += " File has title metadata";
    response.preset = ",-map_metadata -1 -c:v copy -c:a copy";
    response.processFile = true;
    return response;
  } else {
    response.infoLog += " File has no title metadata";
  }

  response.infoLog += " File meets conditions!";
  return response;
};

module.exports.onTranscodeSuccess = function onTranscodeSuccess(
  file,
  librarySettings,
  inputs
) {
  console.log(
    "Transcode success! Now do some stuff with the newly scanned file."
  );

  //Optional response if you need to modify database
  var response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  return response;
};

module.exports.onTranscodeError = function onTranscodeError(
  file,
  librarySettings,
  inputs
) {
  console.log("Transcode fail! Now do some stuff with the original file.");

  //Optional response if you need to modify database
  var response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  return response;
};

//Example file object:
//     {
//     _id: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
//    DB: 'ZRPDmnmpyuAEQi7nG',
//    HealthCheck: 'Not attempted',
//    TranscodeDecisionMaker: 'Not attempted',
//    bit_rate: 1690430.4,
//    container: 'mp4',
//    createdAt: 2019-09-26T06:46:31.929Z,
//    ffProbeData:
//     { streams:
//        [ { index: 0,
//            codec_name: 'h264',
//            codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
//            profile: 'Main',
//            codec_type: 'video',
//            codec_time_base: '1/50',
//            codec_tag_string: 'avc1',
//            codec_tag: '0x31637661',
//            width: 1280,
//            height: 720,
//            coded_width: 1280,
//            coded_height: 720,
//            has_b_frames: 0,
//            sample_aspect_ratio: '1:1',
//            display_aspect_ratio: '16:9',
//            pix_fmt: 'yuv420p',
//            level: 31,
//            chroma_location: 'left',
//            refs: 1,
//            is_avc: 'true',
//            nal_length_size: '4',
//            r_frame_rate: '25/1',
//            avg_frame_rate: '25/1',
//            time_base: '1/12800',
//            start_pts: 0,
//            start_time: '0.000000',
//            duration_ts: 67584,
//            duration: '5.280000',
//            bit_rate: '1205959',
//            bits_per_raw_sample: '8',
//            nb_frames: '132',
//            disposition:
//             { default: 1,
//               dub: 0,
//               original: 0,
//               comment: 0,
//               lyrics: 0,
//               karaoke: 0,
//               forced: 0,
//               hearing_impaired: 0,
//               visual_impaired: 0,
//               clean_effects: 0,
//               attached_pic: 0,
//               timed_thumbnails: 0 },
//            tags:
//             { creation_time: '1970-01-01T00:00:00.000000Z',
//               language: 'und',
//               handler_name: 'VideoHandler' } },
//          { index: 1,
//            codec_name: 'aac',
//            codec_long_name: 'AAC (Advanced Audio Coding)',
//            profile: 'LC',
//            codec_type: 'audio',
//            codec_time_base: '1/48000',
//            codec_tag_string: 'mp4a',
//            codec_tag: '0x6134706d',
//            sample_fmt: 'fltp',
//            sample_rate: '48000',
//            channels: 6,
//            channel_layout: '5.1',
//            bits_per_sample: 0,
//            r_frame_rate: '0/0',
//            avg_frame_rate: '0/0',
//            time_base: '1/48000',
//            start_pts: 0,
//            start_time: '0.000000',
//            duration_ts: 254976,
//            duration: '5.312000',
//            bit_rate: '384828',
//            max_bit_rate: '400392',
//            nb_frames: '249',
//            disposition:
//             { default: 1,
//               dub: 0,
//               original: 0,
//               comment: 0,
//               lyrics: 0,
//               karaoke: 0,
//               forced: 0,
//               hearing_impaired: 0,
//               visual_impaired: 0,
//               clean_effects: 0,
//               attached_pic: 0,
//               timed_thumbnails: 0 },
//            tags:
//             { creation_time: '1970-01-01T00:00:00.000000Z',
//               language: 'und',
//               handler_name: 'SoundHandler' } } ] },
//    ffProbeRead: 'success',
//    file: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
//    fileMedium: 'video',
//    file_size: 1.056519,
//    meta:
//     { SourceFile: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
//       errors: [],
//       Duration: 5.312,
//       PreviewDuration: 0,
//       SelectionDuration: 0,
//       TrackDuration: 5.28,
//       MediaDuration: 5.312,
//       ExifToolVersion: 11.65,
//       FileName: 'Sample.mp4',
//       Directory: 'C:/Users/H/Desktop/Test Input1',
//       FileSize: '1032 kB',
//       FileModifyDate:
//        { year: 2019,
//          month: 9,
//          day: 24,
//          hour: 7,
//          minute: 24,
//          second: 22,
//          millisecond: 0,
//          tzoffsetMinutes: 60,
//          rawValue: '2019:09:24 07:24:22+01:00' },
//       FileAccessDate:
//        { year: 2019,
//          month: 9,
//          day: 26,
//          hour: 7,
//          minute: 44,
//          second: 30,
//          millisecond: 0,
//          tzoffsetMinutes: 60,
//          rawValue: '2019:09:26 07:44:30+01:00' },
//       FileCreateDate:
//        { year: 2019,
//          month: 9,
//          day: 26,
//          hour: 7,
//          minute: 44,
//          second: 30,
//          millisecond: 0,
//          tzoffsetMinutes: 60,
//          rawValue: '2019:09:26 07:44:30+01:00' },
//       FilePermissions: 'rw-rw-rw-',
//       FileType: 'MP4',
//       FileTypeExtension: 'mp4',
//       MIMEType: 'video/mp4',
//       MajorBrand: 'MP4  Base Media v1 [IS0 14496-12:2003]',
//       MinorVersion: '0.2.0',
//       CompatibleBrands: [ 'isom', 'iso2', 'avc1', 'mp41' ],
//       MovieDataSize: 0,
//       MovieDataOffset: 1051515,
//       MovieHeaderVersion: 0,
//       CreateDate:
//        { year: 1970,
//          month: 1,
//          day: 8,
//          hour: 0,
//          minute: 0,
//          second: 0,
//          millisecond: 0,
//          rawValue: '1970:01:08 00:00:00' },
//       ModifyDate:
//        { year: 2014,
//          month: 7,
//          day: 19,
//          hour: 17,
//          minute: 15,
//          second: 29,
//          millisecond: 0,
//          rawValue: '2014:07:19 17:15:29' },
//       TimeScale: 1000,
//       PreferredRate: 1,
//       PreferredVolume: '100.00%',
//       PreviewTime: '0 s',
//       PosterTime: '0 s',
//       SelectionTime: '0 s',
//       CurrentTime: '0 s',
//       NextTrackID: 3,
//       TrackHeaderVersion: 0,
//       TrackCreateDate: '0000:00:00 00:00:00',
//       TrackModifyDate: '0000:00:00 00:00:00',
//       TrackID: 1,
//       TrackLayer: 0,
//       TrackVolume: '0.00%',
//       ImageWidth: 1280,
//       ImageHeight: 720,
//       GraphicsMode: 'srcCopy',
//       OpColor: '0 0 0',
//       CompressorID: 'avc1',
//       SourceImageWidth: 1280,
//       SourceImageHeight: 720,
//       XResolution: 72,
//       YResolution: 72,
//       BitDepth: 24,
//       VideoFrameRate: 25,
//       MatrixStructure: '1 0 0 0 1 0 0 0 1',
//       MediaHeaderVersion: 0,
//       MediaCreateDate: '0000:00:00 00:00:00',
//       MediaModifyDate: '0000:00:00 00:00:00',
//       MediaTimeScale: 48000,
//       MediaLanguageCode: 'und',
//       HandlerDescription: 'SoundHandler',
//       Balance: 0,
//       AudioFormat: 'mp4a',
//       AudioChannels: 2,
//       AudioBitsPerSample: 16,
//       AudioSampleRate: 48000,
//       HandlerType: 'Metadata',
//       HandlerVendorID: 'Apple',
//       Encoder: 'Lavf53.24.2',
//       Title: 'Sample title test',
//       Composer: 'th',
//       BeatsPerMinute: '',
//       ContentCreateDate: 2018,
//       Genre: 'this',
//       Artist: 'hhj',
//       Comment: 'hhk',
//       Subtitle: 'jj',
//       Mood: 'lik',
//       ContentDistributor: 'cont',
//       Conductor: 'jo',
//       Writer: 'writ',
//       InitialKey: 'ho',
//       Producer: 'prod',
//       ParentalRating: 'par',
//       Director: 'dir',
//       Period: 'pol',
//       Publisher: 'pub',
//       PromotionURL: 'prom',
//       AuthorURL: 'auth',
//       EncodedBy: 'enc',
//       Category: 'h',
//       ImageSize: '1280x720',
//       Megapixels: 0.922,
//       AvgBitrate: '1.58 Mbps',
//       Rotation: 0 },
//    processingStatus: false,
//    video_codec_name: 'h264',
//    video_resolution: '720p' }
