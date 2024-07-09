"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
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
            label: 'Container',
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
            label: 'Force Conform',
            name: 'forceConform',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
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
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
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
                        if (codecType === 'attachment'
                            || [
                                'hdmv_pgs_subtitle',
                                'eia_608',
                                'timed_id3',
                                'subrip',
                                'ass',
                                'ssa',
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
        // handle genpts if coming from odd container
        var container = args.inputFileObj.container.toLowerCase();
        if ([
            'ts',
            'avi',
            'mpg',
            'mpeg',
        ].includes(container)) {
            args.variables.ffmpegCommand.overallOuputArguments.push('-fflags', '+genpts');
        }
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
