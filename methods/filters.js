const importFresh = require('./node_modules/import-fresh');

module.exports.filterByAge = importFresh('./library/filters/filterByAge.js');
module.exports.filterByCodec = importFresh(
  './library/filters/filterByCodec.js',
);
module.exports.filterByMedium = importFresh(
  './library/filters/filterByMedium.js',
);
module.exports.filterByResolution = importFresh(
  './library/filters/filterByResolution.js',
);
module.exports.filterBySize = importFresh('./library/filters/filterBySize.js');
module.exports.filterByBitrate = importFresh('./library/filters/filterByBitrate.js');
