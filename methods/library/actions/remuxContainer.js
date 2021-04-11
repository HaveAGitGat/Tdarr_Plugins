/* eslint-disable */
function remuxContainer(file, container) {
  try {
    if (file.container != container) {
      var response = {
        processFile: true,
        note: `File is not in ${container} \n`,
      };
      return response;
    } else {
      var response = {
        processFile: false,
        note: `File is already in ${container} \n`,
      };
      return response;
    }
  } catch (err) {
    var response = {
      processFile: false,
      note: `library.actions.remuxContainer error: ${err} \n`,
    };
    return response;
  }
}

module.exports = remuxContainer;
