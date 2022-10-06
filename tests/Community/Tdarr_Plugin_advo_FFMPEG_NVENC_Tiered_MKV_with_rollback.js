/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        upperBound: '90',
        hevcBitrateCutoff: '2000',
        h264BitrateCutoff: '1000',
        sdCQV: '21',
        sdMaxBitrate: '0',
        hdCQV: '23',
        hdMaxBitrate: '0',
        fullhdCQV: '25',
        fullhdMaxBitrate: '0',
        uhdCQV: '27',
        uhdMaxBitrate: '0',
        bframe: '5',
      },
      otherArguments: { originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')) },
    },
    output: {
      processFile: true,
      preset: '-c:v h264_cuvid<io> -map 0 -c copy  -dn -c:v hevc_nvenc -profile:v main10 -preset p5 -tune hq -pix_fmt p010le  -rc:v vbr -multipass 2 -bufsize 600M -b:v 0 -maxrate:v 0 -qmin 0 -qmax 23 -cq:v 23 -rc-lookahead 32 -nonref_p 1 -a53cc 0 -threads 0  -bf 5 -b_ref_mode 1 -temporal_aq:v 1 -aq-strength:v 8    -metadata ADVOVTRANSCODEDONE=true',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ BitRate: undefined \n'
        + '☑ OverallBitRate: undefined \n'
        + '☑ BitRate_Maximum: undefined \n'
        + '☑ bit_rate: 1591143 \n'
        + '☑File is a video! \n'
        + '☑ Codec: h264 \n'
        + '☒File is 720p!\n'
        + '☒File is not hevc!\n'
        + '☒File bitrate is 1553kb!\n'
        + 'File bitrate is HIGHER than the Default Target Bitrate!\n'
        + '☒Target Bitrate set to 0kb!\n'
        + 'File is being transcoded!\n',
      maxmux: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        upperBound: '90',
        hevcBitrateCutoff: '2000',
        h264BitrateCutoff: '1000',
        sdCQV: '21',
        sdMaxBitrate: '0',
        hdCQV: '23',
        hdMaxBitrate: '0',
        fullhdCQV: '25',
        fullhdMaxBitrate: '0',
        uhdCQV: '27',
        uhdMaxBitrate: '0',
        bframe: '5',
      },
      otherArguments: { originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')) },
    },
    output: {
      processFile: true,
      preset: '-c:v hevc_cuvid<io> -map 0 -c copy  -dn -c:v hevc_nvenc -profile:v main10 -preset p5 -tune hq -pix_fmt p010le  -rc:v vbr -multipass 2 -bufsize 600M -b:v 0 -maxrate:v 0 -qmin 0 -qmax 25 -cq:v 25 -rc-lookahead 32 -nonref_p 1 -a53cc 0 -threads 0  -bf 5 -b_ref_mode 1 -temporal_aq:v 1 -aq-strength:v 8    -metadata ADVOVTRANSCODEDONE=true',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ BitRate: undefined \n'
        + '☑ OverallBitRate: undefined \n'
        + '☑ BitRate_Maximum: undefined \n'
        + '☑ bit_rate: 3207441 \n'
        + '☑File is a video! \n'
        + '☑ Codec: hevc \n'
        + '☒File is 1080p!\n'
        + '☒File is hevc, but above cutoff!\n'
        + '☒File bitrate is 3132kb!\n'
        + 'File bitrate is HIGHER than the Default Target Bitrate!\n'
        + '☒Target Bitrate set to 0kb!\n'
        + 'File is being transcoded!\n',
      maxmux: false,
    },
  },
];

run(tests);
