import { getEncoder } from './hardwareUtils';

const run = async () => {
  const encoderProperties = await getEncoder({
    targetCodec: 'h264',
    hardwareEncoding: true,
    hardwareType: 'auto',
    // @ts-expect-error type
    args: {
      workerType: 'transcodegpu',
      ffmpegPath: 'ffmpeg',
      jobLog: (t:string) => {
        // eslint-disable-next-line no-console
        console.log(t);
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log({
    encoderProperties,
  });
};

void run();
