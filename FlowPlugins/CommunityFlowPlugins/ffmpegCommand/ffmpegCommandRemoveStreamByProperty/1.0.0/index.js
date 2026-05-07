"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
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
    requiresVersion: '2.11.01',
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
            tooltip: "\n        What characteristic of your media file do you want to check?\n        \n        Common examples:\n        \u2022 codec_name - What audio/video format is used (like aac, mp3, h264, etc.)\n        \u2022 width - Video width in pixels\n        \u2022 height - Video height in pixels  \n        \u2022 channels - Number of audio channels (2 for stereo, 6 for 5.1 surround, etc.)\n        \u2022 sample_rate - Audio quality (like 44100, 48000)\n        \u2022 bit_rate - Quality/file size (higher = better quality, larger file)\n        \u2022 tags.language - Audio/subtitle language (like eng, spa, fre)\n        \u2022 codec_type - Whether it's \"video\", \"audio\", or \"subtitle\"\n        \n        Enter the exact property name you want to check.\n        ",
        },
        {
            label: 'Values To Remove',
            name: 'valuesToRemove',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        What values are you looking to remove? Separate multiple values with commas.\n        \n        Examples based on what you're checking:\n        \u2022 For audio formats: aac,mp3,ac3\n        \u2022 For video formats: h264,h265,hevc\n        \u2022 For languages: eng,spa,fre\n        \u2022 For video sizes: 1920 (for width) or 1080 (for height)\n        \u2022 For audio channels: 2,6,8\n        \u2022 For stream types: audio,video,subtitle\n        \n        The plugin will look for files that have any of these values.\n        ",
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
            tooltip: "\n      How should the plugin match your values?\n      \n      \u2022 \"includes\" - Find streams that HAVE any of your values\n        Example: If checking for \"aac,mp3\" audio, streams with aac OR mp3 will match\n        \n      \u2022 \"not_includes\" - Find streams that DON'T have any of your values\n        Example: If checking for \"aac,mp3\" audio, only streams with neither aac nor mp3 will match\n        \n      \u2022 \"equals\" - Find streams where the property exactly matches your values\n        Example: If checking width for \"1920\", only streams that are exactly 1920 pixels wide will match\n        \n      \u2022 \"not_equals\" - Find streams where the property doesn't exactly match any of your values\n        Example: If checking width for \"1920\", streams that are NOT exactly 1920 pixels wide will match\n        \n      Most users want \"includes\" to find streams that have what they're looking for.\n      ",
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
    var codecType = String(args.inputs.codecType).trim();
    var propertyToCheck = String(args.inputs.propertyToCheck).trim();
    var valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map(function (item) { return item.trim(); })
        .filter(function (row) { return row.length > 0; });
    var condition = String(args.inputs.condition);
    args.variables.ffmpegCommand.streams
        .filter(function (stream) { return codecType === 'any' || stream.codec_type === codecType; })
        .forEach(function (stream) {
        var _a;
        var target = '';
        if (propertyToCheck.includes('.')) {
            var parts = propertyToCheck.split('.');
            target = (_a = stream[parts[0]]) === null || _a === void 0 ? void 0 : _a[parts[1]];
        }
        else {
            target = stream[propertyToCheck];
        }
        if (target === undefined || target === null) {
            return;
        }
        var prop = String(target).toLowerCase();
        var lowerValues = valuesToRemove.map(function (val) { return val.toLowerCase(); });
        // For includes:      remove if the property includes ANY of the values
        // For not_includes:  remove if the property includes NONE of the values
        // For equals:        remove if the property exactly matches ANY of the values
        // For not_equals:    remove if the property exactly matches NONE of the values
        var shouldRemove = false;
        switch (condition) {
            case 'includes':
                shouldRemove = lowerValues.some(function (val) { return prop.includes(val); });
                break;
            case 'not_includes':
                shouldRemove = !lowerValues.some(function (val) { return prop.includes(val); });
                break;
            case 'equals':
                shouldRemove = lowerValues.some(function (val) { return prop === val; });
                break;
            case 'not_equals':
                shouldRemove = !lowerValues.some(function (val) { return prop === val; });
                break;
            default:
                shouldRemove = false;
        }
        var valuesStr = valuesToRemove.join(', ');
        var action = shouldRemove ? 'Removing' : 'Keep';
        // eslint-disable-next-line max-len
        args.jobLog("".concat(action, " stream index ").concat(stream.index, " because ").concat(propertyToCheck, " of ").concat(prop, " ").concat(condition, " ").concat(valuesStr, "\n"));
        if (shouldRemove) {
            // eslint-disable-next-line no-param-reassign
            stream.removed = true;
        }
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
