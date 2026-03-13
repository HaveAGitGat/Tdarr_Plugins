"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Subtitles Remove by Title',
    description: 'Remove by Title',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'subtitle',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Title to Remove',
            name: 'valuesToRemove',
            type: 'string',
            defaultValue: 'forced',
            inputUI: {
                type: 'text',
            },
            tooltip: '\n Choose one Title to Remove  ',
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
var removeByTitle = function (args) {
    var valuesToRemove = String(args.inputs.valuesToRemove).toLowerCase().trim();
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type !== 'subtitle') {
            return;
        }
        var title = '';
        if (stream.tags !== undefined) {
            if (stream.tags.title !== undefined) {
                title = stream.tags.title.toLowerCase();
            }
        }
        if (title.includes(valuesToRemove)) {
            // eslint-disable-next-line no-param-reassign
            stream.removed = true;
        }
    });
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    removeByTitle(args);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
