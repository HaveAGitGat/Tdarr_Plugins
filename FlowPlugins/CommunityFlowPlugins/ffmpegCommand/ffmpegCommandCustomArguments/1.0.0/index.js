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
var search = function (arg, i, originalIndex) {
    if (originalIndex === void 0) { originalIndex = i; }
    var searchIndex = arg.indexOf(arg[i], i + 1);
    if (searchIndex === -1) {
        return [null, i];
    }
    if (arg[searchIndex - 1] === '\\') {
        return search(arg, searchIndex + 1, originalIndex);
    }
    return [arg.slice(originalIndex + 1, searchIndex), searchIndex];
};
var tokenize = function (arg) {
    var tokens = [];
    var token = '';
    for (var i = 0; i < arg.length; i++) {
        var char = arg[i];
        if (char === ' ') {
            if (token !== '') {
                tokens.push(token);
                token = '';
            }
        }
        else if ((char === '"' || char === '\'') && arg[i - 1] !== '\\') {
            var _a = search(arg, i), searchResult = _a[0], searchIndex = _a[1];
            if (searchResult !== null) {
                if (token !== '') {
                    tokens.push(token);
                    token = '';
                }
                tokens.push(searchResult);
                i = searchIndex;
            }
            else {
                token += char;
            }
        }
        else {
            token += char;
        }
    }
    if (token !== '') {
        tokens.push(token);
    }
    return tokens;
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
