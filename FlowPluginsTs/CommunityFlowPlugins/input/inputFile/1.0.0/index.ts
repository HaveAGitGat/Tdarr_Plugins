import { promises as fsp } from 'fs';

import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileAbosluteDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Input File',
  description: 'Start the flow with an input file',
  style: {
    borderColor: 'pink',
  },
  tags: '',
  isStartPlugin: true,
  pType: 'start',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'File Access Checks',
      name: 'fileAccessChecks',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Will check if input file and cache are readable and writable',
    },
    {
      label: 'Pause Node If Access Checks Fail',
      name: 'pauseNodeIfAccessChecksFail',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'This will pause the node if the file access checks fail',
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

  const orignalFolder = getFileAbosluteDir(args.originalLibraryFile._id);
  const { fileAccessChecks, pauseNodeIfAccessChecksFail } = args.inputs;

  const nodeID = process.argv[8];
  const { serverIP, serverPort } = args.deps.configVars.config;

  const url = `http://${serverIP}:${serverPort}/api/v2/update-node`;

  const pauseNode = async () => {
    args.jobLog('Pausing node');
    const requestConfig = {
      method: 'post',
      url,
      headers: {},
      data: {
        data: {
          nodeID,
          nodeUpdates: {
            nodePaused: true,
          },
        },
      },
    };

    await args.deps.axios(requestConfig);
    args.jobLog('Node paused');
  };

  const checkReadWrite = async (location: string) => {
    try {
      await fsp.access(location, fsp.constants.R_OK);
    } catch (err) {
      args.jobLog(JSON.stringify(err));
      if (pauseNodeIfAccessChecksFail) {
        await pauseNode();
      }

      throw new Error(`Location not readable:${location}`);
    }

    try {
      await fsp.access(location, fsp.constants.W_OK);
    } catch (err) {
      args.jobLog(JSON.stringify(err));
      if (pauseNodeIfAccessChecksFail) {
        await pauseNode();
      }
      throw new Error(`Location not writeable:${location}`);
    }
  };

  if (fileAccessChecks) {
    args.jobLog('Checking file access');
    await checkReadWrite(orignalFolder);
    await checkReadWrite(args.librarySettings.cache);
  } else {
    args.jobLog('Skipping file access checks');
  }

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
