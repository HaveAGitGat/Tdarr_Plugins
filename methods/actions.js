const importFresh = require('./node_modules/import-fresh');

module.exports.remuxContainer = importFresh(
  './library/actions/remuxContainer.js',
);
module.exports.transcodeStandardiseAudioCodecs = importFresh(
  './library/actions/transcodeStandardiseAudioCodecs.js',
);
module.exports.transcodeAddAudioStream = importFresh(
  './library/actions/transcodeAddAudioStream.js',
);
module.exports.transcodeKeepOneAudioStream = importFresh(
  './library/actions/transcodeKeepOneAudioStream.js',
);
