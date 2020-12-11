/* eslint-disable */
function filterBySize(file, lowerBound, upperBound) {
  try {
    if (
      file.file_size / 1000 >= lowerBound &&
      file.file_size / 1000 <= upperBound
    ) {
      var response = {
        outcome: true,
        note: `☑File size is within filter limits. \n`,
      };
      return response;
    } else {
      var response = {
        outcome: false,
        note: `☒File size is not within filter limits. \n`,
      };
      return response;
    }
  } catch (err) {
    var response = {
      outcome: false,
      note: `library.filters.filterBySize error: ${err} \n`,
    };
    return response;
  }
}

module.exports = filterBySize;
