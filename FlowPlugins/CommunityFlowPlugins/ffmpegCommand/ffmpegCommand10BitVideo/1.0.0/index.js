"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: '10 Bit Video',
    description: 'Set 10 Bit Video',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
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
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        if (stream.codec_type === 'video') {
            var isLibsvtav1 = stream.outputArgs.some(function (row) { return String(row).includes('libsvtav1'); });
            // SVT-AV1 has no main10 profile; -profile:v main10 is parsed as AV1 Profile 2 (4:2:2)
            // and rejects 4:2:0 10-bit input. 10-bit is conveyed via pix_fmt alone.
            if (!isLibsvtav1) {
                stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
            }
            var isQsv = stream.outputArgs.some(function (row) { return row.includes('qsv'); });
            var hwDecoding = args.variables.ffmpegCommand.hardwareDecoding === true;
            if (isQsv && hwDecoding) {
                stream.outputArgs.push('-vf', 'scale_qsv=format=p010le');
            }
            else if (isLibsvtav1) {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'yuv420p10le');
            }
            else {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
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
