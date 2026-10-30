"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Begin Command',
    description: 'Begin creating an order-independent FFmpeg command for the current working file.'
        + ' Should be used before any other v2 FFmpeg command plugins.',
    style: {
        borderColor: 'green',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: ffmpegCommandV2Utils_1.ffmpegCommandV2RequiresVersion,
    sidebarPosition: 1,
    icon: '',
    inputs: [],
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
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    args.variables.ffmpegCommandV2 = {
        version: 2,
        init: true,
        sourceFileId: args.inputFileObj._id,
        operations: [],
    };
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
