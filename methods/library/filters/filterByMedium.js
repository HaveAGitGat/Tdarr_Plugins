const filterByMedium = (file, medium) => {
  try {
    if (file.fileMedium !== medium) {
      const response = {
        outcome: false,
        note: `☒File is not ${medium} \n`,
      };
      return response;
    }
    const response = {
      outcome: true,
      note: `☑File is ${medium} \n`,
    };
    return response;
  } catch (err) {
    const response = {
      outcome: false,
      note: `library.filters.filterByMedium error: ${err} \n`,
    };
    return response;
  }
};

module.exports = filterByMedium;
