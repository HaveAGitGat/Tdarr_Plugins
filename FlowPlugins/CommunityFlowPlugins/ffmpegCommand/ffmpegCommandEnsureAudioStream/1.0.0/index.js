"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Ensure Audio Stream',
    description: 'Ensure that the file has an audio stream with set codec and channel count',
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
            label: 'Audio Encoder',
            name: 'audioEncoder',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'dropdown',
                options: [
                    'aac',
                    'ac3',
                    'eac3',
                    'dca',
                    'flac',
                    'libopus',
                    'mp2',
                    'libmp3lame',
                    'truehd',
                ],
            },
            tooltip: 'Enter the desired audio codec',
        },
        {
            label: 'Language',
            name: 'language',
            type: 'string',
            defaultValue: 'en',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Tdarr will check to see if the stream language tag includes the tag you specify.'
                + ' Case-insensitive. One tag only',
        },
        {
            label: 'Channels',
            name: 'channels',
            type: 'number',
            defaultValue: '2',
            inputUI: {
                type: 'dropdown',
                options: [
                    '1',
                    '2',
                    '6',
                    '8',
                ],
            },
            tooltip: 'Enter the desired number of channels',
        },
        {
            label: 'Enable Bitrate',
            name: 'enableBitrate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting audio bitrate',
        },
        {
            label: 'Bitrate',
            name: 'bitrate',
            type: 'string',
            defaultValue: '128k',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio bitrate for newly added channels',
        },
        {
            label: 'Enable Samplerate',
            name: 'enableSamplerate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting audio samplerate',
        },
        {
            label: 'Samplerate',
            name: 'samplerate',
            type: 'string',
            defaultValue: '48k',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableSamplerate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio samplerate for newly added channels',
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
var getHighest = function (first, second) {
    // @ts-expect-error channels
    if ((first === null || first === void 0 ? void 0 : first.channels) > (second === null || second === void 0 ? void 0 : second.channels)) {
        return first;
    }
    return second;
};
var attemptMakeStream = function (_a) {
    var args = _a.args, langTag = _a.langTag, streams = _a.streams, audioCodec = _a.audioCodec, audioEncoder = _a.audioEncoder, wantedChannelCount = _a.wantedChannelCount;
    var enableBitrate = Boolean(args.inputs.enableBitrate);
    var bitrate = String(args.inputs.bitrate);
    var enableSamplerate = Boolean(args.inputs.enableSamplerate);
    var samplerate = String(args.inputs.samplerate);
    var langMatch = function (stream) {
        var _a;
        return ((langTag === 'und'
            && (stream.tags === undefined || stream.tags.language === undefined))
            || (((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) && stream.tags.language.toLowerCase().includes(langTag)));
    };
    // filter streams to only include audio streams with the specified lang tag
    var streamsWithLangTag = streams.filter(function (stream) {
        if (stream.codec_type === 'audio'
            && langMatch(stream)) {
            return true;
        }
        return false;
    });
    if (streamsWithLangTag.length === 0) {
        args.jobLog("No streams with language tag ".concat(langTag, " found. Skipping \n"));
        return false;
    }
    // get the stream with the highest channel count
    var streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
    var highestChannelCount = Number(streamWithHighestChannel.channels);
    var targetChannels = 0;
    if (wantedChannelCount <= highestChannelCount) {
        targetChannels = wantedChannelCount;
        args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is <= than the")
            + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
    }
    else {
        targetChannels = highestChannelCount;
        args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is higher than the")
            + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
    }
    var hasStreamAlready = streams.filter(function (stream) {
        if (stream.codec_type === 'audio'
            && langMatch(stream)
            && stream.codec_name === audioCodec
            && stream.channels === targetChannels) {
            return true;
        }
        return false;
    });
    if (hasStreamAlready.length > 0) {
        args.jobLog("File already has ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        return true;
    }
    args.jobLog("Adding ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
    var streamCopy = JSON.parse(JSON.stringify(streamWithHighestChannel));
    streamCopy.removed = false;
    streamCopy.index = streams.length;
    streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder);
    streamCopy.outputArgs.push('-ac', "".concat(targetChannels));
    if (enableBitrate) {
        var ffType = (0, fileUtils_1.getFfType)(streamCopy.codec_type);
        streamCopy.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate));
    }
    if (enableSamplerate) {
        streamCopy.outputArgs.push('-ar', "".concat(samplerate));
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    streams.push(streamCopy);
    return true;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var audioEncoder = String(args.inputs.audioEncoder);
    var langTag = String(args.inputs.language).toLowerCase();
    var wantedChannelCount = Number(args.inputs.channels);
    var streams = args.variables.ffmpegCommand.streams;
    var audioCodec = audioEncoder;
    if (audioEncoder === 'dca') {
        audioCodec = 'dts';
    }
    if (audioEncoder === 'libmp3lame') {
        audioCodec = 'mp3';
    }
    if (audioEncoder === 'libopus') {
        audioCodec = 'opus';
    }
    var addedOrExists = attemptMakeStream({
        args: args,
        langTag: langTag,
        streams: streams,
        audioCodec: audioCodec,
        audioEncoder: audioEncoder,
        wantedChannelCount: wantedChannelCount,
    });
    if (!addedOrExists) {
        attemptMakeStream({
            args: args,
            langTag: 'und',
            streams: streams,
            audioCodec: audioCodec,
            audioEncoder: audioEncoder,
            wantedChannelCount: wantedChannelCount,
        });
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
