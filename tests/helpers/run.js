const path = require('path');
const chai = require('chai');

const scriptName = path.basename(process.mainModule.filename);
// eslint-disable-next-line import/no-dynamic-require
const { plugin } = require(`../../Community/${scriptName}`);

const run = async (tests) => {
  try {
    for (let i = 0; i < tests.length; i += 1) {
      // eslint-disable-next-line no-console
      console.log(`${scriptName}: test ${i}`);
      const test = tests[i];
      let { file } = test.input;
      if (typeof test.input.file === 'function') {
        file = test.input.file();
      }
      // eslint-disable-next-line no-await-in-loop
      const testOutput = await plugin(
        file,
        test.input.librarySettings,
        test.input.inputs,
        test.input.otherArguments,
      );
      chai.assert.deepEqual(testOutput, test.output);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
};

module.exports = run;
