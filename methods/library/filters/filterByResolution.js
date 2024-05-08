const filterByResolution = (file, mode, resolution) => {
  try {
    if (mode === 'exclude') {
      if (
        resolution.toLowerCase().includes(file.video_resolution.toLowerCase())
      ) {
        const response = {
          outcome: false,
          note: '☒File is in excluded resolution. \n',
        };
        return response;
      }
      const response = {
        outcome: true,
        note: '☑File is not in excluded resolution. \n',
      };
      return response;
    } if (mode === 'include') {
      if (
        resolution.toLowerCase().includes(file.video_resolution.toLowerCase())
      ) {
        const response = {
          outcome: true,
          note: '☑File is in included resolution. \n',
        };
        return response;
      }
      const response = {
        outcome: false,
        note: '☒File is not in included resolution. \n',
      };
      return response;
    }
  } catch (err) {
    const response = {
      outcome: false,
      note: `library.filters.filterByResolution error: ${err} \n`,
    };
    return response;
  }

  throw new Error('Plugin error, no  filter mode specified');
};

module.exports = filterByResolution;
