"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Working File',
    description: "Set the working file to the original file or a custom path.\n  This is useful in transcode loops where you want to re-encode from the original source\n  rather than from the output of the previous iteration.\n  Replaces the deprecated 'Set Original File' plugin.",
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Source',
            name: 'source',
            type: 'string',
            defaultValue: 'originalFile',
            inputUI: {
                type: 'dropdown',
                options: [
                    'originalFile',
                    'customPath',
                ],
            },
            tooltip: "Select which file to set as the working file.\n\n      \\nExample\\n\n      originalFile - resets to the original library file\n\n      \\nExample\\n\n      customPath - uses a custom path (e.g. from a flow variable)",
        },
        {
            label: 'Custom Path',
            name: 'customPath',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'source',
                                    value: 'customPath',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "The custom file path to set as the working file.\n      Supports templating.\n\n      \\nExample\\n\n      {{{args.variables.user.cachedFile}}}",
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
    var source = String(args.inputs.source);
    var filePath;
    if (source === 'customPath') {
        filePath = String(args.inputs.customPath).trim();
        if (!filePath) {
            throw new Error('Custom path is empty. Please provide a valid file path.');
        }
        args.jobLog("Setting working file to custom path: ".concat(filePath));
    }
    else {
        filePath = args.originalLibraryFile._id;
        args.jobLog("Setting working file to original file: ".concat(filePath));
    }
    return {
        outputFileObj: {
            _id: filePath,
        },
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
