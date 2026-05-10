import { IpluginInputArgs } from './interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

// Same pattern used in be/srcts/commonModules/fileScanner/fileScannerUtils.ts
const automationDummyFilePattern = /\/.tdarr\/automation-.+-.+\.txt$/;
export const isAutomationFile = (filepath: string): boolean => automationDummyFilePattern.test(filepath);

// Returns true if other non-automation workers are running on the node.
// Returns 'error' on server/network failure so callers can distinguish
// "no workers" from "couldn't check".
export const checkOtherWorkersRunning = async (
  args: IpluginInputArgs,
  enableDebugLog: boolean,
): Promise<boolean | 'error'> => {
  const { nodeID } = args.configVars.config;
  if (!nodeID || !args.deps?.axios) {
    if (enableDebugLog) {
      args.jobLog(`checkWorkers: no nodeID (${nodeID}) or no axios`);
    }
    return false;
  }

  try {
    const serverURL = args.configVars?.config?.serverURL || '';
    const apiKey = args.configVars?.config?.apiKey || '';
    const nodesRes = await args.deps.axios.get(`${serverURL}/api/v2/get-nodes`, {
      timeout: 30000,
      headers: {
        'content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });
    const node = nodesRes.data?.[nodeID];
    if (!node?.workers) {
      if (enableDebugLog) {
        const nodeIds = Object.keys(nodesRes.data || {});
        args.jobLog(`checkWorkers: node "${nodeID}" not found in response. Available: ${nodeIds.join(', ')}`);
      }
      return false;
    }

    const myJobId = args.job?.jobId || '';
    const workerIds = Object.keys(node.workers);
    let otherWorkerCount = 0;

    for (let i = 0; i < workerIds.length; i += 1) {
      const worker = node.workers[workerIds[i]];
      if (worker.job?.jobId === myJobId) {
        continue; // eslint-disable-line no-continue
      }
      // Skip other automation workers
      if (worker.file && isAutomationFile(worker.file)) {
        continue; // eslint-disable-line no-continue
      }
      otherWorkerCount += 1;
    }

    if (enableDebugLog) {
      args.jobLog(`checkWorkers: ${workerIds.length} total workers, ${otherWorkerCount} non-automation others`);
    }

    return otherWorkerCount > 0;
  } catch (err) {
    if (enableDebugLog) {
      args.jobLog(`checkWorkers error: ${err}`);
    }
    return 'error';
  }
};

// Runs a polling loop that bumps worker percentage each iteration.
// Calls `checkFn` each poll. When `checkFn` returns true for `confirmCount`
// consecutive times, the loop exits.
// If `checkFn` returns 'error', the confirmation counter is reset
// (treat errors as "uncertain, keep going").
// Returns when the exit condition is met.
export const pollUntilConfirmed = async (
  args: IpluginInputArgs,
  pollIntervalMs: number,
  confirmCount: number,
  checkFn: (firstCheck: boolean) => Promise<boolean | 'error'>,
  exitMessage: string,
): Promise<void> => {
  let percentage = 0;
  let confirmedCount = 0;
  let finished = false;
  let firstCheck = true;

  while (!finished) {
    args.updateWorker({ percentage });
    percentage = (percentage + 1) % 100;

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs)); // eslint-disable-line no-await-in-loop

    let conditionMet: boolean | 'error';
    try {
      conditionMet = await checkFn(firstCheck); // eslint-disable-line no-await-in-loop
    } catch (err) {
      // If checkFn throws, treat as error - reset confirmation counter
      args.jobLog(`pollUntilConfirmed: checkFn threw, resetting confirmations: ${err}`);
      conditionMet = 'error';
    }
    firstCheck = false;

    if (conditionMet === 'error') {
      // Server/network error - don't count toward exit, reset counter
      if (confirmedCount > 0) {
        confirmedCount = 0;
      }
    } else if (conditionMet) {
      confirmedCount += 1;
      if (confirmedCount >= confirmCount) {
        args.jobLog(exitMessage);
        finished = true;
      }
    } else if (confirmedCount > 0) {
      confirmedCount = 0;
    }
  }
};
