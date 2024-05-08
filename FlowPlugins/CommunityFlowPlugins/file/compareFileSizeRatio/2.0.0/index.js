"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Compare File Size Ratio',
    description: 'Compare file size ratio of working file compared to original file using percentage.',
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
            label: 'Greater Than',
            name: 'greaterThan',
            type: 'number',
            defaultValue: '40',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify lower bound.'
                + 'Default value is 40% so new file size must be at least 40% of original file size.',
        },
        {
            label: 'Less Than',
            name: 'lessThan',
            type: 'number',
            defaultValue: '110',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify upper bound.'
                + ' Default value is 110% so new file size must be at most 110% of original file size.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Working file size % is within range',
        },
        {
            number: 2,
            tooltip: 'Working file size % is smaller than lower bound',
        },
        {
            number: 3,
            tooltip: 'Working file size % is larger than upper bound',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var newFileSizeBytes = args.inputFileObj.file_size;
    var origFileSizeBytes = args.originalLibraryFile.file_size;
    var greaterThanPerc = Number(args.inputs.greaterThan);
    var lessThanPerc = Number(args.inputs.lessThan);
    var ratio = (newFileSizeBytes / origFileSizeBytes) * 100;
    var sizeText = "New file has size ".concat(newFileSizeBytes.toFixed(3), " MB which is ").concat(ratio, "% ")
        + "of original file size:  ".concat(origFileSizeBytes.toFixed(3), " MB");
    var getBound = function (bound) { return (bound / 100) * origFileSizeBytes; };
    var outputNumber = 1;
    var errText = 'New file size not within limits.';
    if (newFileSizeBytes > getBound(lessThanPerc)) {
        // Item will be errored in UI
        args.jobLog("".concat(errText, " ").concat(sizeText, ". upperBound is ").concat(lessThanPerc, "%"));
        outputNumber = 3;
    }
    else if (newFileSizeBytes < getBound(greaterThanPerc)) {
        // // Item will be errored in UI
        args.jobLog("".concat(errText, " ").concat(sizeText, ". lowerBound is ").concat(greaterThanPerc, "%"));
        outputNumber = 2;
    }
    else {
        args.jobLog(sizeText);
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
