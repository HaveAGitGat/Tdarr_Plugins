const path = require('path');
const chai = require('chai');
const _ = require('lodash');
const importFresh = require('import-fresh');
const os = require('os');

const scriptName = path.basename(process.mainModule.filename);

const stackLog = (err) => {
  // eslint-disable-next-line no-console
  console.log(err);
  if (err.stack) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(err.stack));
  }
};

const run = async (tests) => {
  let errorsEncountered = false;

  for (let i = 0; i < tests.length; i += 1) {
    try {
      // eslint-disable-next-line no-console
      console.log(`[${os.platform()}] ${scriptName}: test ${i}`);
      const test = tests[i];

      let expectedOutput;
      if (test.output[os.platform()] !== undefined) {
        expectedOutput = test.output[os.platform()];
      } else {
        expectedOutput = test.output;
      }

      if (expectedOutput === false) {
        // skip test due to OS
        // eslint-disable-next-line no-console
        console.log(`Test not meant to run on ${os.platform()}, skipping`);
      } else {
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
          testOutput = test.outputModify(testOutput);
        }

        if (test?.error?.shouldThrow) {
          if (errorEncountered !== false) {
            stackLog(errorEncountered);
            chai.assert.deepEqual(errorEncountered.message, expectedOutput);
          } else {
            throw new Error('Expected plugin error but none was thrown!');
          }
        } else if (!test?.error?.shouldThrow && errorEncountered !== false) {
          stackLog(errorEncountered);
          throw new Error(`Unexpected plugin error!${errorEncountered}`);
        } else {
          chai.assert.deepEqual(testOutput, expectedOutput);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      stackLog(err);
      errorsEncountered = true;
    }
  }

  if (errorsEncountered) {
    process.exit(1);
  }
};

module.exports = run;
