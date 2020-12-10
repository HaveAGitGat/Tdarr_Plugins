/* eslint-disable */
function filterByResolution(file, mode, resolution) {
  try {
    if (mode === "exclude") {
      if (
        resolution.toLowerCase().includes(file.video_resolution.toLowerCase())
      ) {
        var response = {
          outcome: false,
          note: `☒File is in excluded resolution. \n`,
        };
        return response;
      } else {
        var response = {
          outcome: true,
          note: `☑File is not in excluded resolution. \n`,
        };
        return response;
      }
    } else if (mode === "include") {
      if (
        resolution.toLowerCase().includes(file.video_resolution.toLowerCase())
      ) {
        var response = {
          outcome: true,
          note: `☑File is in included resolution. \n`,
        };
        return response;
      } else {
        var response = {
          outcome: false,
          note: `☒File is not in included resolution. \n`,
        };
        return response;
      }
    }
  } catch (err) {
    var response = {
      outcome: false,
      note: `library.filters.filterByResolution error: ${err} \n`,
    };
    return response;
  }
}

module.exports = filterByResolution;
