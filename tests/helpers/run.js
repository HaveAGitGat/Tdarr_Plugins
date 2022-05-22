const path = require('path');
const chai = require('chai');
const _ = require('lodash');
const importFresh = require('import-fresh');

const scriptName = path.basename(process.mainModule.filename);

const run = async (tests) => {
  try {
    for (let i = 0; i < tests.length; i += 1) {
      // eslint-disable-next-line no-console
      console.log(`${scriptName}: test ${i}`);
      const test = tests[i];

      let testOutput;
      let errorEncountered = false;
      // eslint-disable-next-line import/no-dynamic-require
      const { plugin } = importFresh(`../../Community/${scriptName}`);

      try {
        // eslint-disable-next-line no-await-in-loop
        testOutput = await plugin(
          _.cloneDeep(test.input.file),
          _.cloneDeep(test.input.librarySettings),
          _.cloneDeep(test.input.inputs),
          _.cloneDeep(test.input.otherArguments),
        );
      } catch (err1) {
        errorEncountered = err1;
      }

      if (test.outputModify) {
        testOutput = test.outputModify(test.output);
      }

      if (test.error && test.error.shouldThrow) {
        if (errorEncountered !== false) {
          // eslint-disable-next-line no-console
          console.log(errorEncountered);
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
