var fs = require('fs');
var path = require("path");
if (fs.existsSync(path.join(process.cwd() + "/npm"))) {
    var rootModules = path.join(process.cwd() + '/npm/node_modules/')
} else{
    var rootModules = ''
}
const importFresh = require(rootModules+'import-fresh');


var remuxContainer = importFresh('./library/actions/remuxContainer.js')

module.exports.remuxContainer = remuxContainer
