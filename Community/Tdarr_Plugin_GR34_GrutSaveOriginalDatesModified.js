//const path = require('path/posix');

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
function details() {
  return {
    id: 'Tdarr_Plugin_GR34_GrutSaveOriginalDatesModified',
    Stage: 'Pre-processing',
    Name: 'Grut-Save original dates',
    Type: 'AudDateDio',
    Operation: 'Save',
    Description: 'This plugin saves dates (atime/mtime) of the original media to a JSON file. Should be used as the FIRST plugin in the stack. To restore the original date after transcoding, use Tdarr_Plugin_GR34_GrutRestoreOriginalDates.\n\n',
    Version: '0.1',
    Link: '',
    Tags: 'pre-processing,save,original,date',
    Inputs: [
      {
        name: 'outputDirectory',
        tooltip: `Specify the directory where you want to save the JSON files.`,
      },
      {
        name: 'debug',
        tooltip: `Print some debug output in node log (i.e., docker logs...).\nOptional.\nExample:\ntrue\nExample:\nfalse\nDefault:\nfalse`,
      },
    ],
  };
}

function print_debug(debug, message) {
  const prefix = new Date().toISOString() + ' - Tdarr_Plugin_GR34_GrutSaveOriginalDatesModified - ';
  if (debug) console.log(prefix + message);
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const fs = require('fs');
  const path = require('path');

  let debug = false;
  if (inputs && inputs.debug && inputs.debug.toLowerCase() === 'true') debug = true;

  const outputDirectory = inputs && inputs.outputDirectory ? inputs.outputDirectory : '';

  // Parse the file property to get the path and the filename
  const parsed_file = path.parse(file.file);

  // If the file being processed is a cache file, don't save the dates.
  // We do it only for the actual file being transcoded)
  if (parsed_file.name.includes('-TdarrCacheFile-')) {
    print_debug(debug, '###### This is a temp file. Don\'t save dates ' + file.file);
  } else {
    print_debug(debug, '###### Saving original dates for ' + file.file);
    print_debug(debug, 'Original atime = ' + file.statSync.atime);
    print_debug(debug, 'Original mtime = ' + file.statSync.mtime);

    // Create a subfolder named the same as the filename without the extension
    const subfolder = path.join(outputDirectory, parsed_file.name);
    if (!fs.existsSync(subfolder)) {
      fs.mkdirSync(subfolder);
    }

    const date_file = path.join(subfolder, `${parsed_file.name}.dates`);

    print_debug(debug, 'Save dates in ' + date_file);

    try {
      // Convert JSON object to a string
      const data = JSON.stringify(file.statSync, null, 4);

      // Write file to disk
      fs.writeFileSync(date_file, data, 'utf8');

      print_debug(debug, `File is written successfully!`);
    } catch (err) {
      print_debug(debug, `Error writing file: ${err}`);
    }
    print_debug(debug, '###### End Processing ' + file.file);
  }
  print_debug(debug, '');
  print_debug(debug, '');
  response.processFile = false;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
