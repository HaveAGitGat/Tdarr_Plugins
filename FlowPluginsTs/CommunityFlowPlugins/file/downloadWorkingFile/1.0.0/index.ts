import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Download Working File',
  description: `Download the working file from the server to the node.`
  + ` Use with the 'Set Flow Variable' plugin to set skipAutoDownload to true`
  + ` so that the automatic download is skipped and you have full control over when the download happens.`
  + ` This gives you the ability to use error edges on the download step`
  + ` (e.g. to handle 404 errors).`,
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.66.01',
  sidebarPosition: -1,
  icon: 'faArrowDown',
  skipAutoDownload: true,
  inputs: [
    {
      label: 'Reset skipAutoDownload',
      name: 'resetSkipAutoDownload',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: `Reset the skipAutoDownload variable back to false after downloading.`
      + ` This means subsequent plugins will use the automatic download behaviour as normal.`
      + ` Disable this if you want to keep manual control for the rest of the flow.`,
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

  const { _id: filePath } = args.inputFileObj;

  args.jobLog(`Downloading working file: ${filePath}`);

  if (!args.shouldDownloadWorkingFile) {
    throw new Error(`shouldDownloadWorkingFile not available - requires Tdarr ${details().requiresVersion} or later`);
  }

  await args.shouldDownloadWorkingFile(filePath);

  args.jobLog('Download complete');

  if (String(args.inputs.resetSkipAutoDownload) === 'true') {
    if (!args.variables.user) {
      // eslint-disable-next-line no-param-reassign
      args.variables.user = {};
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.user.skipAutoDownload = 'false';
    args.jobLog('Reset skipAutoDownload to false');
  }

  return {
    outputFileObj: {
      _id: filePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
