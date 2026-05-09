"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
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
    requiresVersion: ffmpegCommandV2Utils_1.ffmpegCommandV2RequiresVersion,
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
    (0, ffmpegCommandV2Utils_1.appendFfmpegCommandV2Operation)({
        args: args,
        pluginName: 'ffmpegCommandSetContainer',
        operationType: 'setContainer',
        inputs: {
            container: String(args.inputs.container),
            forceConform: args.inputs.forceConform === true,
        },
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
