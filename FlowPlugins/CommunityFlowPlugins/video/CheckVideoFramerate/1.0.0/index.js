"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Video Framerate',
    description: 'Check if video framerate is within a specific range',
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
            label: 'Greater Than',
            name: 'greaterThan',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify lower bound of fps',
        },
        {
            label: 'Less Than',
            name: 'lessThan',
            type: 'number',
            defaultValue: '60',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify upper bound fps',
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
    var greaterThanFps = Number(args.inputs.greaterThan);
    var lessThanFps = Number(args.inputs.lessThan);
    var VideoFrameRate = (_b = (_a = args.inputFileObj) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.VideoFrameRate;
    if (VideoFrameRate) {
        if (VideoFrameRate >= greaterThanFps && VideoFrameRate <= lessThanFps) {
            isWithinRange = true;
        }
    }
    else {
        throw new Error('Video framerate not found');
    }
    if (isWithinRange) {
        args.jobLog("Video framerate of ".concat(VideoFrameRate, " is within range of ").concat(greaterThanFps, " and ").concat(lessThanFps));
    }
    else {
        args.jobLog("Video framerate of ".concat(VideoFrameRate, " is not within range of ").concat(greaterThanFps, " and ").concat(lessThanFps));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isWithinRange ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
