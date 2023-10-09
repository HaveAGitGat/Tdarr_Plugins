"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Video Streams Count',
    description: 'This plugin checks if the number of video streams is 1 or more.',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'File has one video stream',
        },
        {
            number: 2,
            tooltip: 'File has more than one video stream',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var ffProbeData = args.inputFileObj.ffProbeData;
    if (!ffProbeData || !ffProbeData.streams) {
        throw new Error('ffProbeData or ffProbeData.streams is not available.');
    }
    var videoStreams = ffProbeData.streams.filter(function (stream) { return stream.codec_type === 'video'; }).length;
    var outputNumber = 1; // Default to one video stream
    if (videoStreams === 0) {
        throw new Error('No video streams found in file.');
    }
    else if (videoStreams === 1) {
        outputNumber = 1; // One video stream
    }
    else if (videoStreams > 1) {
        outputNumber = 2; // More than one video stream
    }
    args.jobLog("Number of video streams: ".concat(videoStreams));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
