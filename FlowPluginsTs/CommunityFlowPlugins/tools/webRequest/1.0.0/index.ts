import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Send Web Request',
  description: 'Send Web Request',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      label: 'Method',
      name: 'method',
      type: 'string',
      defaultValue: 'post',
      inputUI: {
        type: 'dropdown',
        options: [
          'get',
          'post',
          'put',
          'delete',
        ],
      },
      tooltip: 'Specify request method',
    },
    {
      label: 'Request URL',
      name: 'requestUrl',
      type: 'string',
      defaultValue: 'http://example.com',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify request URL',
    },
    {
      label: 'Request Headers',
      name: 'requestHeaders',
      type: 'string',
      defaultValue: `{
           "Content-Type": "application/json"
}`,
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
      },
      tooltip: 'Specify request URL',
    },
    {
      label: 'Request Body',
      name: 'requestBody',
      type: 'string',
      defaultValue: `{
            "test": "test"
}`,
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
      },
      tooltip: 'Specify request body',
    },
    {
      label: 'Log Response Body',
      name: 'logResponseBody',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to log response body in the job report',
    },
    {
      label: 'Output 2 Status Codes',
      name: 'output2StatusCodes',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Comma-separated HTTP status codes or ranges to route to output 2 instead of failing, '
        + 'e.g. 400,404,429,500-599.',
    },
    {
      label: 'Output 2 On Network Error',
      name: 'output2OnNetworkError',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Route connection errors, DNS errors, and timeouts to output 2 instead of failing the flow.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Request succeeded',
    },
    {
      number: 2,
      tooltip: 'Request failed with a configured status code or network error',
    },
  ],
});

interface IStatusCodeRange {
  min: number,
  max: number,
}

interface IWebRequestResponse {
  status: number | string,
  data?: unknown,
}

interface IWebRequestError {
  response?: {
    status?: number | string,
  },
}

const MIN_HTTP_STATUS_CODE = 100;
const MAX_HTTP_STATUS_CODE = 599;
const MIN_SUCCESS_STATUS_CODE = 200;
const MAX_SUCCESS_STATUS_CODE = 299;

const validateStatusCode = (statusCode: number, token: string): void => {
  if (statusCode < MIN_HTTP_STATUS_CODE || statusCode > MAX_HTTP_STATUS_CODE) {
    throw new Error(`Invalid HTTP status code in Output 2 Status Codes: ${token}`);
  }
};

const parseOutput2StatusCodes = (input: string): IStatusCodeRange[] => {
  const tokens = input.split(',')
    .map((rawToken) => rawToken.trim())
    .filter((token) => token !== '');

  return tokens.map((token) => {
    if (/^\d{3}$/.test(token)) {
      const statusCode = Number(token);
      validateStatusCode(statusCode, token);
      return {
        min: statusCode,
        max: statusCode,
      };
    }

    const rangeMatch = /^(\d{3})\s*-\s*(\d{3})$/.exec(token);
    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);
      validateStatusCode(min, token);
      validateStatusCode(max, token);

      if (min > max) {
        throw new Error(`Invalid HTTP status code range in Output 2 Status Codes: ${token}`);
      }

      return {
        min,
        max,
      };
    }

    throw new Error(`Invalid Output 2 Status Codes value: ${token}`);
  });
};

const shouldRouteStatusCodeToOutput2 = (
  statusCode: number,
  output2StatusCodeRanges: IStatusCodeRange[],
): boolean => output2StatusCodeRanges.some((range) => (
  statusCode >= range.min && statusCode <= range.max
));

const isSuccessfulStatusCode = (statusCode: number): boolean => (
  statusCode >= MIN_SUCCESS_STATUS_CODE && statusCode <= MAX_SUCCESS_STATUS_CODE
);

const buildOutputArgs = (args: IpluginInputArgs, outputNumber: number): IpluginOutputArgs => ({
  outputFileObj: args.inputFileObj,
  outputNumber,
  variables: args.variables,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const method = String(args.inputs.method);
  const requestUrl = String(args.inputs.requestUrl);
  const requestHeaders = JSON.parse(String(args.inputs.requestHeaders));
  const requestBody = JSON.parse(String(args.inputs.requestBody));
  const { logResponseBody } = args.inputs;
  const output2StatusCodeRanges = parseOutput2StatusCodes(String(args.inputs.output2StatusCodes));
  const { output2OnNetworkError } = args.inputs;

  const requestConfig = {
    method,
    url: requestUrl,
    headers: requestHeaders,
    data: requestBody,
  };

  let res: IWebRequestResponse;
  try {
    res = await args.deps.axios(requestConfig);
  } catch (err) {
    args.jobLog('Web Request Failed');
    args.jobLog(JSON.stringify(err));

    const errWithResponse = err as IWebRequestError;
    const rawStatusCode = errWithResponse.response?.status;
    const statusCode = Number(rawStatusCode);
    if (shouldRouteStatusCodeToOutput2(statusCode, output2StatusCodeRanges)) {
      args.jobLog(`Routing status code ${statusCode} to output 2`);
      return buildOutputArgs(args, 2);
    }

    if (rawStatusCode === undefined && output2OnNetworkError) {
      args.jobLog('Routing network error to output 2');
      return buildOutputArgs(args, 2);
    }

    throw new Error('Web Request Failed');
  }

  const statusCode = Number(res.status);

  if (isSuccessfulStatusCode(statusCode)) {
    args.jobLog(`Web request succeeded: Status Code: ${statusCode}`);

    if (logResponseBody) {
      args.jobLog(`Response Body: ${JSON.stringify(res.data)}`);
    }

    return buildOutputArgs(args, 1);
  }

  args.jobLog(`Web request failed: Status Code: ${statusCode}`);

  if (logResponseBody) {
    args.jobLog(`Response Body: ${JSON.stringify(res.data)}`);
  }

  if (shouldRouteStatusCodeToOutput2(statusCode, output2StatusCodeRanges)) {
    args.jobLog(`Routing status code ${statusCode} to output 2`);
    return buildOutputArgs(args, 2);
  }

  throw new Error('Web Request Failed');
};
export {
  details,
  plugin,
};
