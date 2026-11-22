"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Duration',
    description: 'Check duration of file in seconds. Do something differently if above threshold.',
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
            label: 'Threshold (in seconds)',
            name: 'thresholdSecs',
            type: 'number',
            defaultValue: '3900',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify Threshold.'
                + ' Default value is 3,900 seconds (65 minutes).',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Working file duration is below threshold',
        },
        {
            number: 2,
            tooltip: 'Working file duration is above threshold',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var getData = function (obj) {
        var _a, _b;
        try {
            if ((_b = (_a = obj === null || obj === void 0 ? void 0 : obj.ffProbeData) === null || _a === void 0 ? void 0 : _a.format) === null || _b === void 0 ? void 0 : _b.duration) {
                var dur = Number(obj.ffProbeData.format.duration);
                if (dur > 0) {
                    return dur;
                }
            }
        }
        catch (err) {
            // err
        }
        return 0;
    };
    var origFileDuration = getData(args.originalLibraryFile);
    args.jobLog("origFileDuration: ".concat(origFileDuration));
    var thresholdSecs = Number(args.inputs.thresholdSecs);
    var durationText = "File has duration is ".concat(origFileDuration.toFixed(3), " seconds");
    var belowText = 'File duration is below threshold.';
    var aboveText = 'File duration is above threshold.';
    var outputNumber = 1;
    if (origFileDuration < thresholdSecs) {
        args.jobLog("".concat(belowText, " ").concat(durationText, ", threshold is ").concat(thresholdSecs, " seconds"));
        outputNumber = 1;
    }
    else if (origFileDuration >= thresholdSecs) {
        args.jobLog("".concat(aboveText, " ").concat(durationText, ", threshold is ").concat(thresholdSecs, " seconds"));
        outputNumber = 2;
    }
    else {
        args.jobLog(durationText);
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
