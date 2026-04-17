"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Video Bitrate',
    description: 'Set Video Bitrate',
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
            label: 'Use % of Input Bitrate',
            name: 'useInputBitrate',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to use a % of input bitrate as the output bitrate',
        },
        {
            label: 'Target Bitrate %',
            name: 'targetBitratePercent',
            type: 'string',
            defaultValue: '50',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useInputBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the target bitrate as a % of the input bitrate',
        },
        {
            label: 'Fallback Bitrate',
            name: 'fallbackBitrate',
            type: 'string',
            defaultValue: '4000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useInputBitrate',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify fallback bitrate in kbps if input bitrate is not available',
        },
        {
            label: 'Bitrate',
            name: 'bitrate',
            type: 'string',
            defaultValue: '5000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useInputBitrate',
                                    value: 'true',
                                    condition: '!==',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify bitrate in kbps',
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var useInputBitrate = args.inputs.useInputBitrate;
    var targetBitratePercent = String(args.inputs.targetBitratePercent);
    var fallbackBitrate = String(args.inputs.fallbackBitrate);
    var bitrate = String(args.inputs.bitrate);
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        var _a, _b, _c;
        if (stream.codec_type === 'video') {
            var ffType = (0, fileUtils_1.getFfType)(stream.codec_type);
            if (useInputBitrate) {
                args.jobLog('Attempting to use % of input bitrate as output bitrate');
                // check if input bitrate is available
                var tracks = (_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.track;
                var inputBitrate = (_c = tracks === null || tracks === void 0 ? void 0 : tracks.find(function (x) { return x.StreamOrder === stream.index.toString(); })) === null || _c === void 0 ? void 0 : _c.BitRate;
                if (inputBitrate) {
                    args.jobLog("Found input bitrate: ".concat(inputBitrate));
                    // @ts-expect-error type
                    inputBitrate = parseInt(inputBitrate, 10) / 1000;
                    var targetBitrate = (inputBitrate * (parseInt(targetBitratePercent, 10) / 100));
                    args.jobLog("Setting video bitrate as ".concat(targetBitrate, "k"));
                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(targetBitrate, "k"));
                }
                else {
                    args.jobLog("Unable to find input bitrate, setting fallback bitrate as ".concat(fallbackBitrate, "k"));
                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(fallbackBitrate, "k"));
                }
            }
            else {
                args.jobLog("Using fixed bitrate. Setting video bitrate as ".concat(bitrate, "k"));
                stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate, "k"));
            }
        }
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
