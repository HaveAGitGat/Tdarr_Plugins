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

      let testOutput;
      let errorEncountered = false;
      try {
        // eslint-disable-next-line no-await-in-loop
        testOutput = await plugin(
          file,
          test.input.librarySettings,
          test.input.inputs,
          test.input.otherArguments,
        );
      } catch (err1) {
        // eslint-disable-next-line no-console
        console.error(err1);
        errorEncountered = err1;
      }

      if (test.error && test.error.shouldThrow) {
        if (errorEncountered !== false) {
          chai.assert.deepEqual(errorEncountered.message, test.output);
        } else {
          throw new Error('Expected plugin error but none was thrown!');
        }
      } else {
        chai.assert.deepEqual(testOutput, test.output);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
};

module.exports = run;
