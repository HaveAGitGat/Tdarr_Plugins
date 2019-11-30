var fs = require('fs');
var path = require("path");
if (fs.existsSync(path.join(process.cwd() + "/npm"))) {
    var rootModules = path.join(process.cwd() + '/npm/node_modules/')
} else{
    var rootModules = ''
}
const importFresh = require(rootModules+'import-fresh');


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
