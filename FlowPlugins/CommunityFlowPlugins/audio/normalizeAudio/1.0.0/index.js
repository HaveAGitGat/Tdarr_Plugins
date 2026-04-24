"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
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
    requiresVersion: '2.11.01',
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
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, inputs_i, inputs_lra, inputs_tp, maxGain, container, outputFilePath, normArgs1, cli, res, lines, idx, fullTail, targetOffsetIdx, closingBraceIdx, openingBraceIdx, loudNormValues, gainNeeded, normArgs2, cli2, res2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, inputs_i = _a.i, inputs_lra = _a.lra, inputs_tp = _a.tp;
                maxGain = parseFloat(args.inputs.maxGain);
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(container);
                normArgs1 = [
                    '-i',
                    args.inputFileObj._id,
                    '-af',
                    "loudnorm=I=".concat(inputs_i, ":LRA=").concat(inputs_lra, ":TP=").concat(inputs_tp, ":print_format=json"),
                    '-f',
                    'null',
                    (args.platform === 'win32' ? 'NUL' : '/dev/null'),
                ];
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: normArgs1,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: '',
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _b.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('FFmpeg failed');
                }
                lines = res.errorLogFull;
                idx = -1;
                // get last index of Parsed_loudnorm
                lines.forEach(function (line, i) {
                    if (line.includes('Parsed_loudnorm')) {
                        idx = i;
                    }
                });
                if (idx === -1) {
                    throw new Error('Failed to find loudnorm in report, please rerun');
                }
                fullTail = res.errorLogFull.slice(idx).join('');
                targetOffsetIdx = fullTail.lastIndexOf('target_offset');
                if (targetOffsetIdx === -1) {
                    throw new Error('Failed to find target_offset in loudnorm output, please rerun');
                }
                closingBraceIdx = fullTail.indexOf('}', targetOffsetIdx);
                if (closingBraceIdx === -1) {
                    throw new Error('Failed to find closing brace in loudnorm output, please rerun');
                }
                openingBraceIdx = fullTail.lastIndexOf('{', targetOffsetIdx);
                if (openingBraceIdx === -1) {
                    throw new Error('Failed to find opening brace in loudnorm output, please rerun');
                }
                loudNormValues = JSON.parse(fullTail.slice(openingBraceIdx, closingBraceIdx + 1));
                args.jobLog("Loudnorm first pass values returned:  \n".concat(JSON.stringify(loudNormValues)));
                gainNeeded = parseFloat(inputs_i) - parseFloat(loudNormValues.input_i);
                args.jobLog("Gain required: ".concat(gainNeeded.toFixed(2), " LU (max allowed: ").concat(maxGain, " LU)"));
                if (gainNeeded > maxGain) {
                    args.jobLog("Skipping normalization: required gain of ".concat(gainNeeded.toFixed(2), " LU exceeds ")
                        + "max allowed gain of ".concat(maxGain, " LU. File may be mostly quiet or noise."));
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                normArgs2 = [
                    '-i',
                    args.inputFileObj._id,
                    '-map',
                    '0',
                    '-c',
                    'copy',
                    '-c:a',
                    'aac',
                    '-b:a',
                    '192k',
                    '-af',
                    "loudnorm=print_format=summary:linear=true:I=".concat(inputs_i, ":LRA=").concat(inputs_lra, ":TP=").concat(inputs_tp, ":")
                        + "measured_i=".concat(loudNormValues.input_i, ":")
                        + "measured_lra=".concat(loudNormValues.input_lra, ":")
                        + "measured_tp=".concat(loudNormValues.input_tp, ":")
                        + "measured_thresh=".concat(loudNormValues.input_thresh, ":offset=").concat(loudNormValues.target_offset),
                    outputFilePath,
                ];
                cli2 = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: normArgs2,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli2.runCli()];
            case 2:
                res2 = _b.sent();
                if (res2.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('FFmpeg failed');
                }
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: outputFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
