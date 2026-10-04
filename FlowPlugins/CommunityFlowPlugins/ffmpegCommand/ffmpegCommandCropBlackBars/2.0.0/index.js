"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Crop Black Bars',
    description: 'Automatically detect and crop black bars from video using ffmpeg cropdetect.'
        + ' Samples multiple points in the video to find consistent crop values.'
        + ' Only crops if black bars exceed the configured threshold.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: ffmpegCommandV2Utils_1.ffmpegCommandV2RequiresVersion,
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Crop Mode',
            name: 'cropMode',
            type: 'string',
            defaultValue: 'mostCommon',
            inputUI: {
                type: 'dropdown',
                options: [
                    'mostCommon',
                    'minimum',
                    'maximum',
                ],
            },
            tooltip: 'How to select the final crop from all detected values.'
                + ' "mostCommon" picks the crop value that appears most often across samples.'
                + ' "minimum" picks the least aggressive crop (preserves the most content).'
                + ' "maximum" picks the most aggressive crop (removes the most black bars).',
        },
        {
            label: 'Crop Threshold',
            name: 'cropThreshold',
            type: 'number',
            defaultValue: '24',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Threshold for cropdetect filter (0-255). Higher values treat brighter pixels as black'
                + ' and can help detect bars on HDR/10-bit sources. Default is 24.'
                + ' Lower values are stricter and reduce false crops in dark scenes.',
        },
        {
            label: 'Sample Count',
            name: 'sampleCount',
            type: 'number',
            defaultValue: '5',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Number of sample points to analyse across the video duration.'
                + ' More samples give more accurate detection but take longer. Default is 5.',
        },
        {
            label: 'Frames Per Sample',
            name: 'framesPerSample',
            type: 'number',
            defaultValue: '30',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Number of frames to analyse per sample point. Default is 30.',
        },
        {
            label: 'Minimum Crop Percentage',
            name: 'minCropPercent',
            type: 'number',
            defaultValue: '2',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Minimum percentage of the image that must be cropped for the crop to be applied.'
                + ' Prevents tiny crops that may be detection noise. Default is 2%.',
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
    (0, ffmpegCommandV2Utils_1.appendFfmpegCommandV2Operation)({
        args: args,
        pluginName: 'ffmpegCommandCropBlackBars',
        operationType: 'cropBlackBars',
        inputs: {
            cropMode: String(args.inputs.cropMode),
            cropThreshold: String(args.inputs.cropThreshold),
            sampleCount: String(args.inputs.sampleCount),
            framesPerSample: String(args.inputs.framesPerSample),
            minCropPercent: String(args.inputs.minCropPercent),
        },
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
