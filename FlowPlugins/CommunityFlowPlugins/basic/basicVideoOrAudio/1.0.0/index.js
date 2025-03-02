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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Basic Video or Audio Settings',
    description: "Basic Video or Audio settings designed to replicate\n   the Basic Video or Basic Audio  settings in the library settings.\n   ",
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
            label: 'Basic Settings Type',
            name: 'basicSettingsType',
            type: 'string',
            defaultValue: 'video',
            inputUI: {
                type: 'dropdown',
                options: [
                    'video',
                    'audio',
                ],
            },
            tooltip: 'Specify the basic settings type for the type of files being processed',
        },
        {
            label: 'Output File Container',
            name: 'outputFileContainer',
            type: 'string',
            defaultValue: 'mkv',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify the output file container',
        },
        {
            label: 'CLI Tool',
            name: 'cliTool',
            type: 'string',
            defaultValue: 'handbrake',
            inputUI: {
                type: 'dropdown',
                options: [
                    'handbrake',
                    'ffmpeg',
                ],
            },
            tooltip: 'Specify the CLI tool to use',
        },
        {
            label: 'CLI Arguments',
            name: 'cliArguments',
            type: 'string',
            defaultValue: '-Z "Very Fast 1080p30"',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify HandBrake or FFmpeg arguments',
        },
        {
            label: 'Codec Filter',
            name: 'codecFilter',
            type: 'string',
            defaultValue: 'ignore',
            inputUI: {
                type: 'dropdown',
                options: [
                    'ignore',
                    'allow',
                ],
            },
            tooltip: 'Specify whether to ignore or allow the following codecs',
        },
        {
            label: 'Codecs',
            name: 'codecs',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify comma separated list of codecs to ignore or allow',
        },
        {
            label: 'File Size Range Min MB',
            name: 'fileSizeRangeMinMB',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify minimum file size in MB of files to process',
        },
        {
            label: 'File Size Range Max MB',
            name: 'fileSizeRangeMaxMB',
            type: 'number',
            defaultValue: '200000',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify maximum file size in MB of files to process',
        },
        {
            label: 'Video Height Range Min',
            name: 'videoHeightRangeMin',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'basicSettingsType',
                                    value: 'video',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify minimum video height in pixels of files to process',
        },
        {
            label: 'Video Height Range Max',
            name: 'videoHeightRangeMax',
            type: 'number',
            defaultValue: '5000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'basicSettingsType',
                                    value: 'video',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify maximum video height in pixels of files to process',
        },
        {
            label: 'Video Width Range Min',
            name: 'videoWidthRangeMin',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'basicSettingsType',
                                    value: 'video',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify minimum video width in pixels of files to process',
        },
        {
            label: 'Video Width Range Max',
            name: 'videoWidthRangeMax',
            type: 'number',
            defaultValue: '8000',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'basicSettingsType',
                                    value: 'video',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify maximum video width in pixels of files to process',
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
    var lib, basicSettingsType, container, cliTool, cliArguments, codecFilter, codecs, fileSizeRangeMinMB, fileSizeRangeMaxMB, videoHeightRangeMin, videoHeightRangeMax, videoWidthRangeMin, videoWidthRangeMax, noTranscodeResponse, size, mainStream, height, width, codec, outputFilePath, cliArgs, cliPath, argsSplit, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                basicSettingsType = String(args.inputs.basicSettingsType);
                container = String(args.inputs.outputFileContainer).split('.').join('');
                cliTool = String(args.inputs.cliTool);
                cliArguments = String(args.inputs.cliArguments);
                codecFilter = String(args.inputs.codecFilter);
                codecs = String(args.inputs.codecs).split(',').map(function (codec) { return codec.trim(); });
                fileSizeRangeMinMB = Number(args.inputs.fileSizeRangeMinMB);
                fileSizeRangeMaxMB = Number(args.inputs.fileSizeRangeMaxMB);
                videoHeightRangeMin = Number(args.inputs.videoHeightRangeMin);
                videoHeightRangeMax = Number(args.inputs.videoHeightRangeMax);
                videoWidthRangeMin = Number(args.inputs.videoWidthRangeMin);
                videoWidthRangeMax = Number(args.inputs.videoWidthRangeMax);
                noTranscodeResponse = {
                    outputFileObj: {
                        _id: args.inputFileObj._id,
                    },
                    outputNumber: 1,
                    variables: args.variables,
                };
                size = args.inputFileObj.file_size;
                if (size < fileSizeRangeMinMB || size > fileSizeRangeMaxMB) {
                    args.jobLog("Skipping ".concat(args.inputFileObj._id, " due to size ").concat(size, "MB not in ")
                        + "range ".concat(fileSizeRangeMinMB, "MB to ").concat(fileSizeRangeMaxMB, "MB"));
                    return [2 /*return*/, noTranscodeResponse];
                }
                args.jobLog("Processing ".concat(args.inputFileObj._id, " due to size ").concat(size, "MB in ")
                    + "range ".concat(fileSizeRangeMinMB, "MB to ").concat(fileSizeRangeMaxMB, "MB"));
                if (!args.inputFileObj.ffProbeData.streams) {
                    throw new Error('No streams found in file FFprobe data');
                }
                mainStream = args.inputFileObj.ffProbeData.streams.find(function (stream) { return stream.codec_type === basicSettingsType; });
                if (!mainStream) {
                    throw new Error("No ".concat(basicSettingsType, " stream found in file FFprobe data"));
                }
                if (basicSettingsType === 'video') {
                    height = mainStream.height || 0;
                    width = mainStream.width || 0;
                    if (height < videoHeightRangeMin || height > videoHeightRangeMax) {
                        args.jobLog("Skipping ".concat(args.inputFileObj._id, " due to height ").concat(height, " not in ")
                            + "range ".concat(videoHeightRangeMin, " to ").concat(videoHeightRangeMax));
                        return [2 /*return*/, noTranscodeResponse];
                    }
                    args.jobLog("Processing ".concat(args.inputFileObj._id, " due to height ").concat(height, " in ")
                        + "range ".concat(videoHeightRangeMin, " to ").concat(videoHeightRangeMax));
                    if (width < videoWidthRangeMin || width > videoWidthRangeMax) {
                        args.jobLog("Skipping ".concat(args.inputFileObj._id, " due to width ").concat(width, " not in ")
                            + "range ".concat(videoWidthRangeMin, " to ").concat(videoWidthRangeMax));
                        return [2 /*return*/, noTranscodeResponse];
                    }
                    args.jobLog("Processing ".concat(args.inputFileObj._id, " due to width ").concat(width, " in ")
                        + "range ".concat(videoWidthRangeMin, " to ").concat(videoWidthRangeMax));
                }
                codec = mainStream.codec_name;
                if (codecFilter === 'allow') {
                    if (!codecs.includes(codec)) {
                        args.jobLog("Skipping ".concat(args.inputFileObj._id, " due to codec ").concat(codec, " not in list ").concat(codecs));
                        return [2 /*return*/, noTranscodeResponse];
                    }
                    args.jobLog("Processing ".concat(args.inputFileObj._id, " due to codec ").concat(codec, " in list ").concat(codecs));
                }
                else {
                    if (codecs.includes(codec)) {
                        args.jobLog("Skipping ".concat(args.inputFileObj._id, " due to codec ").concat(codec, " in list ").concat(codecs));
                        return [2 /*return*/, noTranscodeResponse];
                    }
                    args.jobLog("Processing ".concat(args.inputFileObj._id, " due to codec ").concat(codec, " not in list ").concat(codecs));
                }
                if (container === 'original') {
                    container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                }
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(container);
                cliArgs = [];
                cliPath = '';
                if (cliTool === 'handbrake') {
                    cliPath = args.handbrakePath;
                    cliArgs = __spreadArray([
                        '-i',
                        "".concat(args.inputFileObj._id),
                        '-o',
                        "".concat(outputFilePath)
                    ], args.deps.parseArgsStringToArgv(cliArguments, '', ''), true);
                }
                else {
                    cliPath = args.ffmpegPath;
                    argsSplit = void 0;
                    if (cliArguments.includes('<io>')) {
                        argsSplit = cliArguments.split('<io>');
                    }
                    else {
                        argsSplit = cliArguments.split(',');
                    }
                    cliArgs = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], args.deps.parseArgsStringToArgv(argsSplit[0], '', ''), true), [
                        '-i',
                        "".concat(args.inputFileObj._id)
                    ], false), args.deps.parseArgsStringToArgv(argsSplit[1], '', ''), true), [
                        "".concat(outputFilePath),
                    ], false);
                }
                args.updateWorker({
                    CLIType: cliPath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: cliPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog("Running ".concat(cliTool, " failed"));
                    throw new Error("Running ".concat(cliTool, " failed"));
                }
                args.logOutcome('tSuc');
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
