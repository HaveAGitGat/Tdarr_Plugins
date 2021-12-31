const importFresh = require('./node_modules/import-fresh');
// load library modules fresh so no Tdarr Server restart required between plugin updates
module.exports = () => importFresh('./library.js');
