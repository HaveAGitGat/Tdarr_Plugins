const importFresh = require('import-fresh');


var filterByAge = importFresh('./library/filters/filterByAge.js')
var filterByCodec = importFresh('./library/filters/filterByCodec.js')
var filterByMedium = importFresh('./library/filters/filterByMedium.js')
var filterByResolution = importFresh('./library/filters/filterByResolution.js')
var filterBySize = importFresh('./library/filters/filterBySize.js')



module.exports.filterByAge = filterByAge
module.exports.filterByCodec = filterByCodec
module.exports.filterByMedium = filterByMedium
module.exports.filterByResolution = filterByResolution
module.exports.filterBySize = filterBySize
