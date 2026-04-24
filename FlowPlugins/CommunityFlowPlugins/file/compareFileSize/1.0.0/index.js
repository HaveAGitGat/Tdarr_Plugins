"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Compare File Size',
    description: 'Compare file size of working file compared to original file',
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
            tooltip: 'Working file is smaller than original file',
        },
        {
            number: 2,
            tooltip: 'Working file is same size as original file',
        },
        {
            number: 3,
            tooltip: 'Working file is larger than original file',
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
    if (args.inputFileObj.file_size < args.originalLibraryFile.file_size) {
        args.jobLog("Working of size ".concat(args.inputFileObj.file_size)
            + " is smaller than original file of size ".concat(args.originalLibraryFile.file_size));
        outputNumber = 1;
    }
    else if (args.inputFileObj.file_size === args.originalLibraryFile.file_size) {
        args.jobLog("Working of size ".concat(args.inputFileObj.file_size)
            + " is same size as original file of size ".concat(args.originalLibraryFile.file_size));
        outputNumber = 2;
    }
    else if (args.inputFileObj.file_size > args.originalLibraryFile.file_size) {
        args.jobLog("Working of size ".concat(args.inputFileObj.file_size)
            + " is larger than original file of size ".concat(args.originalLibraryFile.file_size));
        outputNumber = 3;
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
