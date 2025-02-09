"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Audio Streams Count',
    description: 'This plugin checks if the number of audio streams is equal, less or more than a specific number.',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'Streams Count',
            name: 'audioStreamsTarget',
            type: 'number',
            defaultValue: '1',
            inputUI: {
                type: 'slider',
                sliderOptions: {
                    min: 0,
                    max: 10,
                },
            },
            tooltip: 'Specify streams count to check for',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'The number of audio streams is equal',
        },
        {
            number: 2,
            tooltip: 'The number of audio streams is less',
        },
        {
            number: 3,
            tooltip: 'The number of audio streams is more',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var audioStreamsTarget = args.inputs.audioStreamsTarget;
    var ffProbeData = args.inputFileObj.ffProbeData;
    if (!ffProbeData || !ffProbeData.streams) {
        throw new Error('ffProbeData or ffProbeData.streams is not available.');
    }
    var streams = ffProbeData.streams;
    if (!Array.isArray(streams)) {
        throw new Error('File has no valid stream data');
    }
    args.jobLog("Checking for ".concat(audioStreamsTarget, " audio streams"));
    var audioStreamsCount = streams.reduce(function (count, stream) { return (stream.codec_type === 'audio' ? count + 1 : count); }, 0);
    args.jobLog("".concat(audioStreamsCount, " audio streams found"));
    var getOutputNumber = function (count, target) {
        if (count === target)
            return 1;
        if (count < target)
            return 2;
        return 3;
    };
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: getOutputNumber(audioStreamsCount, audioStreamsTarget),
        variables: args.variables,
    };
};
exports.plugin = plugin;
