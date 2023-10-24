"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
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
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        if (stream.codec_type === 'video') {
            stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
            if (stream.outputArgs.includes('qsv')) {
                stream.outputArgs.push('-vf', 'scale_qsv=format=p010le');
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
