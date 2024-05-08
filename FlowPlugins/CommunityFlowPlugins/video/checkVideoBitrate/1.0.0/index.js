"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Video Bitrate',
    description: 'Check if video bitrate is within a specific range',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'Unit',
            name: 'unit',
            type: 'string',
            defaultValue: 'kbps',
            inputUI: {
                type: 'dropdown',
                options: [
                    'bps',
                    'kbps',
                    'mbps',
                ],
            },
            tooltip: 'Specify the unit to use',
        },
        {
            label: 'Greater Than',
            name: 'greaterThan',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify lower bound',
        },
        {
            label: 'Less Than',
            name: 'lessThan',
            type: 'number',
            defaultValue: '10000',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify upper bound',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File within range',
        },
        {
            number: 2,
            tooltip: 'File not within range',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var isWithinRange = false;
    var greaterThanBits = Number(args.inputs.greaterThan);
    var lessThanBits = Number(args.inputs.lessThan);
    if (args.inputs.unit === 'kbps') {
        greaterThanBits *= 1000;
        lessThanBits *= 1000;
    }
    else if (args.inputs.unit === 'mbps') {
        greaterThanBits *= 1000000;
        lessThanBits *= 1000000;
    }
    var hasVideoBitrate = false;
    if ((_b = (_a = args.inputFileObj) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.track) {
        args.inputFileObj.mediaInfo.track.forEach(function (stream) {
            if (stream['@type'].toLowerCase() === 'video') {
                if (stream.BitRate) {
                    hasVideoBitrate = true;
                    args.jobLog("Found video bitrate: ".concat(stream.BitRate));
                }
                if (stream.BitRate >= greaterThanBits && stream.BitRate <= lessThanBits) {
                    isWithinRange = true;
                }
            }
        });
    }
    if (!hasVideoBitrate) {
        throw new Error('Video bitrate not found');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isWithinRange ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
