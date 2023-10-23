/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        test: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi  <io> -max_muxing_queue_size 8000 -map 0:0  -c:v:0 hevc_vaapi  -vf " scale_vaapi=format=p010"  -b:v 964767  -map 0:1  -c:a:0 copy  -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE=2023-10-12T00:00:49.483Z  -map_chapters 0  ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Index 0 MediaInfo stream: 1 \nVideo stream 0:0:h264:1280x720x25:1205959bps \n'
      + 'Audio stream 1:???:aac:6:384000bps:First Audio Stream \n'
      + 'Pre Video Calc: 720, 1280, 25, 1843200 \nVideo existing Codex is h264, need to convert to hevc(10) \n'
      + 'Low source bitrate! \n'
      + 'Video existing Bitrate, 1205959, is close to, or lower than, target Bitrate, 1843200, with a codec change, using 80% of existing \n'
      + 'Post Video Calc: 720, 1280, 25, 964767 \n'
      + 'Using Unknown Audio Track !! \n'
      + 'File needs work. Transcoding. \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        test: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi  <io> -max_muxing_queue_size 8000 -map 0:0  -c:v:0 hevc_vaapi  -vf "fps=25, scale_vaapi=format=p010"  -b:v 4142880  -map 0:2  -c:a:0 aac -b:a 128000  -map 0:s -scodec copy  -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE=2023-10-12T00:00:49.483Z  -map_chapters 0  ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'StatsThres: 1696281941214, StatsDate: 1528998569000\n'
      + 'Index 0 MediaInfo stream: 1 \n'
      + 'Video stream 0:1:h264:1918x1080x25:6453995bps \n'
      + 'Audio stream 1:eng:flac:2:96000bps:First Audio Stream \n'
      + 'Audio stream 2:eng:ac3:2:192000bps:Higher Audio Rate \n'
      + 'Audio stream 3:eng:eac3:2:192000bps:Audio stream 4:???:aac:2:96000bps:First Audio Stream \n'
      + 'Audio stream 5:eng:aac:2:96000bps:SubTitles Found, will copy \n'
      + 'Pre Video Calc: 1080, 1918, 9999, 4142880 \n'
      + 'Video existing Codex is h264, need to convert to hevc(10) \n'
      + 'Video existing Bitrate, 6453995, is higher than target, 4142880, transcoding \n'
      + 'Post Video Calc: 1080, 1918, 9999, 4142880 \n'
      + 'Audio existing Bitrate, 192000, is higher than target, 128000 \n'
      + 'Audio Codec, ac3, is different than target, aac, Changing \n'
      + 'File needs work. Transcoding. \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
      librarySettings: {},
      inputs: {
        test: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi  <io> -max_muxing_queue_size 8000 -map 0:0  -c:v:0 hevc_vaapi  -vf "fps=25, scale_vaapi=format=p010"  -b:v 4142880  -map 0:2  -c:a:0 aac -b:a 128000  -map 0:s -scodec copy  -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE=2023-10-12T00:00:49.483Z  -map_chapters 0  ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'StatsThres: 1696281941214, StatsDate: 1528998569000\n'
      + 'Index 0 MediaInfo stream: 1 \n'
      + 'Video stream 0:1:h264:1918x1080x25:6453995bps \n'
      + 'Audio stream 1:eng:flac:2:96000bps:First Audio Stream \n'
      + 'Audio stream 2:eng:ac3:2:192000bps:Higher Audio Rate \n'
      + 'Audio stream 3:eng:eac3:2:192000bps:Audio stream 4:???:aac:2:96000bps:First Audio Stream \n'
      + 'Audio stream 5:eng:aac:2:96000bps:SubTitles Found, will copy \n'
      + 'Pre Video Calc: 1080, 1918, 9999, 4142880 \n'
      + 'Video existing Codex is h264, need to convert to hevc(10) \n'
      + 'Video existing Bitrate, 6453995, is higher than target, 4142880, transcoding \n'
      + 'Post Video Calc: 1080, 1918, 9999, 4142880 \n'
      + 'Audio existing Bitrate, 192000, is higher than target, 128000 \n'
      + 'Audio Codec, ac3, is different than target, aac, Changing \n'
      + 'File needs work. Transcoding. \n',
    },
  },

];

void run(tests);
