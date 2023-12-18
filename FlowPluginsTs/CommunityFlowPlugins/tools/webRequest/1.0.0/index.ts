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

  const method = String(args.inputs.method);
  const requestUrl = String(args.inputs.requestUrl);
  const requestHeaders = JSON.parse(String(args.inputs.requestHeaders));
  const requestBody = JSON.parse(String(args.inputs.requestBody));

  const requestConfig = {
    method,
    url: requestUrl,
    headers: requestHeaders,
    data: requestBody,
  };

  try {
    const res = await args.deps.axios(requestConfig);
    args.jobLog(`Web request succeeded: Status Code: ${res.status}`);
  } catch (err) {
    args.jobLog('Web Request Failed');
    args.jobLog(JSON.stringify(err));
    throw new Error('Web Request Failed');
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
