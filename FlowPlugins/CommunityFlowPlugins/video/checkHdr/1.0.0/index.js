"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check HDR',
    description: 'Check if video is HDR',
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
            tooltip: 'File is HDR',
        },
        {
            number: 2,
            tooltip: 'File is not HDR',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var isHdr = false;
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        if (stream.codec_type === 'video'
            && stream.transfer_characteristics === 'smpte2084'
            && stream.color_primaries === 'bt2020'
            && stream.color_range === 'tv') {
            isHdr = true;
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isHdr ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
