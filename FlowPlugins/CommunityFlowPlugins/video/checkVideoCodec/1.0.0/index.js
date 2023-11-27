"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Video Codec',
    description: 'Check if a file has a specific video codec',
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
            label: 'Codec',
            name: 'codec',
            type: 'string',
            defaultValue: 'hevc',
            inputUI: {
                type: 'dropdown',
                options: [
                    'hevc',
                    'av1',
                    'vp9',
                    'h264',
                    'vp8',
                    'wmv2',
                    'wmv3',
                    'mpeg4',
                    'mpeg2video',
                    'mjpeg',
                    'flv',
                    'theora',
                ],
            },
            tooltip: 'Specify the codec check for',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File has codec',
        },
        {
            number: 2,
            tooltip: 'File does not have codec',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var hasCodec = false;
    if (args.inputFileObj.ffProbeData.streams) {
        args.inputFileObj.ffProbeData.streams.forEach(function (stream) {
            if (stream.codec_type === 'video' && stream.codec_name === args.inputs.codec) {
                hasCodec = true;
            }
        });
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: hasCodec ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
