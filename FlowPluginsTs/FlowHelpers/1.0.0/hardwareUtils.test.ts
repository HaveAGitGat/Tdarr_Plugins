import { getEncoder, IgetEncoder } from './hardwareUtils';

const baseInput = {
  targetCodec: 'h264',
  hardwareEncoding: true,
  hardwareType: 'auto',
  args: {
    workerType: 'transcodegpu',
    ffmpegPath: 'ffmpeg',
    jobLog: () => {
      //
    },
  },
};

interface IcheckHardware {
  targetCodec:string | undefined,
  hardwareEncoding:boolean | undefined,
  hardwareType:string | undefined,
  ffmpegPath:string | undefined,
}

const checkHardware = async (settings:IcheckHardware):Promise<IgetEncoder> => {
  const input = JSON.parse(JSON.stringify(baseInput));

  input.args.jobLog = () => {
    // eslint-disable-next-line no-console
    // console.log(t);
  };

  if (settings.targetCodec) {
    input.targetCodec = settings.targetCodec;
  }

  if (settings.hardwareEncoding) {
    input.hardwareEncoding = settings.hardwareEncoding;
  }

  if (settings.hardwareType) {
    input.hardwareType = settings.hardwareType;
  }

  if (settings.ffmpegPath) {
    input.args.ffmpegPath = settings.ffmpegPath;
  }

  const encoderProperties = await getEncoder(input);

  return encoderProperties;
};

export default checkHardware;
