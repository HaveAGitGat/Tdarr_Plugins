"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Custom Arguments',
    description: 'Set FFmpeg custom input and output arguments',
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
var tokenize = function (arg) {
    var regex = /(.*?)"(.+?)"(.*)/;
    var arr = [];
    var unprocessedString = arg;
    var regexResult;
    while ((regexResult = regex.exec(unprocessedString)) !== null) {
        arr.push.apply(arr, regexResult[1].trim().split(' '));
        arr.push(regexResult[2]);
        unprocessedString = regexResult[3];
    }
    arr.push.apply(arr, unprocessedString.trim().split(' '));
    return arr;
};
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
        (_a = args.variables.ffmpegCommand.overallInputArguments).push.apply(_a, tokenize(inputArguments));
    }
    if (outputArguments) {
        (_b = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_b, tokenize(outputArguments));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
