const filterByCodec = (file, mode, codecs) => {
  try {
    // console.log(file,mode,codecs)

    const allCodecs = file.ffProbeData.streams.map((row) => row.codec_name);

    let included = false;

    for (let i = 0; i < allCodecs.length; i += 1) {
      if (codecs.toLowerCase().includes(allCodecs[i])) {
        included = true;
      }
    }

    if (mode === 'include') {
      if (included) {
        const response = {
          outcome: true,
          note: '☑Codec included \n',
        };
        return response;
      }
      const response = {
        outcome: false,
        note: '☒Codec excluded \n',
      };
      return response;
    } if (mode === 'exclude') {
      if (included) {
        const response = {
          outcome: false,
          note: '☒Codec excluded \n',
        };
        return response;
      }
      const response = {
        outcome: true,
        note: '☑Codec not excluded \n',
      };
      return response;
    }

    const response = {
      outcome: false,
      note: 'library.filters.filterByCodec error, no include/exclude specified \n',
    };
    return response;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    const response = {
      outcome: false,
      note: `Filter error hello! ${err}\n`,
    };
    return response;
  }
};

module.exports = filterByCodec;
