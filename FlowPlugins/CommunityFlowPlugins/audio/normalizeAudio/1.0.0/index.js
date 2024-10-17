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
            label: 'i',
            name: 'i',
            type: 'string',
            defaultValue: '-23.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "\"i\" value used in loudnorm pass \\n\n              defaults to -23.0",
        },
        {
            label: 'lra',
            name: 'lra',
            type: 'string',
            defaultValue: '7.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "Desired lra value. \\n Defaults to 7.0  \n            ",
        },
        {
            label: 'tp',
            name: 'tp',
            type: 'string',
            defaultValue: '-2.0',
            inputUI: {
                type: 'text',
            },
            tooltip: "Desired \"tp\" value. \\n Defaults to -2.0 \n              ",
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
    var lib, loudNorm_i, lra, tp, container, outputFilePath, normArgs1, cli, res, lines, idx, parts, infoLine, loudNormValues, normArgs2, cli2, res2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                loudNorm_i = args.inputs.i;
                lra = args.inputs.lra;
                tp = args.inputs.tp;
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(container);
                normArgs1 = [
                    '-i',
                    args.inputFileObj._id,
                    '-af',
                    "loudnorm=I=".concat(loudNorm_i, ":LRA=").concat(lra, ":TP=").concat(tp, ":print_format=json"),
                    '-f',
                    'null',
                    'NUL',
                    '-map',
                    '0',
                    '-c',
                    'copy',
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
                res = _a.sent();
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
                parts = lines[idx].split(']');
                parts.shift();
                infoLine = parts.join(']');
                infoLine = infoLine.split('\r\n').join('').split('\t').join('');
                loudNormValues = JSON.parse(infoLine);
                args.jobLog("Loudnorm first pass values returned:  \n".concat(JSON.stringify(loudNormValues)));
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
                    "loudnorm=print_format=summary:linear=true:I=".concat(loudNorm_i, ":LRA=").concat(lra, ":TP=").concat(tp, ":")
                        + "measured_i=".concat(loudNormValues.input_i, ":")
                        + "measured_lra=".concat(loudNormValues.input_lra, ":")
                        + "measured_tp=".concat(loudNormValues.input_tp, ":")
                        + "measured_thresh=".concat(loudNormValues.input_thresh, ":offset=").concat(loudNormValues.target_offset, " "),
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
                res2 = _a.sent();
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
