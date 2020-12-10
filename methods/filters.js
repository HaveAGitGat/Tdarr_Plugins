/* eslint-disable */
var fs = require("fs");
var path = require("path");
if (fs.existsSync(path.join(process.cwd(), "/npm"))) {
  var rootModules = path.join(process.cwd(), "/npm/node_modules/");
} else {
  var rootModules = "";
}
const importFresh = require(rootModules + "import-fresh");

module.exports.filterByAge = importFresh("./library/filters/filterByAge.js");
module.exports.filterByCodec = importFresh(
  "./library/filters/filterByCodec.js"
);
module.exports.filterByMedium = importFresh(
  "./library/filters/filterByMedium.js"
);
module.exports.filterByResolution = importFresh(
  "./library/filters/filterByResolution.js"
);
module.exports.filterBySize = importFresh("./library/filters/filterBySize.js");
