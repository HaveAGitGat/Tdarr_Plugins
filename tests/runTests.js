/* eslint no-console: 0 */ // --> OFF

const fs = require('fs');
const childProcess = require('child_process');

const filenames = fs.readdirSync(`${process.cwd()}/Community`);

const run = async () => {
  for (let i = 0; i < filenames.length; i += 1) {
    const pluginPath = `${process.cwd()}/Community/${filenames[i]}`;
    const text = fs.readFileSync(pluginPath);
    const pluginTestpath = `${__dirname}/Community/${filenames[i]}`;

    let shouldRunTest = true;
    if (!text.includes('// tdarrSkipTest') && !fs.existsSync(pluginTestpath)) {
      console.log(`${filenames[i]} does not have a test but should do.`);
      process.exit(1);
    } else if (!text.includes('// tdarrSkipTest') && fs.existsSync(pluginTestpath)) {
      console.log(`${filenames[i]} running test`);
    } else if (text.includes('// tdarrSkipTest') && fs.existsSync(pluginTestpath)) {
      console.log(`${filenames[i]} should have // tdarrSkipTest removed`);
      process.exit(1);
    } else if (text.includes('// tdarrSkipTest') && !fs.existsSync(pluginTestpath)) {
      console.log(`${filenames[i]} skipping tests`);
      shouldRunTest = false;
    }

    if (shouldRunTest) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        childProcess.exec(`node ${pluginTestpath}`, (err, stdout, stderr) => {
          if (err) {
            console.log(err);
          }
          console.log(stdout);
          console.log(stderr);
        }).on('exit', async (code) => {
          if (code !== 0) {
            await new Promise((resolve2) => setTimeout(resolve2, 1000));
            process.exit(1);
          } else {
            resolve();
          }
        });
      });
    }
  }
};

run();
