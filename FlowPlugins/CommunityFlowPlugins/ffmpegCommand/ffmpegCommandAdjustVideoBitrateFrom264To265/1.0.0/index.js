"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Adjust Video Bitrate From h264 to h265',
    description: 'Adjust Video Bitrate when transcoding from x264 to x265, based on the logic that h265 can have a lower bitrate than h264 without losing quality.',
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
            label: 'Bitrate ratio (%)',
            name: 'bitrate_ratio',
            type: 'number',
            defaultValue: '50',
            inputUI: {
                type: 'slider',
                sliderOptions: { max: 90, min: 10 }
            },
            tooltip: "Specify the ratio used to adjust the bitrate.\n                          \\nExample:\\n\n                          50\n      \n                          \\nExample:\\n\n                          60",
        },
        {
            label: 'Bitrate cutoff (kbps)',
            name: 'bitrate_cutoff',
            type: 'number',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the cutoff value for the bitrate. If the calculated target bitrate is lower then the cutoff value will used as the target bitrate.\n                          \\n Leave empty to disable.\n                          \\nExample:\\n\n                          2500\n      \n                          \\nExample:\\n\n                          3500",
        }
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
    var _a, _b, _c, _d, _e;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var bitrate_cutoff = Number(args.inputs.bitrate_cutoff);
    var bitrate_ratio = Number(args.inputs.bitrate_ratio);
    // Duration can be found (or not) at multiple spots, trying to cover all of them here.
    var duration = Number((_b = (_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.format) === null || _b === void 0 ? void 0 : _b.duration)
        || ((_c = args.inputFileObj.meta) === null || _c === void 0 ? void 0 : _c.Duration)
        || ((_e = (_d = args.inputFileObj.ffProbeData.streams) === null || _d === void 0 ? void 0 : _d.find(function (stream) { return stream.codec_type === 'video'; })) === null || _e === void 0 ? void 0 : _e.duration)
        || -1;
    if (duration !== -1 && typeof args.inputFileObj.file_size) {
        var durationInMinutes = duration * 0.0166667;
        var currentBitrate_1 = ~~(args.inputFileObj.file_size / (durationInMinutes * 0.0075));
        var calculatedAdjustedBitrate = ~~(currentBitrate_1 * bitrate_ratio / 100);
        var targetBitrate_1 = ~~(calculatedAdjustedBitrate > bitrate_cutoff ? calculatedAdjustedBitrate : bitrate_cutoff);
        var calculatedMinimumBitrate = ~~(targetBitrate_1 * 0.7);
        var minimumBitrate_1 = ~~(calculatedMinimumBitrate > bitrate_cutoff ? calculatedMinimumBitrate : bitrate_cutoff);
        var maximumBitrate_1 = ~~(targetBitrate_1 * 1.3);
        args.jobLog("currentBitrate ".concat(String(currentBitrate_1), "k; calculatedAdjustedBitrate ").concat(String(calculatedAdjustedBitrate), "k; targetBitrate ").concat(String(targetBitrate_1), "k; minimumBitrate ").concat(String(minimumBitrate_1), "k; maximumBitrate ").concat(String(maximumBitrate_1), "k"));
        args.variables.ffmpegCommand.streams.forEach(function (stream) {
            if (stream.codec_type === 'video') {
                stream.outputArgs.push("-b:".concat((0, fileUtils_1.getFfType)(stream.codec_type), ":{outputTypeIndex}"), "".concat(String(targetBitrate_1), "k"));
                stream.outputArgs.push('-minrate', "".concat(String(minimumBitrate_1), "k"));
                stream.outputArgs.push('-maxrate', "".concat(String(maximumBitrate_1), "k"));
                stream.outputArgs.push('-bufsize', "".concat(String(currentBitrate_1), "k"));
            }
        });
    }
    else
        args.jobLog('Some data is missing (duration or file_size). Could not calculate bitrate.');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
