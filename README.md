<p align="center">
  <img src="https://s7.gifyu.com/images/GifCroppedTran.gif"/>
</p>


# Tdarr_Plugins

There are two types of plugin:

    Community: Plugins uploaded to this repo that anyone can use and will appear in the 'Plugins' tab in Tdarr.
    Local: Plugins only on your computer located in 'Plugins/Local' within your Tdarr documents folder.

Steps for creating a community or local plugin.

1. Copy the following pre and post-processing plugin examples:

https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Tdarr_Plugin_aaaa_Pre_Proc_Example.js

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
For the plugin link, I'll add this once you create a PR to community plugins.

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

Note, to access FFprobe inside a plugin, use this:

    const fs = require("fs");
    const path = require("path");
    let rootModules;
    if (fs.existsSync(path.join(process.cwd(), "/npm"))) {
        rootModules = path.join(process.cwd(), "/npm/node_modules/");
    } else {
        rootModules = "";
    }

    const ffprobePath = require(rootModules + 'ffprobe-static').path;
    //do something with ffprobe

Example file object:

     let file =                 {
                "meta": {
                    "SourceFile": "C:/Users/H/Desktop/Transcode/Source/SampleVideo_1280x720_30mb - Copy (5).mp4",
                    "errors": [],
                    "Duration": 170.902,
                    "PreviewDuration": 0,
                    "SelectionDuration": 0,
                    "TrackDuration": 170.861,
                    "MediaDuration": 170.901333333333,
                    "ExifToolVersion": 12.1,
                    "FileName": "SampleVideo_1280x720_30mb - Copy (5).mp4",
                    "Directory": "C:/Users/H/Desktop/Transcode/Source",
                    "FileSize": "16 MB",
                    "FileModifyDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 12,
                    "minute": 29,
                    "second": 11,
                    "millisecond": 0,
                    "tzoffsetMinutes": 60,
                    "rawValue": "2020:12:26 12:29:11+01:00"
                    },
                    "FileAccessDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 27,
                    "hour": 11,
                    "minute": 42,
                    "second": 53,
                    "millisecond": 0,
                    "tzoffsetMinutes": 60,
                    "rawValue": "2020:12:27 11:42:53+01:00"
                    },
                    "FileCreateDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 12,
                    "minute": 29,
                    "second": 22,
                    "millisecond": 0,
                    "tzoffsetMinutes": 60,
                    "rawValue": "2020:12:26 12:29:22+01:00"
                    },
                    "FilePermissions": "rw-rw-rw-",
                    "FileType": "MP4",
                    "FileTypeExtension": "mp4",
                    "MIMEType": "video/mp4",
                    "MajorBrand": "MP4 v2 [ISO 14496-14]",
                    "MinorVersion": "0.2.0",
                    "CompatibleBrands": [
                    "isom",
                    "iso2",
                    "avc1",
                    "mp41"
                    ],
                    "MediaDataSize": 16831682,
                    "MediaDataOffset": 48,
                    "MovieHeaderVersion": 0,
                    "CreateDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "ModifyDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "TimeScale": 1000,
                    "PreferredRate": 1,
                    "PreferredVolume": "100.00%",
                    "PreviewTime": "0 s",
                    "PosterTime": "0 s",
                    "SelectionTime": "0 s",
                    "CurrentTime": "0 s",
                    "NextTrackID": 3,
                    "TrackHeaderVersion": 0,
                    "TrackCreateDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "TrackModifyDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "TrackID": 1,
                    "TrackLayer": 0,
                    "TrackVolume": "0.00%",
                    "ImageWidth": 1280,
                    "ImageHeight": 720,
                    "GraphicsMode": "srcCopy",
                    "OpColor": "0 0 0",
                    "CompressorID": "avc1",
                    "SourceImageWidth": 1280,
                    "SourceImageHeight": 720,
                    "XResolution": 72,
                    "YResolution": 72,
                    "BitDepth": 24,
                    "PixelAspectRatio": "1:1",
                    "VideoFrameRate": 24.997,
                    "MatrixStructure": "1 0 0 0 1 0 0 0 1",
                    "MediaHeaderVersion": 0,
                    "MediaCreateDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "MediaModifyDate": {
                    "year": 2020,
                    "month": 12,
                    "day": 26,
                    "hour": 11,
                    "minute": 28,
                    "second": 53,
                    "millisecond": 0,
                    "rawValue": "2020:12:26 11:28:53"
                    },
                    "MediaTimeScale": 48000,
                    "MediaLanguageCode": "und",
                    "HandlerDescription": "Stereo",
                    "Balance": 0,
                    "AudioFormat": "mp4a",
                    "AudioChannels": 2,
                    "AudioBitsPerSample": 16,
                    "AudioSampleRate": 48000,
                    "Track2Name": "Stereo",
                    "Track2Title": "Stereo",
                    "HandlerType": "Metadata",
                    "HandlerVendorID": "Apple",
                    "Encoder": "HandBrake 1.3.3 2020061300",
                    "ImageSize": "1280x720",
                    "Megapixels": 0.922,
                    "AvgBitrate": "788 kbps",
                    "Rotation": 0
                },
                "mediaInfo": {
                    "@ref": "",
                    "track": [
                    {
                        "@type": "General",
                        "VideoCount": "1",
                        "AudioCount": "1",
                        "Format": "MPEG-4",
                        "Format_Profile": "Base Media",
                        "CodecID": "mp42",
                        "CodecID_Compatible": "isom/iso2/avc1/mp41",
                        "FileSize": "16965336",
                        "Duration": "170.902",
                        "OverallBitRate": "794155",
                        "FrameRate": "25.000",
                        "FrameCount": "4271",
                        "StreamSize": "133654",
                        "HeaderSize": "40",
                        "DataSize": "16831690",
                        "FooterSize": "133606",
                        "IsStreamable": "No",
                        "Encoded_Date": "UTC 2020-12-26 11:28:53",
                        "Tagged_Date": "UTC 2020-12-26 11:28:53",
                        "Encoded_Application": "HandBrake 1.3.3 2020061300"
                    },
                    {
                        "@type": "Video",
                        "StreamOrder": "0",
                        "ID": "1",
                        "Format": "AVC",
                        "Format_Profile": "Main",
                        "Format_Level": "4",
                        "Format_Settings_CABAC": "Yes",
                        "Format_Settings_RefFrames": "4",
                        "CodecID": "avc1",
                        "Duration": "170.861",
                        "BitRate": "627225",
                        "Width": "1280",
                        "Height": "720",
                        "Sampled_Width": "1280",
                        "Sampled_Height": "720",
                        "PixelAspectRatio": "1.000",
                        "DisplayAspectRatio": "1.778",
                        "Rotation": "0.000",
                        "FrameRate_Mode": "VFR",
                        "FrameRate": "25.000",
                        "FrameRate_Minimum": "16.393",
                        "FrameRate_Maximum": "25.000",
                        "FrameCount": "4271",
                        "ColorSpace": "YUV",
                        "ChromaSubsampling": "4:2:0",
                        "BitDepth": "8",
                        "ScanType": "Progressive",
                        "StreamSize": "13394380",
                        "Encoded_Library": "x264 - core 157 r2935 545de2f",
                        "Encoded_Library_Name": "x264",
                        "Encoded_Library_Version": "core 157 r2935 545de2f",
                        "Encoded_Library_Settings": "cabac=1 / ref=1 / deblock=1:0:0 / analyse=0x1:0x111 / me=hex / subme=2 / psy=1 / psy_rd=1.00:0.00 / mixed_ref=0 / me_range=16 / chroma_me=1 / trellis=0 / 8x8dct=0 / cqm=0 / deadzone=21,11 / fast_pskip=1 / chroma_qp_offset=0 / threads=22 / lookahead_threads=5 / sliced_threads=0 / nr=0 / decimate=1 / interlaced=0 / bluray_compat=0 / constrained_intra=0 / bframes=3 / b_pyramid=2 / b_adapt=1 / b_bias=0 / direct=1 / weightb=1 / open_gop=0 / weightp=1 / keyint=250 / keyint_min=25 / scenecut=40 / intra_refresh=0 / rc_lookahead=10 / rc=crf / mbtree=1 / crf=24.0 / qcomp=0.60 / qpmin=0 / qpmax=69 / qpstep=4 / vbv_maxrate=20000 / vbv_bufsize=25000 / crf_max=0.0 / nal_hrd=none / filler=0 / ip_ratio=1.40 / aq=1:1.00",
                        "Encoded_Date": "UTC 2020-12-26 11:28:53",
                        "Tagged_Date": "UTC 2020-12-26 11:28:53",
                        "colour_description_present": "Yes",
                        "colour_description_present_Source": "Stream",
                        "colour_range": "Limited",
                        "colour_range_Source": "Stream",
                        "colour_primaries": "BT.709",
                        "colour_primaries_Source": "Stream",
                        "transfer_characteristics": "BT.709",
                        "transfer_characteristics_Source": "Stream",
                        "matrix_coefficients": "BT.709",
                        "matrix_coefficients_Source": "Stream",
                        "extra": {
                        "CodecConfigurationBox": "avcC"
                        }
                    },
                    {
                        "@type": "Audio",
                        "StreamOrder": "1",
                        "ID": "2",
                        "Format": "AAC",
                        "Format_Settings_SBR": "No (Explicit)",
                        "Format_AdditionalFeatures": "LC",
                        "CodecID": "mp4a-40-2",
                        "Duration": "170.902",
                        "BitRate_Mode": "CBR",
                        "BitRate": "160902",
                        "Channels": "2",
                        "ChannelPositions": "Front: L R",
                        "ChannelLayout": "L R",
                        "SamplesPerFrame": "1024",
                        "SamplingRate": "48000",
                        "SamplingCount": "8203296",
                        "FrameRate": "46.875",
                        "FrameCount": "8011",
                        "Compression_Mode": "Lossy",
                        "StreamSize": "3437302",
                        "StreamSize_Proportion": "0.20261",
                        "Title": "Stereo",
                        "Default": "Yes",
                        "AlternateGroup": "1",
                        "Encoded_Date": "UTC 2020-12-26 11:28:53",
                        "Tagged_Date": "UTC 2020-12-26 11:28:53"
                    }
                    ]
                },
                "hasClosedCaptions": false,
                "container": "mp4",
                "ffProbeRead": "success",
                "ffProbeData": {
                    "streams": [
                    {
                        "index": 0,
                        "codec_name": "h264",
                        "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
                        "profile": "Main",
                        "codec_type": "video",
                        "codec_time_base": "170861/8542000",
                        "codec_tag_string": "avc1",
                        "codec_tag": "0x31637661",
                        "width": 1280,
                        "height": 720,
                        "coded_width": 1280,
                        "coded_height": 720,
                        "has_b_frames": 2,
                        "sample_aspect_ratio": "1:1",
                        "display_aspect_ratio": "16:9",
                        "pix_fmt": "yuv420p",
                        "level": 40,
                        "color_range": "tv",
                        "color_space": "bt709",
                        "color_transfer": "bt709",
                        "color_primaries": "bt709",
                        "chroma_location": "left",
                        "refs": 1,
                        "is_avc": "true",
                        "nal_length_size": "4",
                        "r_frame_rate": "50/1",
                        "avg_frame_rate": "4271000/170861",
                        "time_base": "1/90000",
                        "start_pts": 0,
                        "start_time": "0.000000",
                        "duration_ts": 15377490,
                        "duration": "170.861000",
                        "bit_rate": "627147",
                        "bits_per_raw_sample": "8",
                        "nb_frames": "4271",
                        "disposition": {
                        "default": 1,
                        "dub": 0,
                        "original": 0,
                        "comment": 0,
                        "lyrics": 0,
                        "karaoke": 0,
                        "forced": 0,
                        "hearing_impaired": 0,
                        "visual_impaired": 0,
                        "clean_effects": 0,
                        "attached_pic": 0,
                        "timed_thumbnails": 0
                        },
                        "tags": {
                        "creation_time": "2020-12-26T11:28:53.000000Z",
                        "language": "und",
                        "handler_name": "VideoHandler"
                        }
                    },
                    {
                        "index": 1,
                        "codec_name": "aac",
                        "codec_long_name": "AAC (Advanced Audio Coding)",
                        "profile": "LC",
                        "codec_type": "audio",
                        "codec_time_base": "1/48000",
                        "codec_tag_string": "mp4a",
                        "codec_tag": "0x6134706d",
                        "sample_fmt": "fltp",
                        "sample_rate": "48000",
                        "channels": 2,
                        "channel_layout": "stereo",
                        "bits_per_sample": 0,
                        "r_frame_rate": "0/0",
                        "avg_frame_rate": "0/0",
                        "time_base": "1/48000",
                        "start_pts": 0,
                        "start_time": "0.000000",
                        "duration_ts": 8202240,
                        "duration": "170.880000",
                        "bit_rate": "160902",
                        "max_bit_rate": "160902",
                        "nb_frames": "8011",
                        "disposition": {
                        "default": 1,
                        "dub": 0,
                        "original": 0,
                        "comment": 0,
                        "lyrics": 0,
                        "karaoke": 0,
                        "forced": 0,
                        "hearing_impaired": 0,
                        "visual_impaired": 0,
                        "clean_effects": 0,
                        "attached_pic": 0,
                        "timed_thumbnails": 0
                        },
                        "tags": {
                        "creation_time": "2020-12-26T11:28:53.000000Z",
                        "language": "und",
                        "handler_name": "Stereo"
                        }
                    }
                    ]
                },
                "file_size": 16.179405212402344,
                "bit_rate": 794155.0596248143,
                "video_resolution": "720p",
                "fileMedium": "video",
                "video_codec_name": "h264",
                "_id": "C:/Users/H/Desktop/Transcode/Source/SampleVideo_1280x720_30mb - Copy (5).mp4",
                "file": "C:/Users/H/Desktop/Transcode/Source/SampleVideo_1280x720_30mb - Copy (5).mp4",
                "DB": "WratRWZpe",
                "lastPluginDetails": "none",
                "processingStatus": false,
                "createdAt": "2020-12-27T10:42:55.642Z",
                "statSync": {
                    "dev": 3832468976,
                    "mode": 33206,
                    "nlink": 1,
                    "uid": 0,
                    "gid": 0,
                    "rdev": 0,
                    "blksize": 4096,
                    "ino": 5066549580826442,
                    "size": 16965336,
                    "blocks": 33136,
                    "atimeMs": 1609065774191.6953,
                    "mtimeMs": 1608982151506.065,
                    "ctimeMs": 1608982164201.0798,
                    "birthtimeMs": 1608982162081.075,
                    "atime": "2020-12-27T10:42:54.192Z",
                    "mtime": "2020-12-26T11:29:11.506Z",
                    "ctime": "2020-12-26T11:29:24.201Z",
                    "birthtime": "2020-12-26T11:29:22.081Z"
                },
                "history": ""
                }
