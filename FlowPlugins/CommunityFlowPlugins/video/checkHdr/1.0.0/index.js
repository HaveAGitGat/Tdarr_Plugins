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
// PQ (smpte2084) and HLG (arib-std-b67) are both HDR transfer functions.
var hdrTransfers = ['smpte2084', 'arib-std-b67'];
// Dolby Vision codec tags only ever appear in MP4/MOV. Matroska signals
// Dolby Vision through stream side data instead, handled separately below.
var dvCodecTags = ['dvhe', 'dvav', 'dav1', 'dvh11'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var isHdr = false;
    if (Array.isArray((_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a.ffProbeData) === null || _b === void 0 ? void 0 : _b.streams)) {
        var _loop_1 = function (i) {
            var stream = args.inputFileObj.ffProbeData.streams[i];
            // color_range is deliberately not required: full range ('pc') HDR masters
            // exist, and some muxes omit the field entirely. Neither makes a
            // PQ/BT.2020 or HLG/BT.2020 stream any less HDR.
            var hasHdrColours = hdrTransfers.includes(stream.color_transfer)
                && stream.color_primaries === 'bt2020';
            var hasDvCodecTag = dvCodecTags
                .some(function (tag) { var _a; return (_a = stream.codec_tag_string) === null || _a === void 0 ? void 0 : _a.includes(tag); });
            // Matroska carries Dolby Vision as a DOVI configuration record in side
            // data, where no Dolby Vision codec tag is present.
            var hasDvSideData = Array.isArray(stream.side_data_list)
                && stream.side_data_list
                    .some(function (sideData) { return (sideData === null || sideData === void 0 ? void 0 : sideData.dv_profile) !== undefined; });
            if (stream.codec_type === 'video' && (hasHdrColours || hasDvCodecTag || hasDvSideData)) {
                isHdr = true;
            }
        };
        for (var i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
            _loop_1(i);
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
