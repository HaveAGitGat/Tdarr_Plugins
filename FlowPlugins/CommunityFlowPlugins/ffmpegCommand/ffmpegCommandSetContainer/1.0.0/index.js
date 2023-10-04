"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Set Container',
    description: 'Set the container of the output file',
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
            name: 'container',
            type: 'string',
            defaultValue: 'mkv',
            inputUI: {
                type: 'dropdown',
                options: [
                    'mkv',
                    'mp4',
                ],
            },
            tooltip: 'Specify the container to use',
        },
        {
            name: 'forceConform',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: "\nSpecify if you want to force conform the file to the new container,\nThis is useful if not all streams are supported by the new container. \nFor example mkv does not support data streams.\n      ",
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
    var newContainer = String(args.inputs.container);
    var forceConform = args.inputs.forceConform;
    if ((0, fileUtils_1.getContainer)(args.inputFileObj._id) !== newContainer) {
        args.variables.ffmpegCommand.container = newContainer;
        args.variables.ffmpegCommand.shouldProcess = true;
        if (forceConform === true) {
            for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
                var stream = args.variables.ffmpegCommand.streams[i];
                try {
                    var codecType = stream.codec_type.toLowerCase();
                    var codecName = stream.codec_name.toLowerCase();
                    if (newContainer === 'mkv') {
                        if (codecType === 'data'
                            || [
                                'mov_text',
                                'eia_608',
                                'timed_id3',
                            ].includes(codecName)) {
                            stream.removed = true;
                        }
                    }
                    if (newContainer === 'mp4') {
                        if ([
                            'hdmv_pgs_subtitle',
                            'eia_608',
                            'timed_id3',
                            'subrip',
                        ].includes(codecName)) {
                            stream.removed = true;
                        }
                    }
                }
                catch (err) {
                    // Error
                }
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
