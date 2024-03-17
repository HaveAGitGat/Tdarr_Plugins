"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Audio Codec',
    description: 'Check if a file has a specific audio codec',
    style: {
        borderColor: 'orange',
    },
    tags: 'audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'Codec',
            name: 'codec',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'dropdown',
                options: [
                    'aac',
                    'ac3',
                    'eac3',
                    'dca',
                    'dts',
                    'flac',
                    'mp2',
                    'mp3',
                    'opus',
                    'truehd',
                    'vorbis',
                    'wav',
                    'wma',
                ],
            },
            tooltip: 'Specify the codec check for',
        },
        {
            label: 'Check Bitrate',
            name: 'checkBitrate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to check the bitrate of the audio codec is within a range.',
        },
        {
            label: 'Greater Than',
            name: 'greaterThan',
            type: 'number',
            defaultValue: '50000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'checkBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify lower bound.',
        },
        {
            label: 'Less Than',
            name: 'lessThan',
            type: 'number',
            defaultValue: '1000000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'checkBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify upper bound.',
        },
        {
            label: 'Check Stream Position',
            name: 'checkStreamPosition',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to check the position of the audio codec.',
        },
        {
            label: 'Position',
            name: 'streamPosition',
            type: 'number',
            defaultValue: '1',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'checkStreamPosition',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify expected stream position.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File has codec',
        },
        {
            number: 2,
            tooltip: 'File does not have codec',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var checkBitrate = Boolean(args.inputs.checkBitrate);
    var greaterThan = Number(args.inputs.greaterThan);
    var lessThan = Number(args.inputs.lessThan);
    var hasBitrate = false;
    var checkStreamPosition = Boolean(args.inputFileObj.checkStreamPosition);
    var streamPosition = Number(args.inputs.streamPosition);
    var hasStreamPosition = false;
    var hasCodec = false;
    if (args.inputFileObj.ffProbeData.streams) {
        args.inputFileObj.ffProbeData.streams.forEach(function (stream, index) {
            var _a, _b, _c;
            // reset for each stream
            hasStreamPosition = false;
            hasBitrate = false;
            if (stream.codec_type === 'audio' && stream.codec_name === args.inputs.codec) {
                args.jobLog("test ".concat(index, " ").concat(hasCodec, " ").concat(stream.codec_name, " ").concat(hasStreamPosition, " ").concat(hasBitrate));
                if (checkStreamPosition) {
                    hasStreamPosition = (index + 1) === streamPosition;
                    if (hasStreamPosition) {
                        args.jobLog("File has codec at stream position: ".concat(index));
                    }
                    else {
                        args.jobLog("File does not have codec at stream position: ".concat(index));
                    }
                }
                if (checkBitrate) {
                    var ffprobeBitrate = Number(stream.bit_rate || 0);
                    if (ffprobeBitrate > greaterThan && ffprobeBitrate < lessThan) {
                        args.jobLog("File has codec: ".concat(args.inputs.codec, " with bitrate")
                            + " ".concat(ffprobeBitrate, " between ").concat(greaterThan, " and ").concat(lessThan));
                        hasBitrate = true;
                    }
                    var mediaInfoBitrate = Number(((_c = (_b = (_a = args.inputFileObj.mediaInfo) === null || _a === void 0 ? void 0 : _a.track) === null || _b === void 0 ? void 0 : _b[index + 1]) === null || _c === void 0 ? void 0 : _c.BitRate) || 0);
                    if (mediaInfoBitrate > greaterThan && mediaInfoBitrate < lessThan) {
                        args.jobLog("File has codec: ".concat(args.inputs.codec, " with bitrate")
                            + " ".concat(mediaInfoBitrate, " between ").concat(greaterThan, " and ").concat(lessThan));
                        hasBitrate = true;
                    }
                    if (!hasBitrate) {
                        args.jobLog("File does not have codec: ".concat(args.inputs.codec, " ").concat(checkBitrate ? 'with '
                            + "bitrate between ".concat(greaterThan, " and ").concat(lessThan) : ''));
                    }
                }
                if ((!checkStreamPosition || hasStreamPosition) && (!checkBitrate || hasBitrate)) {
                    args.jobLog("2 ".concat(!checkStreamPosition, " ").concat(hasStreamPosition));
                    args.jobLog("File has codec: ".concat(args.inputs.codec));
                    hasCodec = true;
                }
            }
        });
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: hasCodec ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
