/* eslint-disable */
function filterByAge(file, ageCutOff_Seconds) {
  try {
    var timeNow = new Date();
    var dateCreated = new Date(file.statSync.birthtime);
    var fileAge = Math.round((timeNow - dateCreated) / 1000);

    if (fileAge > ageCutOff_Seconds) {
      var response = {
        outcome: false,
        note: `☒File creation date is older than specified requirement. \n`,
      };
      return response;
    } else {
      var response = {
        outcome: true,
        note: `☑File creation date is within specified requirement. \n`,
      };
      return response;
    }
  } catch (err) {
    var response = {
      outcome: false,
      note: `library.filters.filterByAge error: ${err} \n`,
    };
    return response;
  }
}

module.exports = filterByAge;
