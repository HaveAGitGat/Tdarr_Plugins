import os from 'os';
import { IpluginInputArgs } from './interfaces/interfaces';

export const hasEncoder = async ({
  ffmpegPath,
  encoder,
  inputArgs,
  outputArgs,
  filter,
  args,
}: {
  ffmpegPath: string,
  encoder: string,
  inputArgs: string[],
  outputArgs: string[],
  filter: string,
  args: IpluginInputArgs,
}): Promise<boolean> => {
  const { spawn } = require('child_process');
  let isEnabled = false;
  try {
    const commandArr = [
      ...inputArgs,
      '-f',
      'lavfi',
      '-i',
      'color=c=black:s=256x256:d=1:r=30',
      ...(filter ? filter.split(' ') : []),
      '-c:v',
      encoder,
      ...outputArgs,
      '-f',
      'null',
      '/dev/null',
    ];

    args.jobLog(`Checking for encoder ${encoder} with command:`);
    args.jobLog(`${ffmpegPath} ${commandArr.join(' ')}`);

    isEnabled = await new Promise((resolve) => {
      const error = () => {
        resolve(false);
      };
      let stderr = '';

      try {
        const thread = spawn(ffmpegPath, commandArr);
        thread.on('error', () => {
          // catches execution error (bad file)
          error();
        });

        thread.stdout.on('data', (data: string) => {
          // eslint-disable-next-line  @typescript-eslint/no-unused-vars
          stderr += data;
        });

        thread.stderr.on('data', (data: string) => {
          // eslint-disable-next-line  @typescript-eslint/no-unused-vars
          stderr += data;
        });

        thread.on('close', (code: number) => {
          if (code !== 0) {
            error();
          } else {
            resolve(true);
          }
        });
      } catch (err) {
        // catches execution error (no file)
        error();
      }
    });

    args.jobLog(`Encoder ${encoder} is ${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }

  return isEnabled;
};

interface IgpuEncoder {
  encoder: string,
  enabled: boolean,

  inputArgs: string[],
  outputArgs: string[],
  filter: string,
}

// credit to UNCode101 for this
export const getBestNvencDevice = ({
  args,
  nvencDevice,
}: {
  args: IpluginInputArgs
  nvencDevice: IgpuEncoder,
}): IgpuEncoder => {
  const { execSync } = require('child_process');
  let gpu_num = -1;
  let lowest_gpu_util = 100000;
  let result_util = 0;
  let gpu_count = -1;
  let gpu_names = '';
  const gpus_to_exclude: string[] = [];
  //  inputs.exclude_gpus === '' ? [] : inputs.exclude_gpus.split(',').map(Number);
  try {
    gpu_names = execSync('nvidia-smi --query-gpu=name --format=csv,noheader');
    gpu_names = gpu_names.toString().trim();
    const gpu_namesArr = gpu_names.split(/\r?\n/);
    /* When nvidia-smi returns an error it contains 'nvidia-smi' in the error
      Example: Linux: nvidia-smi: command not found
               Windows: 'nvidia-smi' is not recognized as an internal or external command,
                   operable program or batch file. */
    if (!gpu_namesArr[0].includes('nvidia-smi')) {
      gpu_count = gpu_namesArr.length;
    }
  } catch (error) {
    args.jobLog('Error in reading nvidia-smi output! \n');
  }

  if (gpu_count > 0) {
    for (let gpui = 0; gpui < gpu_count; gpui += 1) {
      // Check if GPU # is in GPUs to exclude
      if (gpus_to_exclude.includes(String(gpui))) {
        args.jobLog(`GPU ${gpui}: ${gpu_names[gpui]} is in exclusion list, will not be used!\n`);
      } else {
        try {
          const cmd_gpu = `nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i ${gpui}`;
          result_util = parseInt(execSync(cmd_gpu), 10);
          if (!Number.isNaN(result_util)) { // != "No devices were found") {
            args.jobLog(`GPU ${gpui} : Utilization ${result_util}%\n`);

            if (result_util < lowest_gpu_util) {
              gpu_num = gpui;
              lowest_gpu_util = result_util;
            }
          }
        } catch (error) {
          args.jobLog(`Error in reading GPU ${gpui} Utilization\nError: ${error}\n`);
        }
      }
    }
  }
  if (gpu_num >= 0) {
    // eslint-disable-next-line no-param-reassign
    nvencDevice.inputArgs.push('-hwaccel_device', `${gpu_num}`);
    // eslint-disable-next-line no-param-reassign
    nvencDevice.outputArgs.push('-gpu', `${gpu_num}`);
  }

  return nvencDevice;
};

const encoderFilter = (encoder: string, targetCodec: string) => {
  if (targetCodec === 'hevc' && (encoder.includes('hevc') || encoder.includes('h265'))) {
    return true;
  } if (targetCodec === 'h264' && encoder.includes('h264')) {
    return true;
  } if (targetCodec === 'av1' && encoder.includes('av1')) {
    return true;
  }

  return false;
};

export interface IgetEncoder {
  encoder: string,
  inputArgs: string[],
  outputArgs: string[],
  isGpu: boolean,
  enabledDevices: IgpuEncoder[],
}

export const getEncoder = async ({
  targetCodec,
  hardwareEncoding,
  hardwareType,
  args,
}: {
  targetCodec: string,
  hardwareEncoding: boolean,
  hardwareType: string,
  args: IpluginInputArgs,
}): Promise<IgetEncoder> => {
  const supportedGpuEncoders = ['hevc', 'h264', 'av1'];

  if (
    args.workerType
    && args.workerType.includes('gpu')
    && hardwareEncoding && (supportedGpuEncoders.includes(targetCodec))) {
    const gpuEncoders: IgpuEncoder[] = [
      {
        encoder: 'hevc_nvenc',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'cuda',
        ],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'hevc_amf',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'hevc_qsv',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'qsv',
        ],
        outputArgs: [
          ...(os.platform() === 'win32' ? ['-load_plugin', 'hevc_hw'] : []),
        ],
        filter: '',
      },
      {
        encoder: 'hevc_vaapi',
        inputArgs: [
          '-hwaccel',
          'vaapi',
          '-hwaccel_device',
          '/dev/dri/renderD128',
          '-hwaccel_output_format',
          'vaapi',
        ],
        outputArgs: [],
        enabled: false,
        filter: '-vf format=nv12,hwupload',
      },
      {
        encoder: 'hevc_videotoolbox',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'videotoolbox',
        ],
        outputArgs: [],
        filter: '',
      },

      // h264
      {
        encoder: 'h264_nvenc',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'cuda',
        ],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'h264_amf',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'h264_qsv',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'qsv',
        ],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'h264_videotoolbox',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'videotoolbox',
        ],
        outputArgs: [],
        filter: '',
      },

      // av1
      {
        encoder: 'av1_nvenc',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'av1_amf',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'av1_qsv',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
      {
        encoder: 'av1_vaapi',
        enabled: false,
        inputArgs: [],
        outputArgs: [],
        filter: '',
      },
    ];

    const filteredGpuEncoders = gpuEncoders.filter((device) => encoderFilter(device.encoder, targetCodec));

    if (hardwareEncoding && hardwareType !== 'auto') {
      const idx = filteredGpuEncoders.findIndex((device) => device.encoder.includes(hardwareType));

      if (idx === -1) {
        throw new Error(`Could not find encoder ${targetCodec} for hardware ${hardwareType}`);
      }

      return {
        ...filteredGpuEncoders[idx],
        isGpu: true,
        enabledDevices: [],
      };
    }

    args.jobLog(JSON.stringify({ filteredGpuEncoders }));

    // eslint-disable-next-line no-restricted-syntax
    for (const gpuEncoder of filteredGpuEncoders) {
      // eslint-disable-next-line no-await-in-loop
      gpuEncoder.enabled = await hasEncoder({
        ffmpegPath: args.ffmpegPath,
        encoder: gpuEncoder.encoder,
        inputArgs: gpuEncoder.inputArgs,
        outputArgs: gpuEncoder.outputArgs,
        filter: gpuEncoder.filter,
        args,
      });
    }

    const enabledDevices = filteredGpuEncoders.filter((device) => device.enabled === true);

    args.jobLog(JSON.stringify({ enabledDevices }));

    if (enabledDevices.length > 0) {
      if (enabledDevices[0].encoder.includes('nvenc')) {
        const res = getBestNvencDevice({
          args,
          nvencDevice: enabledDevices[0],
        });

        return {
          ...res,
          isGpu: true,
          enabledDevices,
        };
      }
      return {
        encoder: enabledDevices[0].encoder,
        inputArgs: enabledDevices[0].inputArgs,
        outputArgs: enabledDevices[0].outputArgs,
        isGpu: true,
        enabledDevices,
      };
    }
  } else {
    if (!hardwareEncoding) {
      args.jobLog('Hardware encoding is disabled in plugin input options');
    }

    if (!args.workerType || !args.workerType.includes('gpu')) {
      args.jobLog('Worker type is not GPU');
    }

    if (!supportedGpuEncoders.includes(targetCodec)) {
      args.jobLog(`Target codec ${targetCodec} is not supported for GPU encoding`);
    }
  }

  if (targetCodec === 'hevc') {
    return {
      encoder: 'libx265',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    };
  } if (targetCodec === 'h264') {
    return {
      encoder: 'libx264',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    };
  } if (targetCodec === 'av1') {
    return {
      encoder: 'libsvtav1',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    };
  }

  return {
    encoder: targetCodec,
    inputArgs: [],
    outputArgs: [],
    isGpu: false,
    enabledDevices: [],
  };
};
