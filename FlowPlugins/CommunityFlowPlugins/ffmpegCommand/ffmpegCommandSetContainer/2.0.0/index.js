"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
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
    (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
    // Store inputs for processing by Execute plugin
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,no-param-reassign
    args.variables.ffmpegCommand.pluginInputs.ffmpegCommandSetContainer = {
        container: String(args.inputs.container),
        forceConform: args.inputs.forceConform === true,
    };
    // Update the container in the structure
    args.variables.ffmpegCommand.container = String(args.inputs.container);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
