"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Audio Remove Duplicate Streams',
    description: 'Remove Duplicate Audio Streams of each Language.',
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
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var findNumberOfAudioStream = function (args) {
    if (args.inputFileObj.ffProbeData.streams) {
        var number = args.inputFileObj.ffProbeData.streams.filter(function (stream) { return stream.codec_type === 'audio'; }).length;
        return number;
    }
    return 0;
};
var getHighest = function (first, second) {
    // @ts-expect-error channels
    if ((first === null || first === void 0 ? void 0 : first.channels) > (second === null || second === void 0 ? void 0 : second.channels)) {
        return first;
    }
    return second;
};
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
var undstreams = function (args) {
    if (args.inputFileObj.ffProbeData.streams) {
        var ustreams = args.inputFileObj.ffProbeData.streams.filter(function (stream) {
            if (stream.codec_type === 'audio'
                && noCommentary(stream)
                && (!stream.tags
                    || !stream.tags.language
                    || stream.tags.language.toLowerCase().includes('und'))) {
                return true;
            }
            return false;
        });
        return ustreams;
    }
    throw new Error('Error finding undefined streams');
};
var langStreams = function (args, lang) {
    if (args.inputFileObj.ffProbeData.streams) {
        var lStreams = args.inputFileObj.ffProbeData.streams.filter(function (stream) {
            var _a, _b;
            if (stream.codec_type === 'audio'
                && ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(lang))
                && noCommentary(stream)) {
                return true;
            }
            return false;
        });
        return lStreams;
    }
    throw new Error('Error finding duplicate streams');
};
var removeDuplicates = function (args) {
    var numberOfAudioStreams = Number(findNumberOfAudioStream(args));
    var hasDUPS = false;
    var duplicates = [];
    var audioStreamsRemoved = 0;
    if (numberOfAudioStreams >= 2 && args.inputFileObj.ffProbeData.streams) {
        var tag_1 = [];
        var audioStreams = args.inputFileObj.ffProbeData.streams.filter(function (stream) {
            if (stream.codec_type === 'audio') {
                return true;
            }
            return false;
        });
        audioStreams.forEach(function (stream) {
            var lang = '';
            if (stream.tags !== undefined) {
                if (stream.tags.language !== undefined) {
                    lang = stream.tags.language.toLowerCase();
                }
                else {
                    lang = 'und';
                }
            }
            else {
                lang = 'und';
            }
            tag_1.push(lang);
        });
        duplicates = tag_1.filter(function (item, index) { return tag_1.indexOf(item) !== index; });
        if (duplicates.length >= 1) {
            hasDUPS = true;
        }
    }
    if (hasDUPS) {
        var highestDUPS_1 = [];
        var undhighestDUP = [];
        var undefIsDUP_1 = false;
        if (duplicates.includes('und')) {
            undefIsDUP_1 = true;
        }
        if (undefIsDUP_1) {
            var findundID = function (element) { return element === 'und'; };
            var iD = duplicates.findIndex(findundID);
            duplicates.splice(iD, 1);
            var undStreams = undstreams(args);
            var streamwithhighestChannelCount = undStreams.reduce(getHighest);
            undhighestDUP.push(streamwithhighestChannelCount);
        }
        duplicates.forEach(function (dup) {
            var streamWithTag = langStreams(args, dup);
            var streamwithhighestChannelCount = streamWithTag.reduce(getHighest);
            highestDUPS_1.push(streamwithhighestChannelCount);
        });
        var undhighestDUPSet_1 = new Set(undhighestDUP.map(function (element) { return element.index; }));
        var highestDUPSSet_1 = new Set(highestDUPS_1.map(function (element) { return element.index; }));
        args.variables.ffmpegCommand.streams.forEach(function (stream) {
            var _a;
            if (stream.codec_type !== 'audio') {
                return;
            }
            if (!undefIsDUP_1) {
                if (stream.tags === undefined
                    || stream.tags.language === undefined
                    || stream.tags.language.toLowerCase().includes('und')) {
                    return;
                }
            }
            if (undhighestDUPSet_1.has(stream.index) || highestDUPSSet_1.has(stream.index)) {
                return;
            }
            if (((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) && !duplicates.includes(stream.tags.language.toLowerCase())) {
                return;
            }
            args.jobLog("Removing Stream ".concat(stream.index, " Duplicate Detected"));
            // eslint-disable-next-line no-param-reassign
            stream.removed = true;
            audioStreamsRemoved += 1;
        });
    }
    if (audioStreamsRemoved === numberOfAudioStreams) {
        throw new Error('All audio streams would be removed.');
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    removeDuplicates(args);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
