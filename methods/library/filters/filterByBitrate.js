/* eslint-disable */
function filterByBitrate(file, lowerBound, upperBound) {
  try {
    if (
      file.bit_rate >= lowerBound &&
      file.bit_rate <= upperBound
    ) {
      var response = {
        outcome: true,
        note: `☑File bitrate is within filter limits. \n`,
      };
      return response;
    } else {
      var response = {
        outcome: false,
        note: `☒File bitrate is not within filter limits. \n`,
      };
      return response;
    }
  } catch (err) {
    var response = {
      outcome: false,
      note: `library.filters.filterByBitrate error: ${err} \n`,
    };
    return response;
  }
}

module.exports = filterByBitrate;
