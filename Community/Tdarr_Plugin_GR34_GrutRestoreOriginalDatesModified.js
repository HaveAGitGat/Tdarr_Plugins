/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
function details() {
  return {
    id: "Tdarr_Plugin_GR34_GrutRestoreOriginalDatesModified",
    Stage: "Post-processing",
    Name: "Re-date the file according to the original file",
    Type: "Date",
    Operation: "Restore",
    Description: 'This plugin can restore dates (atime/mtime) of the original media from a JSON file. Should be used as LAST plugin in the stack. To save the original date, use Tdarr_Plugin_GR34_GrutSaveOriginalDates.\n\n',
    Version: '0.1',
    Link: '',
    Tags: 'post-processing,original,date,restore',
    Inputs: [
      {
        name: 'deleteDateFile',
        tooltip: `Delete the file where dates are saved after restore. (default : false)
              \\nOptional.
              \\nExample:\\n
              true
              \\nExample:\\n
              false
              \\nDefault:\\n
              false
              `,
      },
      {
        name: 'debug',
        tooltip: `print some debug output in node log (ie docker logs...).
              \\nOptional.
              \\nExample:\\n
              true
              \\nExample:\\n
              false
              \\nDefault:\\n
              false
              `,
      },
	  {
        name: 'rootDirectory',
        tooltip: `Directory where the JSON files are located, without subfolders
              \\nExample:\\n
              /mnt/Shared/Videos/Dates NOT /mnt/Shared/Videos/Dates/FileName
              \\nExample:\\n
              C:\mnt\Shared\Videos\Dates NOT C:\mnt\Shared\Videos\Dates\FileName
              \\nDefault:\\n
              false
              `,
      }
    ],
  };
}


function print_debug(debug, message) {
  const prefix = new Date().toISOString() + " - " + "Tdarr_Plugin_GR34_GrutRestoreOriginalDatesModified - ";
  if (debug)
    console.log(prefix + message);
}

function plugin(file, librarySettings, inputs) {
  const response = {
    file,
    removeFromDB: false,
    updateDB: true,
  };

  const fs = require('fs');
  const path = require('path');

  let debug = false;
  if (inputs && inputs.debug && inputs.debug.toLowerCase() === 'true')
    debug = true;

  const rootDirectory = inputs && inputs.rootDirectory ? inputs.rootDirectory : '';

  const parsed_file = path.parse(file.file);
  const dateFileName = `${parsed_file.name}.dates`;
  const date_file = path.join(rootDirectory, parsed_file.name, dateFileName);

  print_debug(debug, '###### Restoring original dates for ' + file.file);
  print_debug(debug, "Read dates from " + date_file);

  try {
    if (fs.existsSync(date_file)) {
      print_debug(debug, "The file exists.");
    } else {
      print_debug(debug, 'The file does not exist. Skipping..');
      return response;
    }
  } catch (err) {
    print_debug(debug, `Error while checking file existence the dates: ${err}`);
  }

  try {
    print_debug(debug, `test read file`);
    const data = fs.readFileSync(date_file, 'utf8');

    // parse JSON string to JSON object
    const infostats = JSON.parse(data);

    print_debug(debug, "Original atime = " + infostats.atime);
    print_debug(debug, "Original mtime = " + infostats.mtime);

    print_debug(debug, "Setting atime and mtime for " + file.file);
    print_debug(debug, "      atime=" + new Date(infostats.atime));
    print_debug(debug, "      mtime=" + new Date(infostats.mtime));
    
    fs.utimesSync(file.file, new Date(infostats.atime), new Date(infostats.mtime));
    
    if (inputs.deleteDateFile && inputs.deleteDateFile.toLowerCase() === 'true') {
      print_debug(debug, `Deleting file ${date_file}`);
      fs.unlinkSync(date_file);
      //file removed
    }

  } catch (err) {
    print_debug(debug, `Error reading or setting dates: ${err}`);
  }

  print_debug(debug, '###### End Processing ' + file.file);
  print_debug(debug, '');

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;