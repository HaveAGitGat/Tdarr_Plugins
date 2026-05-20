import { promises as fsp } from 'fs';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';

const helperText = `
    jobCache: Clears all other files in this job's cache folder (which is a subfolder of the library cache).
    libraryCache: Clears all other files in the library cache.
  `;

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Clear Cache',
  description: `
    This plugin allows you to clear various cache folders, keeping only the current 'working' file.
    ${helperText}

  `,
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faTrash',
  inputs: [
    {
      label: 'Cache To Clear',
      name: 'cacheToClear',
      type: 'string',
      defaultValue: 'jobCache',
      inputUI: {
        type: 'dropdown',
        options: [
          'jobCache',
          'libraryCache',
        ],
      },
      tooltip: `Specify which cache to clear 
      ${helperText}
      `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { cacheToClear } = args.inputs;

  const currentFile = args.inputFileObj._id;
  const jobCacheDir = args.workDir;
  const libraryCacheDir = args.librarySettings.cache;

  let folderToClear = '';

  if (cacheToClear === 'jobCache') {
    folderToClear = jobCacheDir;
  } else if (cacheToClear === 'libraryCache') {
    folderToClear = libraryCacheDir;
  }

  args.jobLog(`Clearing ${cacheToClear} folder: "${folderToClear}"`);
  args.jobLog(`Keeping current file: "${currentFile}"`);

  const traverseFolder = async (dir:string) => {
    const filesInDir = (await fsp.readdir(dir)).map((file) => normJoinPath({
      upath: args.deps.upath,
      paths: [
        dir,
        file,
      ],
    }));

    for (let i = 0; i < filesInDir.length; i += 1) {
      const file = filesInDir[i];

      // eslint-disable-next-line no-await-in-loop
      const stat = await fsp.stat(file);

      if (stat.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop
        await traverseFolder(file);
      } else if (
        file !== currentFile
        // prevent deleting non Tdarr cache files
        && file.includes('tdarr-workDir2')
      ) {
        args.jobLog(`Deleting "${file}"`);
        try {
          // eslint-disable-next-line no-await-in-loop
          await fsp.unlink(file);
        } catch (err) {
          args.jobLog(`File delete error: ${JSON.stringify(err)}`);
        }
      }
    }
  };

  await traverseFolder(folderToClear);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
