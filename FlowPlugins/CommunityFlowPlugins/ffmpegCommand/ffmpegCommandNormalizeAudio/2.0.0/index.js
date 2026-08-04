"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var ffmpegCommandV2Utils_1 = require("../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Normalize Audio',
    description: 'Normalize Audio',
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
            label: 'Target Integrated Loudness (LUFS)',
            name: 'i',
            type: 'string',
            defaultValue: '-23.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "Target integrated loudness in LUFS (Loudness Units relative to Full Scale). \\n\n              This is the average perceptual loudness the output file will be normalized to. \\n\n              Common values: \\n\n              -14.0 = Spotify / YouTube streaming standard \\n\n              -16.0 = Apple Music / AES streaming recommendation \\n\n              -23.0 = EBU R128 broadcast standard (default) \\n",
        },
        {
            label: 'Target Loudness Range (LU)',
            name: 'lra',
            type: 'string',
            defaultValue: '7.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "Target loudness range in LU (Loudness Units). \\n\n              Controls how much dynamic variation is allowed between quiet and loud sections. \\n\n              A lower value produces more consistent loudness throughout the file. \\n\n              A higher value preserves more of the original dynamic range. \\n\n              Typical values: \\n\n              3.0-7.0 = Compressed / consistent (speech, podcasts) \\n\n              7.0-15.0 = Moderate dynamics (most music, TV) \\n\n              15.0-20.0 = Wide dynamics (classical, film) \\n\n              Defaults to 7.0",
        },
        {
            label: 'Target True Peak (dBTP)',
            name: 'tp',
            type: 'string',
            defaultValue: '-2.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "Maximum true peak level in dBTP (decibels True Peak). \\n\n              True peak accounts for inter-sample peaks that occur after digital-to-analogue \\n\n              conversion or codec processing, and should be kept below 0 dBTP to prevent clipping. \\n\n              Common values: \\n\n              -1.0 = EBU R128 / streaming platform recommended ceiling \\n\n              -2.0 = Conservative headroom for lossy codec safety (default) \\n",
        },
        {
            label: 'Max Gain (LU)',
            name: 'maxGain',
            type: 'string',
            defaultValue: '15',
            inputUI: {
                type: 'text',
            },
            tooltip: "Maximum gain in Loudness Units that will be applied. \\n\n              If the required gain exceeds this value, normalization is skipped \\n\n              to avoid amplifying noise in mostly-quiet files. \\n\n              Defaults to 15",
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
        pluginName: 'ffmpegCommandNormalizeAudio',
        operationType: 'normalizeAudio',
        inputs: {
            i: String(args.inputs.i),
            lra: String(args.inputs.lra),
            tp: String(args.inputs.tp),
            maxGain: String(args.inputs.maxGain),
        },
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
