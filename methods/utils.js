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

const conditionMet = (inputsArr, value, condition) => {
  for (let j = 0; j < inputsArr.length; j += 1) {
    try {
      switch (condition) {
        case '==':
          if (inputsArr[j] === String(value)) {
            return true;
          }
          break;
        case '!=':
          if (inputsArr[j] !== String(value)) {
            return true;
          }
          break;
        case '>':
          if (inputsArr[j] > Number(value)) {
            return true;
          }
          break;
        case '>=':
          if (inputsArr[j] >= Number(value)) {
            return true;
          }
          break;
        case '<':
          if (inputsArr[j] < Number(value)) {
            return true;
          }
          break;

        case '<=':
          if (inputsArr[j] <= Number(value)) {
            return true;
          }
          break;
        case 'includes':
          if (String(value).includes(inputsArr[j])) {
            return true;
          }
          break;
        case 'not includes':
          if (!String(value).includes(inputsArr[j])) {
            return true;
          }
          break;
        default:
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  return false;
};

module.exports = {
  strHasValue,
  conditionMet,
};
