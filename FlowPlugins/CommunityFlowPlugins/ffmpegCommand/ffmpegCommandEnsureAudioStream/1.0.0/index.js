"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var audioCodecNames = {
    dca: 'dts',
    libopus: 'opus',
    libmp3lame: 'mp3',
};
var audioTrackTitles = {
    libopus: 'Opus',
    truehd: 'TrueHD',
};
var channelTitles = {
    1: '1.0',
    2: '2.0',
    6: '5.1',
    8: '7.1',
};
var channelLayouts = {
    1: 'mono',
    2: 'stereo',
    6: '5.1',
    8: '7.1',
};
var getAudioCodecName = function (audioEncoder) { return audioCodecNames[audioEncoder] || audioEncoder; };
var getTrackTitle = function (audioEncoder, channels) { return ("".concat(audioTrackTitles[audioEncoder] || getAudioCodecName(audioEncoder).toUpperCase())
    + " ".concat(channelTitles[channels] || "".concat(channels, " channels"))); };
var codecTitlePrefix = new RegExp('^(?:dts(?:-?hd)?|e-?ac-?3|ac-?3|aac|dca|flac|opus|mp2|mp3|truehd)'
    + '(?:\\s+(?:hd|ma|hra|master audio|atmos))*'
    + '(?:\\s+\\d(?:\\.\\d)?(?:\\s*channels?)?)?(?=$|\\s)', 'i');
var getOutputTrackTitle = function (sourceTitle, audioEncoder, channels) {
    var trackTitle = getTrackTitle(audioEncoder, channels);
    var trimmedTitle = sourceTitle === null || sourceTitle === void 0 ? void 0 : sourceTitle.trim();
    if (!trimmedTitle) {
        return trackTitle;
    }
    return trimmedTitle.replace(codecTitlePrefix, trackTitle).trim();
};
var parseRate = function (rate) {
    var normalizedRate = rate.trim().toLowerCase();
    var rateMatch = normalizedRate.match(/^(\d+(?:\.\d+)?)(k?)$/);
    if (!rateMatch) {
        return undefined;
    }
    var multiplier = rateMatch[2] === 'k' ? 1000 : 1;
    return Math.round(Number(rateMatch[1]) * multiplier);
};
var attemptMakeStream = function (_a) {
    var _b;
    var args = _a.args, langTag = _a.langTag, streams = _a.streams, audioEncoder = _a.audioEncoder, wantedChannelCount = _a.wantedChannelCount;
    var enableBitrate = Boolean(args.inputs.enableBitrate);
    var bitrate = String(args.inputs.bitrate);
    var enableSamplerate = Boolean(args.inputs.enableSamplerate);
    var samplerate = String(args.inputs.samplerate);
    var audioCodecName = getAudioCodecName(audioEncoder);
    var langMatch = function (stream) {
        var _a;
        return ((langTag === 'und'
            && (stream.tags === undefined || stream.tags.language === undefined))
            || (((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) && stream.tags.language.toLowerCase().includes(langTag)));
    };
    // filter streams to only include audio streams with the specified lang tag
    var streamsWithLangTag = streams.filter(function (stream) { return stream.codec_type === 'audio' && langMatch(stream); });
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
    var hasStreamAlready = streams.some(function (stream) { return (stream.codec_type === 'audio'
        && langMatch(stream)
        && stream.codec_name === audioCodecName
        && stream.channels === targetChannels); });
    if (hasStreamAlready) {
        args.jobLog("File already has ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        return true;
    }
    args.jobLog("Adding ".concat(langTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
    var streamCopy = JSON.parse(JSON.stringify(streamWithHighestChannel));
    streamCopy.removed = false;
    streamCopy.index = streams.length;
    // Keep planned stream metadata aligned for subsequent command plugins.
    var trackTitle = getOutputTrackTitle((_b = streamCopy.tags) === null || _b === void 0 ? void 0 : _b.title, audioEncoder, targetChannels);
    streamCopy.codec_name = audioCodecName;
    streamCopy.channels = targetChannels;
    if (channelLayouts[targetChannels]) {
        streamCopy.channel_layout = channelLayouts[targetChannels];
    }
    else {
        delete streamCopy.channel_layout;
    }
    streamCopy.tags = __assign(__assign({}, (streamCopy.tags || {})), { title: trackTitle });
    delete streamCopy.codec_long_name;
    delete streamCopy.profile;
    streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder);
    streamCopy.outputArgs.push('-ac', "".concat(targetChannels));
    streamCopy.outputArgs.push('-metadata:s:a:{outputTypeIndex}', "title=".concat(trackTitle));
    if (enableBitrate) {
        var ffType = (0, fileUtils_1.getFfType)(streamCopy.codec_type);
        streamCopy.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate));
        var parsedBitrate = parseRate(bitrate);
        if (parsedBitrate !== undefined) {
            streamCopy.bit_rate = parsedBitrate;
        }
    }
    if (enableSamplerate) {
        streamCopy.outputArgs.push('-ar', "".concat(samplerate));
        var parsedSamplerate = parseRate(samplerate);
        if (parsedSamplerate !== undefined) {
            streamCopy.sample_rate = String(parsedSamplerate);
        }
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
    var addedOrExists = attemptMakeStream({
        args: args,
        langTag: langTag,
        streams: streams,
        audioEncoder: audioEncoder,
        wantedChannelCount: wantedChannelCount,
    });
    if (!addedOrExists) {
        attemptMakeStream({
            args: args,
            langTag: 'und',
            streams: streams,
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
