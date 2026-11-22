import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Duration',
  description: 'Check duration of file in seconds. Do something differently if above threshold.',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Threshold (in seconds)',
      name: 'thresholdSecs',
      type: 'number',
      defaultValue: '3900',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify Threshold.'
                + ' Default value is 3,900 seconds (65 minutes).',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Working file duration is below threshold',
    },
    {
      number: 2,
      tooltip: 'Working file duration is above threshold',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const getData = (obj:IFileObject) => {
    try {
      if (obj?.ffProbeData?.format?.duration) {
        const dur = Number(obj.ffProbeData.format.duration);

        if (dur > 0) {
          return dur;
        }
      }
    } catch (err) {
      // err
    }
    return 0;
  };

  const origFileDuration: number = getData(args.originalLibraryFile);

  args.jobLog(`origFileDuration: ${origFileDuration}`);

  const thresholdSecs = Number(args.inputs.thresholdSecs);
  const durationText = `File has duration is ${origFileDuration.toFixed(3)} seconds`;
  const belowText = 'File duration is below threshold.';
  const aboveText = 'File duration is above threshold.';

  let outputNumber = 1;

  if (origFileDuration < thresholdSecs) {
    args.jobLog(`${belowText} ${durationText}, threshold is ${thresholdSecs} seconds`);
    outputNumber = 1;
  } else if (origFileDuration >= thresholdSecs) {
    args.jobLog(`${aboveText} ${durationText}, threshold is ${thresholdSecs} seconds`);
    outputNumber = 2;
  } else {
    args.jobLog(durationText);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
