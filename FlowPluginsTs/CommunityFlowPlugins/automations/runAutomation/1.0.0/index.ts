import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

// Retries an async function with exponential backoff.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number,
  jobLog: (text: string) => void,
): Promise<T> => {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(); // eslint-disable-line no-await-in-loop
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * (2 ** (attempt - 1));
        jobLog(`Request failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms: ${err}`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // eslint-disable-line no-await-in-loop
      }
    }
  }
  throw lastErr;
};

const details = (): IpluginDetails => ({
  name: 'Run Automation',
  description: 'Triggers another automation by its config ID, optionally passing a JSON payload.',
  style: {
    borderColor: '#FF9800',
  },
  tags: 'automations,trigger,run',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.64.01',
  sidebarPosition: -1,
  icon: 'faPlay',
  inputs: [
    {
      label: 'Automation Config ID',
      name: 'configId',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The ID of the automation config to trigger.',
    },
    {
      label: 'Payload (JSON)',
      name: 'payload',
      type: 'string',
      defaultValue: '{}',
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
      },
      tooltip: 'Optional JSON payload to pass to the automation.',
    },
    {
      label: 'Target Node',
      name: 'targetNode',
      type: 'string',
      defaultValue: 'currentNode',
      inputUI: {
        type: 'dropdown',
        options: ['currentNode', 'automationDefault'],
      },
      tooltip: 'Choose where to run the automation.'
        + ' "currentNode" sends the current node ID as the target.'
        + ' "automationDefault" uses the target nodes configured on the automation.',
    },
    {
      label: 'Target Library',
      name: 'targetLibrary',
      type: 'string',
      defaultValue: 'currentLibrary',
      inputUI: {
        type: 'dropdown',
        options: ['currentLibrary', 'automationDefault'],
      },
      tooltip: 'Choose which library to run the automation against.'
        + ' "currentLibrary" sends the current file\'s library ID as the target.'
        + ' "automationDefault" uses the libraries configured on the automation.',
    },
    {
      label: 'Skip If Already Running',
      name: 'skipIfRunning',
      type: 'string',
      defaultValue: 'onCurrentNode',
      inputUI: {
        type: 'dropdown',
        options: ['disabled', 'onCurrentNode', 'onAnyNode'],
      },
      tooltip: 'Skip triggering if the automation is already running on this node or any node.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const configId = String(args.inputs.configId).trim();
  const payloadStr = String(args.inputs.payload).trim() || '{}';
  const targetNode = String(args.inputs.targetNode);
  const targetLibrary = String(args.inputs.targetLibrary);
  const skipIfRunning = String(args.inputs.skipIfRunning);

  if (!configId) {
    throw new Error('No automation config ID provided');
  }

  const serverURL = args.configVars?.config?.serverURL || '';
  const apiKey = args.configVars?.config?.apiKey || '';
  const headers = {
    'content-Type': 'application/json',
    'x-api-key': apiKey,
  };

  if (skipIfRunning === 'onCurrentNode' || skipIfRunning === 'onAnyNode') {
    const confirmCount = 3;
    const pollDelayMs = 5000;
    let notRunningCount = 0;

    for (let poll = 0; poll < confirmCount; poll += 1) {
      if (poll > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollDelayMs)); // eslint-disable-line no-await-in-loop
      }

      // eslint-disable-next-line no-await-in-loop
      const nodesRes = await withRetry<// eslint-disable-next-line @typescript-eslint/no-explicit-any
      any>(
        () => args.deps.axios.get(`${serverURL}/api/v2/get-nodes`, {
          timeout: 30000,
          headers,
        }),
        3,
        2000,
        args.jobLog,
      );
      const nodes = nodesRes.data || {};
      const myNodeID = args.configVars.config.nodeID;

      const nodeIdsToCheck = skipIfRunning === 'onCurrentNode'
        ? [myNodeID]
        : Object.keys(nodes);

      let isRunning = false;
      for (let i = 0; i < nodeIdsToCheck.length; i += 1) {
        const node = nodes[nodeIdsToCheck[i]];
        if (!node?.workers) {
          continue; // eslint-disable-line no-continue
        }
        const workerIds = Object.keys(node.workers);
        for (let j = 0; j < workerIds.length; j += 1) {
          const worker = node.workers[workerIds[j]];
          if (worker.job?.footprintId === configId && !worker.idle) {
            isRunning = true;
            break;
          }
        }
        if (isRunning) break;
      }

      if (isRunning) {
        args.jobLog(`Automation ${configId} is already running, skipping`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 1,
          variables: args.variables,
        };
      }

      notRunningCount += 1;
    }

    args.jobLog(`Automation ${configId} confirmed not running (${notRunningCount}/${confirmCount} checks)`);
  }

  const payload = JSON.parse(payloadStr);

  const data: Record<string, unknown> = {
    configId,
    payload,
  };

  if (targetNode === 'currentNode') {
    const myNodeID = args.configVars.config.nodeID;
    data.targetNodeIds = [myNodeID];
    args.jobLog(`Targeting this node: ${myNodeID}`);
  }

  if (targetLibrary === 'currentLibrary') {
    const libraryId = args.originalLibraryFile?.DB || '';
    if (libraryId) {
      data.libraryIds = [libraryId];
      args.jobLog(`Targeting this library: ${libraryId}`);
    }
  }

  const response = await withRetry<// eslint-disable-next-line @typescript-eslint/no-explicit-any
  any>(
    () => args.deps.axios.post(`${serverURL}/api/v2/run-automation`, {
      data,
    }, {
      timeout: 30000,
      headers,
    }),
    3,
    2000,
    args.jobLog,
  );

  if (response.status !== 200) {
    throw new Error(`Automation trigger failed with status ${response.status}`);
  }

  if (response.data?.error) {
    throw new Error(`Automation trigger failed: ${response.data.error}`);
  }

  args.jobLog(`Automation ${configId} triggered`);

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
