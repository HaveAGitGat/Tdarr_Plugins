"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Video Resolution',
    description: 'Change video resolution',
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
            label: 'Target Resolution',
            name: 'targetResolution',
            type: 'string',
            defaultValue: '1080p',
            inputUI: {
                type: 'dropdown',
                options: [
                    '480p',
                    '720p',
                    '1080p',
                    '1440p',
                    '4KUHD',
                ],
            },
            tooltip: 'Specify the codec to use',
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
var getQsvVfScale = function (targetResolution) {
    switch (targetResolution) {
        case '480p':
            return ['-vf', 'vpp_qsv=w=720:h=480'];
        case '576p':
            return ['-vf', 'vpp_qsv=w=720:h=576'];
        case '720p':
            return ['-vf', 'vpp_qsv=w=1280:h=720'];
        case '1080p':
            return ['-vf', 'vpp_qsv=w=1920:h=1080'];
        case '1440p':
            return ['-vf', 'vpp_qsv=w=2560:h=1440'];
        case '4KUHD':
            return ['-vf', 'vpp_qsv=w=3840:h=2160'];
        default:
            return ['-vf', 'vpp_qsv=w=1920:h=1080'];
    }
};
var getVfScale = function (targetResolution) {
    switch (targetResolution) {
        case '480p':
            return ['-vf', 'scale=720:-2'];
        case '576p':
            return ['-vf', 'scale=720:-2'];
        case '720p':
            return ['-vf', 'scale=1280:-2'];
        case '1080p':
            return ['-vf', 'scale=1920:-2'];
        case '1440p':
            return ['-vf', 'scale=2560:-2'];
        case '4KUHD':
            return ['-vf', 'scale=3840:-2'];
        default:
            return ['-vf', 'scale=1920:-2'];
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        var usesQSV = stream.outputArgs.some(function (row) { return row.includes('qsv'); });
        if (stream.codec_type === 'video') {
            var targetResolution = String(args.inputs.targetResolution);
            if (targetResolution !== args.inputFileObj.video_resolution) {
                // eslint-disable-next-line no-param-reassign
                args.variables.ffmpegCommand.shouldProcess = true;
                var scaleArgs = usesQSV ? getQsvVfScale(targetResolution) : getVfScale(targetResolution);
                (_a = stream.outputArgs).push.apply(_a, scaleArgs);
            }
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
