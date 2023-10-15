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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
/* eslint-disable linebreak-style */
/* eslint-disable indent */
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var mapVideoContainerToAudio = function (container) {
    switch (container) {
        case 'mkv':
            return 'mka';
        case 'mp4':
            return 'm4a';
        case 'avi':
            return 'wav';
        case 'mov':
            return 'm4a';
        case 'mpeg':
        case 'mpg':
            return 'mp3';
        default:
            return 'mka';
    }
};
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Extract audio streams',
    description: 'This plugin extracts an audio track from a given file.',
    style: {
        borderColor: 'green',
    },
    tags: 'audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            name: 'preferredMainCodec',
            type: 'string',
            defaultValue: 'dts',
            inputUI: {
                type: 'dropdown',
                options: [
                    'dts',
                    'ac3',
                    'eac3',
                    'aac',
                ],
            },
            tooltip: 'Specify preferred main codec',
        },
        {
            name: 'preferredFallbackCodec',
            type: 'string',
            defaultValue: 'eac3',
            inputUI: {
                type: 'dropdown',
                options: [
                    'dts',
                    'ac3',
                    'eac3',
                    'aac',
                ],
            },
            tooltip: 'Specify preferred fallback codec',
        },
        {
            name: 'preferredResultCodec',
            type: 'string',
            defaultValue: 'eac3',
            inputUI: {
                type: 'dropdown',
                options: [
                    'dts',
                    'ac3',
                    'eac3',
                    'aac',
                ],
            },
            tooltip: 'Specify preferred result codec',
        },
        {
            name: 'maxChannels',
            type: 'number',
            defaultValue: '6',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify the maximum amount of channels.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Audio stream extracted.',
        },
        {
            number: 2,
            tooltip: 'No audio stream extracted.',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, preferredMainCodec, preferredFallbackCodec, preferredResultCodec, maxChannels, cliArgs, outputNumber, ffProbeData, videoContainer, audioContainer, outputFileName, outputFilePath, audioStreams, preferredStreams, audioStream, preferredStream, fallbackStreams, fallbackStream, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                preferredMainCodec = String(args.inputs.preferredMainCodec);
                preferredFallbackCodec = String(args.inputs.preferredFallbackCodec);
                preferredResultCodec = String(args.inputs.preferredResultCodec);
                maxChannels = Number(args.inputs.maxChannels);
                cliArgs = [];
                outputNumber = 2;
                ffProbeData = args.inputFileObj.ffProbeData;
                if (!ffProbeData || !ffProbeData.streams) {
                    throw new Error('ffProbeData or ffProbeData.streams is not available.');
                }
                videoContainer = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                audioContainer = mapVideoContainerToAudio(videoContainer);
                outputFileName = "".concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(audioContainer);
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat(outputFileName);
                audioStreams = ffProbeData.streams.filter(function (stream) {
                    var _a;
                    return stream.codec_type === 'audio'
                        && !/commentary/i.test(((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.title) || '');
                });
                preferredStreams = audioStreams.filter(function (stream) { return stream.codec_name === preferredMainCodec; });
                if (preferredStreams.length > 0) {
                    preferredStream = preferredStreams[0];
                    audioStream = preferredStream;
                    outputNumber = 1;
                }
                else {
                    fallbackStreams = audioStreams.filter(function (stream) { return (stream.codec_name === preferredFallbackCodec); });
                    if (fallbackStreams.length > 0) {
                        fallbackStream = fallbackStreams[0];
                        audioStream = fallbackStream;
                        outputNumber = 1;
                    }
                    else {
                        // Exit here if nothing was found
                        return [2 /*return*/, {
                                outputFileObj: args.inputFileObj,
                                outputNumber: outputNumber,
                                variables: args.variables,
                            }];
                    }
                }
                // // eslint-disable-next-line max-len
                cliArgs.push('-y', '-i', "".concat(args.inputFileObj._id), '-map', "0:a:".concat(audioStream.index - 1), '-c:a', preferredResultCodec, '-ac', "".concat(Math.min(maxChannels, Number(audioStream.channels))), "".concat(outputFilePath));
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('Running FFmpeg failed');
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
