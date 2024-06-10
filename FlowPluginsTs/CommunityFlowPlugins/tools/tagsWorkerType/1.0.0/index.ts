import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Tags: Worker Type',
  description: `
Requeues the item into the staging section if the current worker
does not match the required worker type and tags.

You can set the 'Node Tags' in the Node options panel.

The required tags must be a subset of the current tags for the current worker to process the item,
else the item will be requeued with the required tags.
  `,
  style: {
    borderColor: 'yellow',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.20.01',
  sidebarPosition: -1,
  icon: 'faFilter',
  inputs: [
    {
      label: 'Required Transcode Worker Type',
      name: 'requiredWorkerType',
      type: 'string',
      defaultValue: 'CPUorGPU',
      inputUI: {
        type: 'dropdown',
        options: [
          'CPUorGPU',
          'CPU',
          'GPU',
          'GPU:nvenc',
          'GPU:qsv',
          'GPU:vaapi',
          'GPU:videotoolbox',
          'GPU:amf',
        ],
      },
      tooltip: 'Specify worker type',
    },
    {
      label: 'Required Node Tags',
      name: 'requiredNodeTags',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
      },
      tooltip: `
tag1,tag2
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
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const requiredWorkerType = String(args.inputs.requiredWorkerType);
  const requiredNodeTags = String(args.inputs.requiredNodeTags);

  let requiredTags = [];
  let currentTags = [];

  requiredTags.push(`require${requiredWorkerType}`);
  if (requiredNodeTags) {
    requiredTags = requiredTags.concat(requiredNodeTags.split(','));
  }

  const currentWorkerType = args.workerType;

  if (requiredWorkerType === 'CPUorGPU') {
    currentTags.push('requireCPUorGPU');
  } else if (currentWorkerType === 'transcodecpu') {
    currentTags.push('requireCPU');
  } else if (currentWorkerType === 'transcodegpu') {
    if (args.nodeHardwareType && args.nodeHardwareType !== '-') {
      currentTags.push(`requireGPU:${args.nodeHardwareType}`);
    } else {
      currentTags.push('requireGPU');
    }
  }

  if (args.nodeTags) {
    currentTags = currentTags.concat(args.nodeTags.split(','));
  }

  requiredTags = requiredTags.map((tag) => tag.trim()).filter((tag) => tag !== '');
  currentTags = currentTags.map((tag) => tag.trim()).filter((tag) => tag !== '');

  args.jobLog(`Required Tags: ${requiredTags.join(',')}`);
  args.jobLog(`Current Tags: ${currentTags.join(',')}`);

  let isSubset = true;

  for (let i = 0; i < requiredTags.length; i += 1) {
    if (!currentTags.includes(requiredTags[i])) {
      isSubset = false;
      break;
    }
  }
  // requiredTags needs to be subset of currentTags
  args.jobLog(`Current tags: ${currentTags}`);
  args.jobLog(`Required tags: ${requiredTags}`);
  args.jobLog(`Is Subset: ${isSubset}`);

  if (isSubset) {
    // eslint-disable-next-line no-param-reassign
    args.variables.queueTags = '';
    args.jobLog('Required tags are subset of current tags, continuing to next plugin.');
  } else {
    args.jobLog('Required tags are not subset of current tags, requeueing.');
    // eslint-disable-next-line no-param-reassign
    args.variables.queueTags = requiredTags.join(',');
    args.jobLog(`Requeueing with tags ${args.variables.queueTags}`);
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
