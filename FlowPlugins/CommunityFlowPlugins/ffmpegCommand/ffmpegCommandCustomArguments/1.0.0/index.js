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
        {
            label: 'Only Apply If Processing',
            name: 'onlyApplyIfProcessing',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: "By default, any custom argument makes the file get processed.\n\nEnable this to add the arguments only when another plugin already requires processing\n(for example a stream was removed or is being re-encoded).\n\nUse it for arguments that should ride along with real work but are not a reason to rewrite\nthe file on their own, such as metadata, colour tags or encoder tuning. Otherwise a file\nthat already matches the flow is re-processed on every pass just to re-apply them.\n\nDo not use it for codec selection (e.g. -c:v): a remux triggered by another plugin would\nthen become a full re-encode.",
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b, _c, _d;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var inputArguments = String(args.inputs.inputArguments);
    var outputArguments = String(args.inputs.outputArguments);
    var onlyApplyIfProcessing = Boolean(args.inputs.onlyApplyIfProcessing);
    var ffmpegCommand = args.variables.ffmpegCommand;
    if (onlyApplyIfProcessing) {
        if (inputArguments) {
            if (!ffmpegCommand.overallInputArgumentsIfProcessing) {
                ffmpegCommand.overallInputArgumentsIfProcessing = [];
            }
            (_a = ffmpegCommand.overallInputArgumentsIfProcessing).push.apply(_a, inputArguments.split(' '));
        }
        if (outputArguments) {
            if (!ffmpegCommand.overallOutputArgumentsIfProcessing) {
                ffmpegCommand.overallOutputArgumentsIfProcessing = [];
            }
            (_b = ffmpegCommand.overallOutputArgumentsIfProcessing).push.apply(_b, outputArguments.split(' '));
        }
    }
    else {
        if (inputArguments) {
            (_c = ffmpegCommand.overallInputArguments).push.apply(_c, inputArguments.split(' '));
        }
        if (outputArguments) {
            (_d = ffmpegCommand.overallOuputArguments).push.apply(_d, outputArguments.split(' '));
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
