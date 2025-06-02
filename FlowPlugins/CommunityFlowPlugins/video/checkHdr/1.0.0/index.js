"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check HDR Video',
    description: 'Check if video is HDR',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'File is HDR',
        },
        {
            number: 2,
            tooltip: 'File is not HDR',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b, _c, _d, _e, _f;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var isHdr = false;
    if (Array.isArray((_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a.ffProbeData) === null || _b === void 0 ? void 0 : _b.streams)) {
        for (var i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
            var stream = args.inputFileObj.ffProbeData.streams[i];
            if (stream.codec_type === 'video'
                && ((stream.color_transfer === 'smpte2084'
                    && stream.color_primaries === 'bt2020'
                    && stream.color_range === 'tv')
                    || ((_c = stream.codec_tag_string) === null || _c === void 0 ? void 0 : _c.includes('dvhe'))
                    || ((_d = stream.codec_tag_string) === null || _d === void 0 ? void 0 : _d.includes('dvav'))
                    || ((_e = stream.codec_tag_string) === null || _e === void 0 ? void 0 : _e.includes('dav1'))
                    || ((_f = stream.codec_tag_string) === null || _f === void 0 ? void 0 : _f.includes('dvh11')))) {
                isHdr = true;
            }
        }
    }
    else {
        throw new Error('File has not stream data');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isHdr ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
