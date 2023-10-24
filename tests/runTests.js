/* eslint no-console: 0 */ // --> OFF

const fs = require('fs');
const chalk = require('chalk');
const childProcess = require('child_process');

const filenames = fs.readdirSync(`${process.cwd()}/Community`).reverse();

const errorsEncountered = [];
const run = () => {
  const pluginsToRun = [];
  for (let i = 0; i < filenames.length; i += 1) {
    const filename = filenames[i];
    const pluginPath = `${process.cwd()}/Community/${filename}`;
    const text = fs.readFileSync(pluginPath);
    const pluginTestpath = `${__dirname}/Community/${filename}`;

    if (!text.includes('// tdarrSkipTest') && !fs.existsSync(pluginTestpath)) {
      console.log(chalk.red(`${filename} does not have a test but should do.`));
      process.exit(1);
    } else if (!text.includes('// tdarrSkipTest') && fs.existsSync(pluginTestpath)) {
      pluginsToRun.push({
        filename,
        pluginTestpath,
      });
    } else if (text.includes('// tdarrSkipTest') && fs.existsSync(pluginTestpath)) {
      console.log(chalk.red(`${filename} should have // tdarrSkipTest removed`));
      process.exit(1);
    } else if (text.includes('// tdarrSkipTest') && !fs.existsSync(pluginTestpath)) {
      console.log(chalk.yellow(`${filename} skipping tests`));
    }
  }

  let pluginsFinished = 0;
  for (let i = 0; i < pluginsToRun.length; i += 1) {
    const { filename } = pluginsToRun[i];
    const { pluginTestpath } = pluginsToRun[i];
    console.log(chalk.white(`${filename} running test`));

    const output = {};
    childProcess.exec(`node "${pluginTestpath}"`, (err, stdout, stderr) => {
      if (err) {
        output.err = err;
      }
      output.stdout = stdout;
      output.stderr = stderr;
      // eslint-disable-next-line no-loop-func
    }).on('exit', async (code) => {
      if (code !== 0) {
        await new Promise((resolve2) => setTimeout(resolve2, 1000));
        errorsEncountered.push({
          id: filenames[i],
          ...output,
        });
      }

      pluginsFinished += 1;

      if (pluginsFinished === pluginsToRun.length) {
        if (errorsEncountered.length > 0) {
          errorsEncountered.forEach((plugin) => {
            console.log(plugin.id);
            console.log(chalk.red(plugin.err));
            console.log(plugin.stdout);
            console.log(chalk.red(plugin.stderr));
          });
          process.exit(1);
        } else {
          console.log(chalk.green('No errors encountered!'));
          process.exit(0);
        }
      }
    });
  }
};

void run();
