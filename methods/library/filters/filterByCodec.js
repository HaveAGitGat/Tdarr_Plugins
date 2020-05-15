function filterByCodec(file, mode, codecs) {
  try {
    // console.log(file,mode,codecs)

    var allCodecs = file.ffProbeData.streams.map((row) => row.codec_name);

    var included = false;

    for (var i = 0; i < allCodecs.length; i++) {
      if (codecs.toLowerCase().includes(allCodecs[i])) {
        included = true;
      }
    }

    if (mode === "include") {
      if (included) {
        var response = {
          outcome: true,
          note: `☑Codec included \n`,
        };
        return response;
      } else {
        var response = {
          outcome: false,
          note: `☒Codec excluded \n`,
        };
        return response;
      }
    } else if (mode === "exclude") {
      if (included) {
        var response = {
          outcome: false,
          note: `☒Codec excluded \n`,
        };
        return response;
      } else {
        var response = {
          outcome: true,
          note: `☑Codec not excluded \n`,
        };
        return response;
      }
    }

    var response = {
      outcome: false,
      note: `library.filters.filterByCodec error: ${err} \n`,
    };
    return response;
  } catch (err) {
    console.log(err);
    var response = {
      outcome: false,
      note: `Filter error hello! ${err}\n`,
    };
    return response;
  }
}

module.exports = filterByCodec;
