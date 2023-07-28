const strHasValue = (inputsArr, value, exactMatch) => {
  let contains = false;

  for (let j = 0; j < inputsArr.length; j += 1) {
    try {
      if (
        (exactMatch && inputsArr[j] === String(value))
        || (!exactMatch && String(value).includes(inputsArr[j]))) {
        contains = true;
        break;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  return contains;
};

module.exports = {
  strHasValue,
};
