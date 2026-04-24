import { getEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Node Hardware Encoder',
  description: `
  Check if node hardware encoder is available. Can also be used to check for specific hardware.
  For example:

  HEVC encoders:
  hevc_nvenc = Nvidia
  hevc_amf = AMD
  hevc_vaapi = Intel
  hevc_qsv = Intel
  hevc_videotoolbox = Apple
  
  AV1 encoders:
  av1_nvenc = Nvidia
  av1_amf = AMD
  av1_vaapi = Intel
  av1_qsv = Intel
  av1_videotoolbox = Apple
  `,
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
      label: 'Hardware Encoder',
      name: 'hardwareEncoder',
      type: 'string',
      defaultValue: 'hevc_nvenc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc_nvenc',
          'hevc_amf',
          'hevc_rkmpp',
          'hevc_vaapi',
          'hevc_qsv',
          'hevc_videotoolbox',
          'av1_nvenc',
          'av1_amf',
          'av1_vaapi',
          'av1_qsv',
          'av1_videotoolbox',
        ],
      },
      tooltip: 'Specify hardware (based on encoder) to check for',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Node has hardware',
    },
    {
      number: 2,
      tooltip: 'Node does not have hardware',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { hardwareEncoder } = args.inputs;

  // Ensure hardwareEncoder is a string
  const encoderString = String(hardwareEncoder);

  // Determine target codec based on encoder selection
  const targetCodec = encoderString.startsWith('av1_') ? 'av1' : 'hevc';

  // eslint-disable-next-line no-await-in-loop
  const encoderProperties = await getEncoder({
    targetCodec,
    hardwareEncoding: true,
    hardwareType: 'auto',
    args,
  });

  const nodeHasHardware = encoderProperties.enabledDevices.some((row) => row.encoder === encoderString);

  args.jobLog(`Node has hardwareEncoder ${encoderString}: ${nodeHasHardware}`);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: nodeHasHardware ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
