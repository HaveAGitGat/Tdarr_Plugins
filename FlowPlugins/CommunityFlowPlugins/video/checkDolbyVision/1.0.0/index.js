"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Dolby Vision',
    description: "Check which Dolby Vision profile, if any, the file carries.\n  \\n\\n\n  Profile 5 has no HDR10 fallback (IPT colour space), so it is usually left alone or tone mapped.\n  Profile 7 is dual layer (base layer + enhancement layer), as found on UHD Blu-ray remuxes.\n  Profile 8 is single layer with an HDR10, SDR or HLG compatible base layer.\n  \\n\\n\n  Reads the DOVI configuration record that FFprobe reports in stream side data, which covers\n  both MKV and MP4. Every video stream is checked, so profile 7 remuxes that carry the\n  enhancement layer and RPU in a separate video track are detected too.",
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
            tooltip: 'File has Dolby Vision profile 5',
        },
        {
            number: 2,
            tooltip: 'File has Dolby Vision profile 7',
        },
        {
            number: 3,
            tooltip: 'File has Dolby Vision profile 8',
        },
        {
            number: 4,
            tooltip: 'File has another Dolby Vision profile (e.g. 4, 9, 10), or Dolby Vision whose profile '
                + 'could not be read',
        },
        {
            number: 5,
            tooltip: 'File does not have Dolby Vision',
        },
    ],
}); };
exports.details = details;
// MP4/MOV sample entry codec tags for Dolby Vision (HEVC, AVC and AV1).
var dvCodecTags = ['dvhe', 'dvh1', 'dvav', 'dva1', 'dav1'];
var getDoviRecord = function (stream) {
    if (!Array.isArray(stream.side_data_list)) {
        return undefined;
    }
    return stream.side_data_list.find(function (sideData) { return (sideData === null || sideData === void 0 ? void 0 : sideData.dv_profile) !== undefined
        || (sideData === null || sideData === void 0 ? void 0 : sideData.side_data_type) === 'DOVI configuration record'; });
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b, _c, _d, _e;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var streams = (_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.streams;
    if (!Array.isArray(streams)) {
        throw new Error('File has no stream data');
    }
    var record;
    var recordStreamIndex = -1;
    var hasDvCodecTag = false;
    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        if (stream.codec_type === 'video') {
            var streamRecord = getDoviRecord(stream);
            if (streamRecord && !record) {
                record = streamRecord;
                recordStreamIndex = (_b = stream.index) !== null && _b !== void 0 ? _b : i;
            }
            var codecTag = String(stream.codec_tag_string || '').toLowerCase();
            if (dvCodecTags.includes(codecTag)) {
                hasDvCodecTag = true;
            }
        }
    }
    if (!record && !hasDvCodecTag) {
        args.jobLog('File does not have Dolby Vision');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 5,
            variables: args.variables,
        };
    }
    var profile = Number(record === null || record === void 0 ? void 0 : record.dv_profile);
    var outputNumber = 4;
    if (profile === 5) {
        outputNumber = 1;
    }
    else if (profile === 7) {
        outputNumber = 2;
    }
    else if (profile === 8) {
        outputNumber = 3;
    }
    if (record) {
        args.jobLog("File has Dolby Vision profile ".concat((_c = record.dv_profile) !== null && _c !== void 0 ? _c : 'unknown')
            + " (level ".concat((_d = record.dv_level) !== null && _d !== void 0 ? _d : 'unknown')
            + ", compatibility id ".concat((_e = record.dv_bl_signal_compatibility_id) !== null && _e !== void 0 ? _e : 'unknown')
            + ", enhancement layer ".concat(record.el_present_flag ? 'present' : 'absent')
            + ") on stream ".concat(recordStreamIndex));
    }
    else {
        args.jobLog('File has a Dolby Vision codec tag but no DOVI configuration record, profile unknown');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
