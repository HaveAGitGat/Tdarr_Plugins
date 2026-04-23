"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Custom Arguments',
    description: 'Set FFmpeg custome input and output arguments',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Input Arguments',
            name: 'inputArguments',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify input arguments',
        },
        {
            label: 'Output Arguments',
            name: 'outputArguments',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify output arguments',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;

function splitArgs(str) {
  var out = [];
  var cur = '';
  var quote = null;
  var i = 0;

  while (i < str.length) {
    var ch = str[i];

    // whitespace outside quotes = token break
    if (!quote && (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r')) {
      if (cur.length) {
        out.push(cur);
        cur = '';
      }
      i++;
      continue;
    }

    // handle quotes
    if (ch === '"' || ch === "'") {
      if (quote === ch) {
        quote = null; // closing quote
      } else if (!quote) {
        quote = ch;   // opening quote
      } else {
        cur += ch;    // different quote inside quoted string
      }
      i++;
      continue;
    }

    // handle backslash escapes
    if (ch === '\\' && i + 1 < str.length) {
      cur += str[i + 1];
      i += 2;
      continue;
    }

    cur += ch;
    i++;
  }

  if (cur.length) out.push(cur);
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var inputArguments = String(args.inputs.inputArguments);
    var outputArguments = String(args.inputs.outputArguments);
    if (inputArguments) {
      (_a = args.variables.ffmpegCommand.overallInputArguments)
        .push.apply(_a, splitArgs(inputArguments));
    }
    if (outputArguments) {
      (_b = args.variables.ffmpegCommand.overallOuputArguments)
        .push.apply(_b, splitArgs(outputArguments));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
