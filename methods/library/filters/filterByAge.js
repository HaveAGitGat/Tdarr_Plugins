const filterByAge = (file, ageCutOff_Seconds, type) => {
  try {
    const timeNow = new Date();
    const dateCreated = new Date(file.statSync.birthtime);
    const fileAge = Math.round((timeNow - dateCreated) / 1000);

    if ((type === 'exclude' && fileAge > ageCutOff_Seconds) || (type === 'include' && fileAge < ageCutOff_Seconds)) {
      const response = {
        outcome: false,
        note: 'File creation date is not within specified requirement. Wont process.  \n',
      };
      return response;
    }

    const response = {
      outcome: true,
      note: 'File creation date is within specified requirement. Will process. \n',
    };
    return response;
  } catch (err) {
    const response = {
      outcome: false,
      note: `library.filters.filterByAge error: ${err} \n`,
    };
    return response;
  }
};

module.exports = filterByAge;
