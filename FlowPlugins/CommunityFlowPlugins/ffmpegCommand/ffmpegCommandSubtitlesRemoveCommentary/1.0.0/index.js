"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Subtitles Remove Commentary',
    description: 'Remove Commentary',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'subtitle',
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
var removeCommentary = function (args) {
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
        if (stream.disposition.commentary
            || stream.disposition.description
            || (title.includes('commentary'))
            || (title.includes('description'))) {
            args.jobLog("Removing Subtitles at index ".concat(stream.index, " Commentary Detected"));
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
    removeCommentary(args);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
