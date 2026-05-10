const assert = require('assert/strict');
const _ = require('lodash');
const importFresh = require('import-fresh');
const fs = require('fs');

const sampleH264 = require('../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../sampleData/media/sampleH265_1.json');

const buildFile = (sample, filePath, codecName) => {
  const file = _.cloneDeep(sample);
  file._id = filePath;
  file.file = filePath;

  if (codecName) {
    file.ffProbeData.streams[0].codec_name = codecName;
  }

  return file;
};

const tests = [
  {
    file: buildFile(sampleH265, 'C:/Transcode/Source Folder/Movie_AVC.mkv'),
    expectedPath: 'C:/Transcode/Source Folder/Movie_HEVC.mkv',
  },
  {
    file: buildFile(sampleH264, 'C:/Transcode/Source Folder/Movie_AV1.mp4'),
    expectedPath: 'C:/Transcode/Source Folder/Movie_264.mp4',
  },
  {
    file: buildFile(sampleH264, 'C:/Transcode/Source Folder/Movie_x265.mkv', 'av1'),
    expectedPath: 'C:/Transcode/Source Folder/Movie_AV1.mkv',
  },
  {
    file: buildFile(sampleH264, 'C:/Transcode/AV1 Folder/Movie.mp4'),
    shouldRename: false,
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
      const expectedFile = _.cloneDeep(test.file);
      renameCalls.length = 0;

      // eslint-disable-next-line no-await-in-loop
      const result = await plugin(inputFile, {}, {}, {});

      if (test.shouldRename === false) {
        assert.equal(renameCalls.length, 0);
        assert.equal(result, undefined);
        assert.deepEqual(inputFile, expectedFile);
      } else {
        const originalPath = inputFile._id;

        expectedFile._id = test.expectedPath;
        expectedFile.file = test.expectedPath;

        assert.equal(renameCalls.length, 1);
        assert.deepEqual(renameCalls[0], {
          sourcePath: originalPath,
          targetPath: test.expectedPath,
          options: {
            overwrite: true,
          },
        });
        assert.deepEqual(result, {
          file: expectedFile,
          removeFromDB: false,
          updateDB: true,
        });
      }
    }
  } finally {
    fs.renameSync = originalRenameSync;
  }
};

void run();
