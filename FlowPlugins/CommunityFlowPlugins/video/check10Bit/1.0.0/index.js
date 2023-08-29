"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check 10 Bit Video',
    description: 'Check if a file is 10 bit video',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'File is 10 bit video',
        },
        {
            number: 2,
            tooltip: 'File is not 10 bit video',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var is10Bit = false;
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        if (stream.codec_type === 'video' && stream.bits_per_raw_sample === 10) {
            is10Bit = true;
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: is10Bit ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
