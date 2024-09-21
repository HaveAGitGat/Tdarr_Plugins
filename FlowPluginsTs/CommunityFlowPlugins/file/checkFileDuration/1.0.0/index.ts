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
            tooltip: 'Specify Threshold.' +
                ' Default value is 3,900 seconds (65 minutes); durations longer than this will be assumed as feature length / Films and processed via Output 2, otherwise Output 1 is selected.',
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

    const thresholdSecs: number = Number(args.inputs.thresholdSecs);
    const durationText: string = `File has duration is ${origFileDuration.toFixed(3)} seconds`;
    const seriesText: string = 'File duration within series limits. must be a series.';
    const filmText: string = 'File duration longer than series limits. must be a film.';

    let outputNumber: number = 1;

    if (origFileDuration < thresholdSecs) {
        args.jobLog(`${seriesText} ${durationText}, threshold is ${thresholdSecs} seconds`);
        outputNumber = 1;
    } else if (origFileDuration >= thresholdSecs) {
        args.jobLog(`${filmText} ${durationText}, threshold is ${thresholdSecs} seconds`);
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