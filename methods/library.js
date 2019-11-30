
var fs = require('fs');

if (fs.existsSync(path.join(process.cwd() + "/npm"))) {
    var rootModules = path.join(process.cwd() + '/npm/node_modules/')
} else{
    var rootModules = ''
}

const importFresh = require(rootModules+'import-fresh');

var filters = importFresh('./filters.js')
var actions = importFresh('./actions.js')

module.exports.filters = filters
module.exports.actions = actions

