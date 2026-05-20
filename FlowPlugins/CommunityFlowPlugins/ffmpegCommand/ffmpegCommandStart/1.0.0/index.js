"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Begin Command',
    description: 'Begin creating the FFmpeg command for the current working file.'
        + ' Should be used before any other FFmpeg command plugins.',
    style: {
        borderColor: 'green',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: 1,
    icon: '',
    inputs: [],
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
    var container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
    var streams = [];
    try {
        streams = JSON.parse(JSON.stringify(args.inputFileObj.ffProbeData.streams));
    }
    catch (err) {
        var message = "Error parsing FFprobe streams, it seems FFprobe could not scan the file: ".concat(JSON.stringify(err));
        args.jobLog(message);
        throw new Error(message);
    }
    var ffmpegCommand = {
        init: true,
        inputFiles: [],
        streams: streams.map(function (stream) {
            var _a;
            var normalizedStream = __assign({}, stream);
            if (Number((_a = stream === null || stream === void 0 ? void 0 : stream.disposition) === null || _a === void 0 ? void 0 : _a.attached_pic) === 1) {
                normalizedStream.codec_type = 'attachment';
            }
            return __assign(__assign({}, normalizedStream), { removed: false, mapArgs: [
                    '-map',
                    "0:".concat(stream.index),
                ], inputArgs: [], outputArgs: [] });
        }),
        container: container,
        hardwareDecoding: false,
        shouldProcess: false,
        overallInputArguments: [],
        overallOuputArguments: [],
    };
    args.variables.ffmpegCommand = ffmpegCommand;
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
