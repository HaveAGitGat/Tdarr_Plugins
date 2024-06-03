import { promises as fsp } from 'fs';
import { IpluginInputArgs } from './interfaces/interfaces';

export const fileExists = async (path:string): Promise<boolean> => !!(await fsp.stat(path).catch(() => false));

export const getContainer = (filePath: string): string => {
  const parts = filePath.split('.');
  return parts[parts.length - 1];
};

export const getFileName = (filePath: string): string => {
  const parts = filePath.split('/');
  const fileNameAndContainer = parts[parts.length - 1];
  const parts2 = fileNameAndContainer.split('.');
  parts2.pop();
  return parts2.join('.');
};

export const getFileAbosluteDir = (filePath: string):string => {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/');
};

export const getFfType = (codecType: string): string => (codecType === 'video' ? 'v' : 'a');

export const getSubStem = ({
  inputPathStem,
  inputPath,
}: {
  inputPathStem: string,
  inputPath: string,
}): string => {
  const subStem = inputPath.substring(inputPathStem.length);
  const parts = subStem.split('/');
  parts.pop();

  return parts.join('/');
};

export const getFileSize = async (file:string):Promise<number> => {
  const stats = await fsp.stat(file);
  const { size } = stats;
  return size;
};

export const moveFileAndValidate = async ({
  inputPath,
  outputPath,
  args,
}: {
  inputPath: string,
  outputPath: string,
  args: IpluginInputArgs
}):Promise<void> => {
  const inputSize = await getFileSize(inputPath);

  args.jobLog(`Attempt 1: Moving file from ${inputPath} to ${outputPath}`);

  const res1 = await new Promise((resolve) => {
    args.deps.gracefulfs.rename(inputPath, outputPath, (err: Error) => {
      if (err) {
        args.jobLog(`Failed to move file from ${inputPath} to ${outputPath}`);
        args.jobLog(JSON.stringify(err));
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

  let outputSize = 0;
  try {
    outputSize = await getFileSize(outputPath);
  } catch (err) {
    args.jobLog(JSON.stringify(err));
  }

  if (!res1 || inputSize !== outputSize) {
    if (inputSize !== outputSize) {
      args.jobLog(`File sizes do not match, input: ${inputSize} `
      + `does not equal  output: ${outputSize}`);
    }

    args.jobLog(`Attempt 1  failed: Moving file from ${inputPath} to ${outputPath}`);
    args.jobLog(`Attempt 2: Moving file from ${inputPath} to ${outputPath}`);

    const res2 = await new Promise((resolve) => {
      args.deps.mvdir(inputPath, outputPath, { overwrite: true })
        .then(() => {
          resolve(true);
        }).catch((err: Error) => {
          args.jobLog(`Failed to move file from ${inputPath} to ${outputPath}`);
          args.jobLog(JSON.stringify(err));
          resolve(false);
        });
    });

    outputSize = await getFileSize(outputPath);

    if (!res2 || inputSize !== outputSize) {
      if (inputSize !== outputSize) {
        args.jobLog(`File sizes do not match, input: ${inputSize} `
        + `does not equal  output: ${outputSize}`);
      }

      const errMessage = `Failed to move file from ${inputPath} to ${outputPath}, check errors above`;
      args.jobLog(errMessage);
      throw new Error(errMessage);
    }
  }
};

export const getPluginWorkDir = (args: IpluginInputArgs):string => {
  const pluginWorkDir = `${args.workDir}/${new Date().getTime()}`;
  args.deps.fsextra.ensureDirSync(pluginWorkDir);
  return pluginWorkDir;
};

export interface IscanTypes {
  mediaInfoScan: boolean,
  exifToolScan: boolean,
  closedCaptionScan: boolean,
  [index: string]: boolean,
}

export const getScanTypes = (pluginsTextRaw: string[]): IscanTypes => {
  const scanTypes: IscanTypes = {
    exifToolScan: true,
    mediaInfoScan: false,
    closedCaptionScan: false,
  };
  const scannerTypes = [
    // needed for frame and duration data for ffmpeg
    // {
    //   type: 'exifToolScan',
    //   terms: [
    //     'meta',
    //   ],
    // },
    {
      type: 'mediaInfoScan',
      terms: [
        'mediaInfo',
      ],
    },
    {
      type: 'closedCaptionScan',
      terms: [
        'hasClosedCaptions',
      ],
    },
  ];

  const text = pluginsTextRaw.join('');

  scannerTypes.forEach((scanner) => {
    scanner.terms.forEach((term) => {
      if (text.includes(term)) {
        scanTypes[scanner.type] = true;
      }
    });
  });
  return scanTypes;
};
