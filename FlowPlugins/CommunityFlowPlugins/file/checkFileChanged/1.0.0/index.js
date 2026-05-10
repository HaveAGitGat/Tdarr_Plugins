"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Changed',
    description: "Check whether the working file has changed from the original library file.\n  A file is considered changed when its path or file size differs.",
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
            tooltip: 'Working file has changed',
        },
        {
            number: 2,
            tooltip: 'Working file has not changed',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var pathChanged = args.inputFileObj._id !== args.originalLibraryFile._id;
    var sizeChanged = args.inputFileObj.file_size !== args.originalLibraryFile.file_size;
    var hasFileChanged = pathChanged || sizeChanged;
    var comparison = {
        workingFile: args.inputFileObj._id,
        originalFile: args.originalLibraryFile._id,
        workingFileSize: args.inputFileObj.file_size,
        originalFileSize: args.originalLibraryFile.file_size,
        pathChanged: pathChanged,
        sizeChanged: sizeChanged,
    };
    args.jobLog(hasFileChanged ? 'Working file has changed' : 'Working file has not changed');
    args.jobLog(JSON.stringify(comparison));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: hasFileChanged ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
