"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var os_1 = __importDefault(require("os"));
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
            stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
            if (stream.outputArgs.some(function (row) { return row.includes('qsv'); }) && os_1.default.platform() !== 'win32') {
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
