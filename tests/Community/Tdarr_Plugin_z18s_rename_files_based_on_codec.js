const chai = require('chai');
const _ = require('lodash');
const importFresh = require('import-fresh');
const fs = require('fs');

const sampleH264 = require('../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../sampleData/media/sampleH265_1.json');

const tests = [
  {
    file: _.merge(_.cloneDeep(sampleH265), {
      _id: 'C:/Transcode/Source Folder/Movie_AVC.mkv',
      file: 'C:/Transcode/Source Folder/Movie_AVC.mkv',
    }),
    expectedPath: 'C:/Transcode/Source Folder/Movie_HEVC.mkv',
  },
  {
    file: _.merge(_.cloneDeep(sampleH264), {
      _id: 'C:/Transcode/Source Folder/Movie_AV1.mp4',
      file: 'C:/Transcode/Source Folder/Movie_AV1.mp4',
    }),
    expectedPath: 'C:/Transcode/Source Folder/Movie_264.mp4',
  },
  {
    file: _.merge(_.cloneDeep(sampleH264), {
      _id: 'C:/Transcode/Source Folder/Movie_x265.mkv',
      file: 'C:/Transcode/Source Folder/Movie_x265.mkv',
      ffProbeData: {
        streams: [
          {
            codec_name: 'av1',
          },
        ],
      },
    }),
    expectedPath: 'C:/Transcode/Source Folder/Movie_AV1.mkv',
  },
];

const run = async () => {
  const renameCalls = [];
  const originalRenameSync = fs.renameSync;

  fs.renameSync = (sourcePath, targetPath, options) => {
    renameCalls.push({
      sourcePath,
      targetPath,
      options,
    });
  };

  try {
    const { plugin } = importFresh('../../Community/Tdarr_Plugin_z18s_rename_files_based_on_codec.js');

    for (let i = 0; i < tests.length; i += 1) {
      const test = tests[i];
      const inputFile = _.cloneDeep(test.file);
      const originalPath = inputFile._id;
      renameCalls.length = 0;

      // eslint-disable-next-line no-await-in-loop
      const result = await plugin(inputFile, {}, {}, {});

      chai.assert.lengthOf(renameCalls, 1);
      chai.assert.deepEqual(renameCalls[0], {
        sourcePath: originalPath,
        targetPath: test.expectedPath,
        options: {
          overwrite: true,
        },
      });
      chai.assert.deepEqual(result, {
        file: {
          ...inputFile,
          _id: test.expectedPath,
          file: test.expectedPath,
        },
        removeFromDB: false,
        updateDB: true,
      });
    }
  } finally {
    fs.renameSync = originalRenameSync;
  }
};

void run();