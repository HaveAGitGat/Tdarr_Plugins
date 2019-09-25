# Tdarr_Plugins

Steps for creating a Tdarr community or local plugin.

1.
Download Tdarr_Plugin_nc7x_Example.js from the following repository:

https://github.com/HaveAGitGat/Tdarr_Plugin_nc7x_Example


2.
Determine an id for your plugin. Every id must start with 'Tdarr_Plugin_xxxx' where xxxx is a random mini id containing the following:
    Numeric digits (0-9)
    Uppercase letters (A-Z)
    Lowercase letters (a-z)
    
    
The rest of the plugin id can be whatever you like. See the plugins folder for examples:
https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/Community

Your plugin id inside the file must be exactly the same as the plugin filename.

3.
Update the rest of the plugin details inisde 'function details()' in the plugin.

4.
(If local plugin, skip)
For the plugin link, you need to create a new github repository for your plugin. This is so that others can commit bug fixes etc and star your repo if they like it which will show on the Tdarr community plugins tab.

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
  
  
  Please see the bottom of this README for the structure of an example file object:
  
 
 6.
 Once you have finished configuring your plugin, 
 
 For community plugins:
 Create a pull request to have your plugin added to:
 https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/Community
 
 For local plugins:
Add them to 'User\Documents\Tdarr\Plugins\Local'. In Tdarr, select 'Local' in the plugin section of the library you're in and add your local plugin id.
  
 
     Example file object:
      { _id: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
       DB: 'ZRPDmnmpyuAEQi7nG',
       HealthCheck: 'Not attempted',
       TranscodeDecisionMaker: 'Not attempted',
       bit_rate: 1689273.6,
       container: 'mp4',
       createdAt: 2019-09-25T21:28:36.411Z,
       ffProbeData: { streams: [ [Object], [Object] ] },
       ffProbeRead: 'success',
       file: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
       fileMedium: 'video',
       file_size: 1.055796,
       meta:
        { SourceFile: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
          errors: [],
          Duration: 5.312,
          PreviewDuration: 0,
          SelectionDuration: 0,
          TrackDuration: 5.28,
          MediaDuration: 5.312,
          ExifToolVersion: 11.65,
          FileName: 'SampleVideo.mp4',
          Directory: 'C:/Users/H/Desktop/Test Input1',
          FileSize: '1031 kB',
          FileModifyDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 24,
             second: 13,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:24:13+01:00' },
          FileAccessDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 24,
             second: 13,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:24:13+01:00' },
          FileCreateDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 23,
             second: 18,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:23:18+01:00' },
          FilePermissions: 'rw-rw-rw-',
          FileType: 'MP4',
          FileTypeExtension: 'mp4',
          MIMEType: 'video/mp4',
          MajorBrand: 'MP4  Base Media v1 [IS0 14496-12:2003]',
          MinorVersion: '0.2.0',
          CompatibleBrands: [ 'isom', 'iso2', 'avc1', 'mp41' ],
          MovieDataSize: 1051459,
          MovieDataOffset: 48,
          MovieHeaderVersion: 0,
          CreateDate: '0000:00:00 00:00:00',
          ModifyDate: '0000:00:00 00:00:00',
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
          PixelAspectRatio: '1:1',
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
          Encoder: 'Lavf58.24.101',
          ImageSize: '1280x720',
          Megapixels: 0.922,
          AvgBitrate: '1.58 Mbps',
          Rotation: 0 },
       processingStatus: false,
       video_codec_name: 'h264',
       video_resolution: '720p' }
     { _id: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
       DB: 'ZRPDmnmpyuAEQi7nG',
       HealthCheck: 'Not attempted',
       TranscodeDecisionMaker: 'Not attempted',
       bit_rate: 1689273.6,
       container: 'mp4',
       createdAt: 2019-09-25T21:28:36.411Z,
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
               tags: { language: 'und', handler_name: 'VideoHandler' } },
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
               max_bit_rate: '384828',
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
               tags: { language: 'und', handler_name: 'SoundHandler' } } ] },
       ffProbeRead: 'success',
       file: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
       fileMedium: 'video',
       file_size: 1.055796,
       meta:
        { SourceFile: 'C:/Users/H/Desktop/Test Input1/SampleVideo.mp4',
          errors: [],
          Duration: 5.312,
          PreviewDuration: 0,
          SelectionDuration: 0,
          TrackDuration: 5.28,
          MediaDuration: 5.312,
          ExifToolVersion: 11.65,
          FileName: 'SampleVideo.mp4',
          Directory: 'C:/Users/H/Desktop/Test Input1',
          FileSize: '1031 kB',
          FileModifyDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 24,
             second: 13,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:24:13+01:00' },
          FileAccessDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 24,
             second: 13,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:24:13+01:00' },
          FileCreateDate:
           { year: 2019,
             month: 9,
             day: 25,
             hour: 22,
             minute: 23,
             second: 18,
             millisecond: 0,
             tzoffsetMinutes: 60,
             rawValue: '2019:09:25 22:23:18+01:00' },
          FilePermissions: 'rw-rw-rw-',
          FileType: 'MP4',
          FileTypeExtension: 'mp4',
          MIMEType: 'video/mp4',
          MajorBrand: 'MP4  Base Media v1 [IS0 14496-12:2003]',
          MinorVersion: '0.2.0',
          CompatibleBrands: [ 'isom', 'iso2', 'avc1', 'mp41' ],
          MovieDataSize: 1051459,
          MovieDataOffset: 48,
          MovieHeaderVersion: 0,
          CreateDate: '0000:00:00 00:00:00',
          ModifyDate: '0000:00:00 00:00:00',
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
          PixelAspectRatio: '1:1',
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
          Encoder: 'Lavf58.24.101',
          ImageSize: '1280x720',
          Megapixels: 0.922,
          AvgBitrate: '1.58 Mbps',
          Rotation: 0 },
       processingStatus: false,
       video_codec_name: 'h264',
       video_resolution: '720p' }
  


