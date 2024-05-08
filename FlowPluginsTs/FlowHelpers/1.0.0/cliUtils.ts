import { editreadyParser, ffmpegParser, handbrakeParser } from './cliParsers';
import { Ilog, IupdateWorker } from './interfaces/interfaces';
import { IFileObject, Istreams } from './interfaces/synced/IFileObject';

const fs = require('fs');

const fancyTimeFormat = (time: number) => {
  // Hours, minutes and seconds

  // eslint-disable-next-line no-bitwise
  const hrs = ~~(time / 3600);
  // eslint-disable-next-line no-bitwise
  const mins = ~~((time % 3600) / 60);
  // eslint-disable-next-line no-bitwise
  const secs = ~~time % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = '';

  //  if (hrs > 0) {
  ret += `${hrs}:${mins < 10 ? '0' : ''}`;
  // }

  ret += `${mins}:${secs < 10 ? '0' : ''}`;
  ret += `${secs}`;
  return ret;
};

// frame=  889 fps=106 q=26.0 Lsize=   25526kB time=00:00:35.69 bitrate=5858.3kbits/s speed=4.25x
export const getFFmpegVar = ({
  str,
  variable,
}: {
  str: string, variable: string
}): string => {
  if (typeof str !== 'string') {
    return '';
  }

  const idx = str.indexOf(variable);

  let out = '';
  let initSpacesEnded = false;

  if (idx >= 0) {
    const startIdx = idx + variable.length + 1;
    for (let i = startIdx; i < str.length; i += 1) {
      if (initSpacesEnded === true && str[i] === ' ') {
        break;
      } else if (initSpacesEnded === false && str[i] !== ' ') {
        initSpacesEnded = true;
      }

      if (initSpacesEnded === true && str[i] !== ' ') {
        out += str[i];
      }
    }
  }

  return out;
};

interface Iconfig {
  cli: string,
  spawnArgs: string[],
  spawnOpts: Record<string, unknown>,
  jobLog: Ilog,
  outputFilePath: string,
  updateWorker: IupdateWorker,
  logFullCliOutput: boolean,
  inputFileObj: IFileObject,
}

class CLI {
  // @ts-expect-error init
  config: Iconfig = {};

  progAVG: number[] = [];

  oldOutSize = 0;

  oldEstSize = 0;

  oldProgress = 0;

  lastProgCheck = 0;

  hbPass = 0;

  constructor(config: Iconfig) {
    this.config = config;
  }

  updateETA = (perc: number): void => {
    if (perc > 0) {
      if (this.lastProgCheck === 0) {
        this.lastProgCheck = new Date().getTime();
        this.oldProgress = perc;
      } else if (perc !== this.oldProgress) {
        const n = new Date().getTime();
        const secsSinceLastCheck = (n - this.lastProgCheck) / 1000;

        if (secsSinceLastCheck > 1) {
          // eta total
          let eta = Math.round(
            (100 / (perc - this.oldProgress)) * secsSinceLastCheck,
          );

          // eta remaining
          eta *= ((100 - perc) / 100);
          this.progAVG.push(eta);

          // let values = [2, 56, 3, 41, 0, 4, 100, 23];
          const sum = this.progAVG.reduce(
            // eslint-disable-next-line
            (previous, current) => (current += previous),
          );
          const avg = sum / this.progAVG.length;

          // est size
          let estSize = 0;

          let outputFileSizeInGbytes;

          try {
            if (fs.existsSync(this.config.outputFilePath)) {
              let singleFileSize = fs.statSync(this.config.outputFilePath);
              singleFileSize = singleFileSize.size;
              outputFileSizeInGbytes = singleFileSize / (1024 * 1024 * 1024);

              if (outputFileSizeInGbytes !== this.oldOutSize) {
                this.oldOutSize = outputFileSizeInGbytes;
                estSize = outputFileSizeInGbytes
                  + ((100 - perc) / perc) * outputFileSizeInGbytes;
                this.oldEstSize = estSize;
              }
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(err);
          }

          this.config.updateWorker({
            ETA: fancyTimeFormat(avg),
            outputFileSizeInGbytes: outputFileSizeInGbytes === undefined ? 0 : outputFileSizeInGbytes,
            estSize: this.oldEstSize === undefined ? 0 : this.oldEstSize,
          });

          if (this.progAVG.length > 30) {
            this.progAVG.splice(0, 1);
          }

          this.lastProgCheck = n;
          this.oldProgress = perc;
        }
      }
    }
  };

  parseOutput = (data: string): void => {
    const str = `${data}`;
    //
    if (this.config.logFullCliOutput === true) {
      this.config.jobLog(str);
    }

    if (this.config.cli.toLowerCase().includes('handbrake')) {
      if (str.includes('task 1 of 2')) {
        this.hbPass = 1;
      } else if (str.includes('task 2 of 2')) {
        this.hbPass = 2;
      }

      const percentage = handbrakeParser({
        str,
        hbPass: this.hbPass,
      });

      if (percentage > 0) {
        this.updateETA(percentage);
        this.config.updateWorker({
          percentage,
        });
      }
    } else if (this.config.cli.toLowerCase().includes('ffmpeg')) {
      const n = str.indexOf('fps');
      const shouldUpdate = str.length >= 6 && n >= 6;

      const fps = parseInt(getFFmpegVar({
        str,
        variable: 'fps',
      }), 10);

      let frameCount = 0;

      try {
        // @ts-expect-error type
        const frameCountTmp = this.config.inputFileObj.ffProbeData?.streams
          .filter((row: Istreams) => row.codec_type === 'video')[0].nb_frames;

        if (frameCountTmp
        // @ts-expect-error type
          && !isNaN(frameCountTmp)) { // eslint-disable-line no-restricted-globals
          // @ts-expect-error type
          frameCount = frameCountTmp;
        }
      } catch (err) {
        // err
      }

      const percentage = ffmpegParser({
        str,
        frameCount,
        videoFrameRate: this.config.inputFileObj?.meta?.VideoFrameRate,
        ffprobeDuration: this.config.inputFileObj.ffProbeData?.format?.duration,
        metaDuration: this.config.inputFileObj?.meta?.Duration,
      });

      if (shouldUpdate === true && fps > 0) {
        this.config.updateWorker({
          fps,
        });
      }

      if (percentage > 0) {
        this.updateETA(percentage);
        this.config.updateWorker({
          percentage,
        });
      }
    } else if (this.config.cli.toLowerCase().includes('editready')) {
      const percentage = editreadyParser({
        str,
      });
      if (percentage > 0) {
        this.updateETA(percentage);
        this.config.updateWorker({
          percentage,
        });
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  killThread = (thread:any): void => {
    const killArray = [
      'SIGKILL',
      'SIGHUP',
      'SIGTERM',
      'SIGINT',
    ];

    try {
      thread.kill();
    } catch (err) {
      // err
    }

    killArray.forEach((com: string) => {
      try {
        thread.kill(com);
      } catch (err) {
        // err
      }
    });
  }

  runCli = async (): Promise<{
    cliExitCode: number,
    errorLogFull: string[],
  }> => {
    const childProcess = require('child_process');

    const errorLogFull: string[] = [];

    this.config.jobLog(`Running ${this.config.cli} ${this.config.spawnArgs.join(' ')}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    let thread: any;

    const exitHandler = () => {
      if (thread) {
        try {
        // eslint-disable-next-line no-console
          console.log('Main thread exiting, cleaning up running CLI');
          this.killThread(thread);
        } catch (err) {
        // eslint-disable-next-line no-console
          console.log('Error running cliUtils on Exit function');
          // eslint-disable-next-line no-console
          console.log(err);
        }
      }
    };

    process.on('exit', exitHandler);

    const cliExitCode: number = await new Promise((resolve) => {
      try {
        const opts = this.config.spawnOpts || {};
        const spawnArgs = this.config.spawnArgs.map((row) => row.trim()).filter((row) => row !== '');
        thread = childProcess.spawn(this.config.cli, spawnArgs, opts);

        thread.stdout.on('data', (data: string) => {
          errorLogFull.push(data.toString());
          this.parseOutput(data);
        });

        thread.stderr.on('data', (data: string) => {
          // eslint-disable-next-line no-console
          errorLogFull.push(data.toString());
          this.parseOutput(data);
        });

        thread.on('error', () => {
          // catches execution error (bad file)
          // eslint-disable-next-line no-console
          console.log(1, `Error executing binary: ${this.config.cli}`);
          resolve(1);
        });

        // thread.stdout.pipe(process.stdout);
        // thread.stderr.pipe(process.stderr);
        thread.on('close', (code: number) => {
          if (code !== 0) {
            // eslint-disable-next-line no-console
            console.log(code, 'CLI error');
          }
          resolve(code);
        });
      } catch (err) {
        // catches execution error (no file)
        // eslint-disable-next-line no-console
        console.log(1, `Error executing binary: ${this.config.cli}`);
        resolve(1);
      }
    });

    process.removeListener('exit', exitHandler);

    thread = undefined;

    if (!this.config.logFullCliOutput) {
      this.config.jobLog(errorLogFull.slice(-1000).join(''));
    }

    return {
      cliExitCode,
      errorLogFull,
    };
  };
}

export {
  CLI,
};
