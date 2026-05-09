"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Remove Stream By Property',
    description: 'Remove Stream By Property',
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
            label: 'Codec Type',
            name: 'codecType',
            type: 'string',
            defaultValue: 'any',
            inputUI: {
                type: 'dropdown',
                options: [
                    'audio',
                    'video',
                    'subtitle',
                    'any',
                ],
            },
            tooltip: "\n      Stream Codec Type to check against the property.\n        ",
        },
        {
            label: 'Property To Check',
            name: 'propertyToCheck',
            type: 'string',
            defaultValue: 'codec_name',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        What characteristic of your media file do you want to check?\n\n        Common examples:\n        - codec_name - What audio/video format is used (like aac, mp3, h264, etc.)\n        - width - Video width in pixels\n        - height - Video height in pixels\n        - channels - Number of audio channels (2 for stereo, 6 for 5.1 surround, etc.)\n        - sample_rate - Audio quality (like 44100, 48000)\n        - bit_rate - Quality/file size (higher = better quality, larger file)\n        - tags.language - Audio/subtitle language (like eng, spa, fre)\n        - codec_type - Whether it's \"video\", \"audio\", or \"subtitle\"\n\n        Enter the exact property name you want to check.\n        ",
        },
        {
            label: 'Values To Remove',
            name: 'valuesToRemove',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        What values are you looking to remove? Separate multiple values with commas.\n\n        Examples based on what you're checking:\n        - For audio formats: aac,mp3,ac3\n        - For video formats: h264,h265,hevc\n        - For languages: eng,spa,fre\n        - For video sizes: 1920 (for width) or 1080 (for height)\n        - For audio channels: 2,6,8\n        - For stream types: audio,video,subtitle\n\n        The plugin will look for files that have any of these values.\n        ",
        },
        {
            label: 'Condition',
            name: 'condition',
            type: 'string',
            defaultValue: 'includes',
            inputUI: {
                type: 'dropdown',
                options: [
                    'includes',
                    'not_includes',
                    'equals',
                    'not_equals',
                ],
            },
            tooltip: "\n      How should the plugin match your values?\n\n      - \"includes\" - Find streams that HAVE any of your values\n        Example: If checking for \"aac,mp3\" audio, streams with aac OR mp3 will match\n\n      - \"not_includes\" - Find streams that DON'T have any of your values\n        Example: If checking for \"aac,mp3\" audio, only streams with neither aac nor mp3 will match\n\n      - \"equals\" - Find streams where the property exactly matches your values\n        Example: If checking width for \"1920\", only streams that are exactly 1920 pixels wide will match\n\n      - \"not_equals\" - Find streams where the property doesn't exactly match any of your values\n        Example: If checking width for \"1920\", streams that are NOT exactly 1920 pixels wide will match\n\n      Most users want \"includes\" to find streams that have what they're looking for.\n      ",
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
        pluginName: 'ffmpegCommandRemoveStreamByProperty',
        operationType: 'removeStreamByProperty',
        inputs: {
            codecType: String(args.inputs.codecType).trim(),
            propertyToCheck: String(args.inputs.propertyToCheck).trim(),
            valuesToRemove: String(args.inputs.valuesToRemove).trim(),
            condition: String(args.inputs.condition),
        },
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
