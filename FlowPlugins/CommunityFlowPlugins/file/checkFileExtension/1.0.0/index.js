"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Extension',
    description: 'Check file extension',
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
            label: 'Extensions',
            name: 'extensions',
            type: 'string',
            defaultValue: 'mkv,mp4',
            inputUI: {
                type: 'text',
            },
            tooltip: 'A comma separated list of extensions to check',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File is one of extensions',
        },
        {
            number: 2,
            tooltip: 'File is not one of extensions',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var extensions = String(args.inputs.extensions);
    var extensionArray = extensions.trim().split(',').map(function (row) { return row.toLowerCase(); });
    var extension = (0, fileUtils_1.getContainer)(args.inputFileObj._id).toLowerCase();
    var extensionMatch = false;
    if (extensionArray.includes(extension)) {
        extensionMatch = true;
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: extensionMatch ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
