"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Video Framerate',
    description: 'Set Video Framerate. If the original framerate is lower than the'
        + ' specified framerate, the original framerate will be used.',
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
            label: 'Framerate',
            name: 'framerate',
            type: 'number',
            defaultValue: '30',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify framerate value',
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
    var desiredFrameRate = Number(args.inputs.framerate);
    args.jobLog("Desired framerate: ".concat(desiredFrameRate));
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type === 'video') {
            var fileFramerateUsed = false;
            if (stream.avg_frame_rate) {
                var parts = stream.avg_frame_rate.split('/');
                if (parts.length === 2) {
                    var numerator = parseInt(parts[0], 10);
                    var denominator = parseInt(parts[1], 10);
                    if (numerator > 0 && denominator > 0) {
                        var fileFramerate = numerator / denominator;
                        args.jobLog("File framerate: ".concat(fileFramerate));
                        if (fileFramerate < desiredFrameRate) {
                            args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
                            stream.outputArgs.push('-r', "".concat(String(fileFramerate)));
                            fileFramerateUsed = true;
                        }
                        else {
                            args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
                        }
                    }
                }
            }
            if (!fileFramerateUsed) {
                args.jobLog('Using desired framerate.');
                stream.outputArgs.push('-r', "".concat(String(desiredFrameRate)));
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
