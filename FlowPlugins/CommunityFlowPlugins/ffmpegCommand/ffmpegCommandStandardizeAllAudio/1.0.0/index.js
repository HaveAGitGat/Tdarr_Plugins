"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Standardize All Audio',
    description: 'Standardize All Audio to the same codec, with channel count and bit rate options.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'audio',
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
            defaultValue: 'ac3',
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
            tooltip: 'Enter the desired audio code',
        },
        {
            label: 'Channels',
            name: 'channels',
            type: 'number',
            defaultValue: '6',
            inputUI: {
                type: 'dropdown',
                options: [
                    '1',
                    '2',
                    '6',
                    '8',
                ],
            },
            tooltip: 'Enter the desired number of channel, certain channel counts are not supported with certain codec.',
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
            defaultValue: '300k',
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
            tooltip: 'Specify the audio bitrate for newly added channels',
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
var checkAbort = function (audioCodec, channelCount) {
    // channel count 1 not supported
    if ((['truehd'].includes(audioCodec))
        && channelCount === 1) {
        throw new Error("Selected ".concat(audioCodec, " does not support the channel count of ").concat(channelCount, ". Reconfigure the Plugin"));
    }
    // channel count 6 not supported
    if ((['dca', 'libmp3lame'].includes(audioCodec))
        && channelCount === 6) {
        throw new Error("Selected ".concat(audioCodec, " does not support the channel count of ").concat(channelCount, ". Reconfigure the Plugin"));
    }
    // channel count 8 not supported
    if ((['dca', 'libmp3lame', 'truehd', 'ac3', 'eac3'].includes(audioCodec))
        && channelCount === 8) {
        throw new Error("Selected ".concat(audioCodec, " does not support the channel count of ").concat(channelCount, ". Reconfigure the Plugin"));
    }
};
var transcodeStreams = function (args) {
    var enableBitrate = Boolean(args.inputs.enableBitrate);
    var bitrate = String(args.inputs.bitrate);
    var enableSamplerate = Boolean(args.inputs.enableSamplerate);
    var samplerate = String(args.inputs.samplerate);
    var audioEncoder = String(args.inputs.audioEncoder);
    var wantedChannelCount = Number(args.inputs.channels);
    checkAbort(audioEncoder, wantedChannelCount);
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type !== 'audio') {
            return;
        }
        var targetChannels = wantedChannelCount;
        if (stream.channels && stream.channels < wantedChannelCount) {
            targetChannels = Number(stream.channels);
        }
        args.jobLog("Processing Stream ".concat(stream.index, " Standardizing"));
        stream.outputArgs.push('-c:{outputIndex}', audioEncoder);
        stream.outputArgs.push('-ac:{outputIndex}', "".concat(targetChannels));
        if (enableBitrate) {
            var ffType = (0, fileUtils_1.getFfType)(stream.codec_type);
            stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate));
        }
        if (enableSamplerate) {
            stream.outputArgs.push('-ar:{outputIndex}', "".concat(samplerate));
        }
        if (['dca', 'truehd', 'flac'].includes(audioEncoder)) {
            stream.outputArgs.push('-strict', '-2');
        }
    });
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    transcodeStreams(args);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
