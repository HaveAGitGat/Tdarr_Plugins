"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Reorder Streams',
    description: 'Reorder Streams',
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
            label: 'Process Order',
            name: 'processOrder',
            type: 'string',
            defaultValue: 'codecs,channels,languages,streamTypes',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the process order.\nFor example, if 'languages' is first, the streams will be ordered based on that first.\nSo put the most important properties last.\nThe default order is suitable for most people.\n\n        \\nExample:\\n\n        codecs,channels,languages,streamTypes\n        ",
        },
        {
            label: 'Languages',
            name: 'languages',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the language tags order, separated by commas. Leave blank to disable.\n        \\nExample:\\n\n        eng,fre\n        ",
        },
        {
            label: 'Channels',
            name: 'channels',
            type: 'string',
            defaultValue: '7.1,5.1,2,1',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the channels order, separated by commas. Leave blank to disable.\n          \n          \\nExample:\\n\n          7.1,5.1,2,1",
        },
        {
            label: 'Codecs',
            name: 'codecs',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the codec order, separated by commas. Leave blank to disable.\n          \n          \\nExample:\\n\n          aac,ac3",
        },
        {
            label: 'Stream Types',
            name: 'streamTypes',
            type: 'string',
            defaultValue: 'video,audio,subtitle',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the streamTypes order, separated by commas. Leave blank to disable.\n        \\nExample:\\n\n        video,audio,subtitle\n        ",
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
    args.variables.ffmpegCommand.pluginInputs.ffmpegCommandRorderStreams = {
        processOrder: String(args.inputs.processOrder),
        languages: String(args.inputs.languages),
        channels: String(args.inputs.channels),
        codecs: String(args.inputs.codecs),
        streamTypes: String(args.inputs.streamTypes),
    };
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
