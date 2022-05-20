/* eslint no-console: 0 */ // --> OFF

const fs = require('fs');
const childProcess = require('child_process');

const filenames = fs.readdirSync(`${__dirname}/Community`);

const run = async () => {
  for (let i = 0; i < filenames.length; i += 1) {
    const path = `${__dirname}/Community/${filenames[i]}`;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      childProcess.exec(`node ${path}`, (err, stdout, stderr) => {
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
};

run();
