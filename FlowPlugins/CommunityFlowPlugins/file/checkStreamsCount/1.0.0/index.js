"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var details = function () { return ({
    name: 'Check Streams Count',
    description: 'This plugin checks if the number of streams for a selected stream type is equal, less or more '
        + 'than a specific number.',
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
            label: 'Stream Type',
            name: 'streamType',
            type: 'string',
            defaultValue: 'video',
            inputUI: {
                type: 'dropdown',
                options: [
                    'video',
                    'audio',
                    'subtitle',
                    'attachment',
                    'data',
                ],
            },
            tooltip: 'Specify the stream type to count',
        },
        {
            label: 'Streams Count',
            name: 'streamsTarget',
            type: 'number',
            defaultValue: '1',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify streams count to check for',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'The number of selected streams is less',
        },
        {
            number: 2,
            tooltip: 'The number of selected streams is equal',
        },
        {
            number: 3,
            tooltip: 'The number of selected streams is more',
        },
    ],
}); };
exports.details = details;
var getOutputNumber = function (count, target) {
    if (count < target)
        return 1;
    if (count === target)
        return 2;
    return 3;
};
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var _a = args.inputs, streamType = _a.streamType, streamsTarget = _a.streamsTarget;
    var ffProbeData = args.inputFileObj.ffProbeData;
    if (!ffProbeData || !ffProbeData.streams) {
        throw new Error('ffProbeData or ffProbeData.streams is not available.');
    }
    var streams = ffProbeData.streams;
    if (!Array.isArray(streams)) {
        throw new Error('File has no valid stream data');
    }
    args.jobLog("Checking for ".concat(streamsTarget, " ").concat(streamType, " streams"));
    var streamsCount = streams.reduce(function (count, stream) { return (stream.codec_type === streamType ? count + 1 : count); }, 0);
    args.jobLog("".concat(streamsCount, " ").concat(streamType, " streams found"));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: getOutputNumber(streamsCount, streamsTarget),
        variables: args.variables,
    };
};
exports.plugin = plugin;
