"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Video Framerate',
    description: 'Set Video Framerate. If the original framerate is lower than the'
        + ' specified framerate, the original framerate will be used.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: ffmpegCommandV2Utils_1.ffmpegCommandV2RequiresVersion,
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Framerate',
            name: 'framerate',
            type: 'number',
            defaultValue: '30',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify framerate value',
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
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, ffmpegCommandV2Utils_1.appendFfmpegCommandV2Operation)({
        args: args,
        pluginName: 'ffmpegCommandSetVdeoFramerate',
        operationType: 'setVideoFramerate',
        inputs: {
            framerate: Number(args.inputs.framerate),
        },
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
