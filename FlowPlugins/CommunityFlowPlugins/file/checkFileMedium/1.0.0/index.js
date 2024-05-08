"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Medium',
    description: 'Check if file is video, audio or other type of file',
    style: {
        borderColor: 'orange',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'File medium is a Video',
        },
        {
            number: 2,
            tooltip: 'File medium is an Audio',
        },
        {
            number: 3,
            tooltip: 'File medium is Other',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var outputNumber = 1;
    switch (args.inputFileObj.fileMedium) {
        case 'video':
            outputNumber = 1;
            break;
        case 'audio':
            outputNumber = 2;
            break;
        case 'other':
            outputNumber = 3;
            break;
        default:
            throw new Error('File has no fileMedium!');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
