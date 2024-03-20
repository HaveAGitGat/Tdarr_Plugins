"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Name Includes',
    description: 'Check if a file name includes specific terms. Only needs to match one term',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'Terms',
            name: 'terms',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '_720p,_1080p',
            inputUI: {
                type: 'text',
            },
            // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Specify terms to check for in file name using comma seperated list e.g. _720p,_1080p',
        },
        {
            label: 'Patterns',
            name: 'patterns',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Specify patterns (regex) to check for in file name using comma seperated list e.g. ^Pattern*\.mkv$',
        },
        {
            label: 'Include file directory in check',
            name: 'includeFileDirectory',
            type: 'boolean',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Should the terms and patterns be evaluated against the file directory e.g. false, true',
        }
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File name contains terms or patterns',
        },
        {
            number: 2,
            tooltip: 'File name does not contain any of the terms or patterns',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var buildArrayInput = function (arrayInput) { var _a, _b; return (_b = (_a = String(arrayInput)) === null || _a === void 0 ? void 0 : _a.trim().split(',')) !== null && _b !== void 0 ? _b : new Array(); };
    var fileName = "".concat(Boolean(args.inputs.includeFileDirectory) ? (0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id) + '/' : '').concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat((0, fileUtils_1.getContainer)(args.inputFileObj._id));
    var searchCriteriasArray = buildArrayInput(args.inputs.terms)
        .map(function (term) { return term.replace(/[\-\/\\^$*+?.()|[\]{}]/g, '\\$&'); }) // https://github.com/tc39/proposal-regex-escaping
        .concat(buildArrayInput(args.inputs.patterns));
    var isAMatch = false;
    for (var i = 0; i < searchCriteriasArray.length; i++)
        if (new RegExp(searchCriteriasArray[i]).test(fileName)) {
            isAMatch = true;
            args.jobLog("".concat(fileName, " includes ").concat(searchCriteriasArray[i]));
            break;
        }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isAMatch ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
