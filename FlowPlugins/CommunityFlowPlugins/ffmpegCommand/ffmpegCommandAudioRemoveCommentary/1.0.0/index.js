"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Audio Remove Commentary',
    description: 'Checks all Audio streams for commentary and removes them',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Go to Next Plugin',
        },
    ],
}); };
exports.details = details;
var noCommentary = function (stream) {
    if (!stream.tags || !stream.tags.title) {
        return true;
    }
    if (stream.tags.title.toLowerCase().includes('commentary')
        || stream.tags.title.toLowerCase().includes('description')
        || stream.tags.title.toLowerCase().includes('sdh')) {
        return false;
    }
    return true;
};
var findNumberOfAudioStream = function (args) {
    if (args.inputFileObj.ffProbeData.streams) {
        var number = args.inputFileObj.ffProbeData.streams.filter(function (stream) { return stream.codec_type === 'audio'; }).length;
        return number;
    }
    return 0;
};
var removeCommentary = function (args) {
    var numberOfAudioStreams = Number(findNumberOfAudioStream(args));
    var audioStreamsRemoved = 0;
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type !== 'audio') {
            return;
        }
        if (noCommentary(stream)) {
            return;
        }
        args.jobLog("Removing Stream ".concat(stream.index, " Commentray Detected"));
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
        audioStreamsRemoved += 1;
    });
    if (audioStreamsRemoved === numberOfAudioStreams) {
        throw new Error('All audio streams would be removed.');
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    removeCommentary(args);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
