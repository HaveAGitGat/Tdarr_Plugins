import { IpluginInputArgs } from './interfaces/interfaces';

export const hasEncoder = async ({
  ffmpegPath,
  encoder,
  inputArgs,
  filter,
}: {
  ffmpegPath: string,
  encoder: string,
  inputArgs: string[],
  filter: string,
}): Promise<boolean> => {
  const { exec } = require('child_process');
  let isEnabled = false;
  try {
    isEnabled = await new Promise((resolve) => {
      const command = `${ffmpegPath} ${inputArgs.join(' ') || ''} -f lavfi -i color=c=black:s=256x256:d=1:r=30`
        + ` ${filter || ''}`
        + ` -c:v ${encoder} -f null /dev/null`;
      exec(command, (
        // eslint-disable-next-line
        error: any,
        // stdout,
        // stderr,
      ) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
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

const encoderFilter = (encoder:string, targetCodec:string) => {
  if (targetCodec === 'hevc' && (encoder.includes('hevc') || encoder.includes('h265'))) {
    return true;
  } if (targetCodec === 'h264' && encoder.includes('h264')) {
    return true;
  }

  return false;
};

export const getEncoder = async ({
  targetCodec,
  hardwareEncoding,
  args,
}: {
  targetCodec: string,
  hardwareEncoding: boolean,
  args: IpluginInputArgs,
}): Promise<{
  encoder: string,
  inputArgs: string[],
  outputArgs: string[],
  isGpu: boolean,
}> => {
  if (
    args.workerType
    && args.workerType.includes('gpu')
    && hardwareEncoding && (targetCodec === 'hevc' || targetCodec === 'h264')) {
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
        encoder: 'hevc_qsv',
        enabled: false,
        inputArgs: [
          '-hwaccel',
          'qsv',
        ],
        outputArgs: [],
        filter: '',
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
    ];

    const filteredGpuEncoders = gpuEncoders.filter((device) => encoderFilter(device.encoder, targetCodec));

    // eslint-disable-next-line no-restricted-syntax
    for (const gpuEncoder of filteredGpuEncoders) {
      // eslint-disable-next-line no-await-in-loop
      gpuEncoder.enabled = await hasEncoder({
        ffmpegPath: args.ffmpegPath,
        encoder: gpuEncoder.encoder,
        inputArgs: gpuEncoder.inputArgs,
        filter: gpuEncoder.filter,
      });
    }

    const enabledDevices = gpuEncoders.filter((device) => device.enabled === true);

    if (enabledDevices.length > 0) {
      if (enabledDevices[0].encoder.includes('nvenc')) {
        const res = getBestNvencDevice({
          args,
          nvencDevice: enabledDevices[0],
        });

        return {
          ...res,
          isGpu: true,
        };
      }
      return {
        encoder: enabledDevices[0].encoder,
        inputArgs: enabledDevices[0].inputArgs,
        outputArgs: enabledDevices[0].outputArgs,
        isGpu: true,
      };
    }
  }

  if (targetCodec === 'hevc') {
    return {
      encoder: 'libx265',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
    };
  } if (targetCodec === 'h264') {
    return {
      encoder: 'libx264',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
    };
  }

  return {
    encoder: targetCodec,
    inputArgs: [],
    outputArgs: [],
    isGpu: false,
  };
};
