# Tdarr_Plugins

There are two types of plugin:

    Community: Plugins uploaded to this repo that anyone can use and will appear in the 'Plugins' tab in Tdarr.
    Local: Plugins only on your computer located in 'Plugins/Local' within your Tdarr documents folder.

Steps for creating a community or local plugin.

1. Copy the following pre and post-processing plugin examples:

https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Tdarr_Plugin_zzzz_Post_Proc_Example.js

https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Tdarr_Plugin_zzzz_Post_Proc_Example.js

2.Determine an id for your plugin. Every id must start with 'Tdarr_Plugin_xxxx' where xxxx is a random mini id containing the following:
    Numeric digits (0-9)
    Uppercase letters (A-Z)
    Lowercase letters (a-z)
    
    
The rest of the plugin id can be whatever you like. See the plugins folder for examples:
https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/Community

Your plugin id inside the file must be exactly the same as the plugin filename.

3.Update the rest of the plugin details inside 'function details()' in the plugin.

IMPORTANT: Think carefully about what you'd like your plugin to do. You cannot change the aim of a community plugin at a later date as others may be using the plugin. After the plugin has been submitted to community plugins, you can only fix bugs, clarify details and improve plugin performance.

4.(If local plugin then you can skip this)
For the plugin link, I'll add this once you create a PR to community  plugins.

5. Configure 'function plugin(file)' with logic on whether to transcode the file or not. 'file' is an object with hundreds of file properties extracted using FFprobe and ExifTool. The following response object MUST be returned by your plugin. The values shown are the default values:


        var response = {

        processFile: false, //If set to false, the file will be skipped. Set to true to have the file transcoded.
        preset: '', //HandBrake/FFmpeg CLI aguments you'd like to use. 
                 //For FFmpeg, the input arguments come first followed by a comma, followed by the output argument.
                 // Examples
                      //HandBrake
                          // '-Z "Very Fast 1080p30"'
                      //FFmpeg
                          // '-sn,-map_metadata -1 -c:v copy -c:a copy'
        container: '.mp4', // The container of the transcoded output file.
        handBrakeMode: false, //Set whether to use HandBrake or FFmpeg for transcoding
        FFmpegMode: false,
        reQueueAfter: false, //If you can't do all tasks in one pass, set this to true. The file will be re-added to the transcode queue
                        //afterwards for additional processing. See Tdarr_Plugin_hk75_Drawmonster_MP4_AAC_No_Subs_No_metaTitle
                        //In that plugin, several passes are used to remove subs, metadata and add an aac track.
        infoLog: '',        //This will be shown when the user clicks the 'i' (info) button on a file in the output queue if 
                        //it has been skipped.
                        // Give reasons why it has been skipped ('File has no title metadata, File meets conditions!')

       }
  
  
  Please see the bottom of this README for the structure of an example file object. To see a specific file's details, search for the file in the search tab and click the 'i' info button.
  
 
 6.Once you have finished configuring your plugin, 
 
 For community plugins:
 Create a pull request to have your plugin added to:
 https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/Community
 
 For local plugins:
Add them to 'User\Documents\Tdarr\Plugins\Local'. In Tdarr, select 'Local' in the plugin section of the library you're in and add your local plugin id.
  
 
     Example file object:
     var file = { 
        _id: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
       DB: 'ZRPDmnmpyuAEQi7nG',
       HealthCheck: 'Not attempted',
       TranscodeDecisionMaker: 'Not attempted',
       bit_rate: 1690430.4,
       container: 'mp4',
       createdAt: 2019-09-26T06:46:31.929Z,
       ffProbeData:
        { streams:
           [ { index: 0,
               codec_name: 'h264',
               codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
               profile: 'Main',
               codec_type: 'video',
               codec_time_base: '1/50',
               codec_tag_string: 'avc1',
               codec_tag: '0x31637661',
               width: 1280,
               height: 720,
               coded_width: 1280,
               coded_height: 720,
               has_b_frames: 0,
               sample_aspect_ratio: '1:1',
               display_aspect_ratio: '16:9',
               pix_fmt: 'yuv420p',
               level: 31,
               chroma_location: 'left',
               refs: 1,
               is_avc: 'true',
               nal_length_size: '4',
               r_frame_rate: '25/1',
               avg_frame_rate: '25/1',
               time_base: '1/12800',
               start_pts: 0,
               start_time: '0.000000',
               duration_ts: 67584,
               duration: '5.280000',
               bit_rate: '1205959',
               bits_per_raw_sample: '8',
               nb_frames: '132',
               disposition:
                { default: 1,
                  dub: 0,
                  original: 0,
                  comment: 0,
                  lyrics: 0,
                  karaoke: 0,
                  forced: 0,
                  hearing_impaired: 0,
                  visual_impaired: 0,
                  clean_effects: 0,
                  attached_pic: 0,
                  timed_thumbnails: 0 },
               tags:
                { creation_time: '1970-01-01T00:00:00.000000Z',
                  language: 'und',
                  handler_name: 'VideoHandler' } },
             { index: 1,
               codec_name: 'aac',
               codec_long_name: 'AAC (Advanced Audio Coding)',
               profile: 'LC',
               codec_type: 'audio',
               codec_time_base: '1/48000',
               codec_tag_string: 'mp4a',
               codec_tag: '0x6134706d',
               sample_fmt: 'fltp',
               sample_rate: '48000',
               channels: 6,
               channel_layout: '5.1',
               bits_per_sample: 0,
               r_frame_rate: '0/0',
               avg_frame_rate: '0/0',
               time_base: '1/48000',
               start_pts: 0,
               start_time: '0.000000',
               duration_ts: 254976,
               duration: '5.312000',
               bit_rate: '384828',
               max_bit_rate: '400392',
               nb_frames: '249',
               disposition:
                { default: 1,
                  dub: 0,
                  original: 0,
                  comment: 0,
                  lyrics: 0,
                  karaoke: 0,
                  forced: 0,
                  hearing_impaired: 0,
                  visual_impaired: 0,
                  clean_effects: 0,
                  attached_pic: 0,
                  timed_thumbnails: 0 },
               tags:
                { creation_time: '1970-01-01T00:00:00.000000Z',
                  language: 'und',
                  handler_name: 'SoundHandler' } } ] },
       ffProbeRead: 'success',
       file: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
       fileMedium: 'video',
       file_size: 1.056519,
       meta:
        { SourceFile: 'C:/Users/H/Desktop/Test Input1/Sample.mp4',
          errors: [],
          Duration: 5.312,
          PreviewDuration: 0,
          SelectionDuration: 0,
          TrackDuration: 5.28,
          MediaDuration: 5.312,
          ExifToolVersion: 11.65,
          FileName: 'Sample.mp4',
          Directory: 'C:/Users/H/Desktop/Test Input1',
          FileSize: '1032 kB',
          FileModifyDate:
           { year: 2019,
             month: 9,
             day: 24,
             hour: 7,
             minute: 24,
             second: 22,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:24 07:24:22+01:00' },
          FileAccessDate:
           { year: 2019,
             month: 9,
             day: 26,
             hour: 7,
             minute: 44,
             second: 30,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:26 07:44:30+01:00' },
          FileCreateDate:
           { year: 2019,
             month: 9,
             day: 26,
             hour: 7,
             minute: 44,
             second: 30,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:26 07:44:30+01:00' },
          FilePermissions: 'rw-rw-rw-',
          FileType: 'MP4',
          FileTypeExtension: 'mp4',
          MIMEType: 'video/mp4',
          MajorBrand: 'MP4  Base Media v1 [IS0 14496-12:2003]',
          MinorVersion: '0.2.0',
          CompatibleBrands: [ 'isom', 'iso2', 'avc1', 'mp41' ],
          MovieDataSize: 0,
          MovieDataOffset: 1051515,
          MovieHeaderVersion: 0,
          CreateDate:
           { year: 1970,
             month: 1,
             day: 8,
             hour: 0,
             minute: 0,
             second: 0,
             millisecond: 0,
             rawValue: '1970:01:08 00:00:00' },
          ModifyDate:
           { year: 2014,
             month: 7,
             day: 19,
             hour: 17,
             minute: 15,
             second: 29,
             millisecond: 0,
             rawValue: '2014:07:19 17:15:29' },
          TimeScale: 1000,
          PreferredRate: 1,
          PreferredVolume: '100.00%',
          PreviewTime: '0 s',
          PosterTime: '0 s',
          SelectionTime: '0 s',
          CurrentTime: '0 s',
          NextTrackID: 3,
          TrackHeaderVersion: 0,
          TrackCreateDate: '0000:00:00 00:00:00',
          TrackModifyDate: '0000:00:00 00:00:00',
          TrackID: 1,
          TrackLayer: 0,
          TrackVolume: '0.00%',
          ImageWidth: 1280,
          ImageHeight: 720,
          GraphicsMode: 'srcCopy',
          OpColor: '0 0 0',
          CompressorID: 'avc1',
          SourceImageWidth: 1280,
          SourceImageHeight: 720,
          XResolution: 72,
          YResolution: 72,
          BitDepth: 24,
          VideoFrameRate: 25,
          MatrixStructure: '1 0 0 0 1 0 0 0 1',
          MediaHeaderVersion: 0,
          MediaCreateDate: '0000:00:00 00:00:00',
          MediaModifyDate: '0000:00:00 00:00:00',
          MediaTimeScale: 48000,
          MediaLanguageCode: 'und',
          HandlerDescription: 'SoundHandler',
          Balance: 0,
          AudioFormat: 'mp4a',
          AudioChannels: 2,
          AudioBitsPerSample: 16,
          AudioSampleRate: 48000,
          HandlerType: 'Metadata',
          HandlerVendorID: 'Apple',
          Encoder: 'Lavf53.24.2',
          Title: 'Sample title test',
          Composer: 'th',
          BeatsPerMinute: '',
          ContentCreateDate: 2018,
          Genre: 'this',
          Artist: 'hhj',
          Comment: 'hhk',
          Subtitle: 'jj',
          Mood: 'lik',
          ContentDistributor: 'cont',
          Conductor: 'jo',
          Writer: 'writ',
          InitialKey: 'ho',
          Producer: 'prod',
          ParentalRating: 'par',
          Director: 'dir',
          Period: 'pol',
          Publisher: 'pub',
          PromotionURL: 'prom',
          AuthorURL: 'auth',
          EncodedBy: 'enc',
          Category: 'h',
          ImageSize: '1280x720',
          Megapixels: 0.922,
          AvgBitrate: '1.58 Mbps',
          Rotation: 0 },
       processingStatus: false,
       video_codec_name: 'h264',
       video_resolution: '720p' }
  


