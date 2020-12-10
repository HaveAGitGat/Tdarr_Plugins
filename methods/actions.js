const fs = require('fs');
const path = require('path');

let rootModules;
if (fs.existsSync(path.join(process.cwd(), '/npm'))) {
  rootModules = path.join(process.cwd(), '/npm/node_modules/');
} else {
  rootModules = '';
}

// eslint-disable-next-line import/no-dynamic-require
const importFresh = require(`${rootModules}import-fresh`);

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
