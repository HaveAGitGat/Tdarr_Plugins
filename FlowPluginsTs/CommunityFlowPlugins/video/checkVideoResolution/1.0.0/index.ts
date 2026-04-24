import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Video Resolution',
  description: 'Check if video is 480p,576p,720p,1080p,1440p,4KUHD,DCI4K,8KUHD,Other',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File is 480p',
    },
    {
      number: 2,
      tooltip: 'File is 576p',
    },
    {
      number: 3,
      tooltip: 'File is 720p',
    },
    {
      number: 4,
      tooltip: 'File is 1080p',
    },
    {
      number: 5,
      tooltip: 'File is 1440p',
    },
    {
      number: 6,
      tooltip: 'File is 4KUHD',
    },
    {
      number: 7,
      tooltip: 'File is DCI4K',
    },
    {
      number: 8,
      tooltip: 'File is 8KUHD',
    },
    {
      number: 9,
      tooltip: 'File is Other',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let outputNumber = 9;
  switch (args.inputFileObj.video_resolution) {
    case '480p':
      outputNumber = 1;
      break;
    case '576p':
      outputNumber = 2;
      break;
    case '720p':
      outputNumber = 3;
      break;
    case '1080p':
      outputNumber = 4;
      break;
    case '1440p':
      outputNumber = 5;
      break;
    case '4KUHD':
      outputNumber = 6;
      break;
    case 'DCI4K':
      outputNumber = 7;
      break;
    case '8KUHD':
      outputNumber = 8;
      break;
    default:
      outputNumber = 9;
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
