"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Flow Variable',
    description: 'Check Flow Variable',
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
            label: 'Variable',
            name: 'variable',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Variable to check using templating. \n      \\n\n      \\n\n      https://docs.tdarr.io/docs/plugins/flow-plugins/basics#plugin-variable-templating\n      \n      \\n\n      \\n\n      For example , \n      \n      \\nExample\\n\n      {{{args.librarySettings._id}}}\n      \n      \\nExample\\n\n      {{{args.inputFileObj._id}}}\n\n      \\nExample\\n\n      {{{args.userVariables.library.test}}}\n\n      \\nExample\\n\n      {{{args.userVariables.global.test}}}\n\n      \\nExample\\n\n      {{{args.inputFileObj.mediaInfo.track.0.IsStreamable}}}\n\n      \\nExample\\n\n      {{{args.inputFileObj.ffProbeData.format.nb_streams}}}\n\n      \\nExample\\n\n      {{{args.inputFileObj.ffProbeData.streams.1.codec_name}}}\n      ",
        },
        {
            label: 'Condition',
            name: 'condition',
            type: 'string',
            defaultValue: '==',
            inputUI: {
                type: 'dropdown',
                options: [
                    '==',
                    '!=',
                ],
            },
            tooltip: 'Check condition',
        },
        {
            label: 'Value',
            name: 'value',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Value of variable to check. \nYou can specify multiple values separated by comma. For example: value1,value2,value3",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'The variable matches the condition',
        },
        {
            number: 2,
            tooltip: 'The variable does not match the condition',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var variable = String(args.inputs.variable).trim();
    var targetValue;
    var condition = String(args.inputs.condition);
    var value = String(args.inputs.value);
    // comment to force mediaInfo scan
    args.jobLog("variable = ".concat(JSON.stringify(variable)));
    if (variable.startsWith('args.')) {
        // variable could be e.g. args.librarySettings._id or args.inputFileObj._id
        // condition could be e.g. '==' or '!='
        var variableParts = variable.split('.');
        switch (variableParts.length) {
            case 1:
                targetValue = args;
                break;
            case 2:
                // @ts-expect-error index
                targetValue = args[variableParts[1]];
                break;
            case 3:
                // @ts-expect-error index
                targetValue = args[variableParts[1]][variableParts[2]];
                break;
            case 4:
                // @ts-expect-error index
                targetValue = args[variableParts[1]][variableParts[2]][variableParts[3]];
                break;
            case 5:
                // @ts-expect-error index
                targetValue = args[variableParts[1]][variableParts[2]][variableParts[3]][variableParts[4]];
                break;
            default:
                throw new Error("Invalid variable: ".concat(variable));
        }
    }
    else {
        targetValue = variable;
    }
    targetValue = String(targetValue);
    args.jobLog("targetValue = ".concat(targetValue));
    var outputNumber = 1;
    var valuesArr = value.trim().split(',');
    if (condition === '==') {
        if (valuesArr.includes(targetValue)) {
            args.jobLog("Variable ".concat(variable, " of value ").concat(targetValue, " matches condition ").concat(condition, " ").concat(valuesArr));
            outputNumber = 1;
        }
        else {
            args.jobLog("Variable ".concat(variable, " of value ").concat(targetValue, " does not match condition ").concat(condition, " ").concat(valuesArr));
            outputNumber = 2;
        }
    }
    else if (condition === '!=') {
        if (!valuesArr.includes(targetValue)) {
            args.jobLog("Variable ".concat(variable, " of value ").concat(targetValue, " matches condition ").concat(condition, " ").concat(valuesArr));
            outputNumber = 1;
        }
        else {
            args.jobLog("Variable ".concat(variable, " of value ").concat(targetValue, " does not match condition ").concat(condition, " ").concat(valuesArr));
            outputNumber = 2;
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
