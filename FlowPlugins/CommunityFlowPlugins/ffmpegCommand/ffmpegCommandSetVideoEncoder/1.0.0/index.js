"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
var hardwareUtils_1 = require("../../../../FlowHelpers/1.0.0/hardwareUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Set Video Encoder',
    description: 'Set the video encoder for all streams',
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
            label: 'Output Codec',
            name: 'outputCodec',
            type: 'string',
            defaultValue: 'hevc',
            inputUI: {
                type: 'dropdown',
                options: [
                    'hevc',
                    // 'vp9',
                    'h264',
                    // 'vp8',
                    'av1',
                ],
            },
            tooltip: 'Specify codec of the output file',
        },
        {
            label: 'Enable FFmpeg Preset',
            name: 'ffmpegPresetEnabled',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to use an FFmpeg preset',
        },
        {
            label: 'FFmpeg Preset',
            name: 'ffmpegPreset',
            type: 'string',
            defaultValue: 'fast',
            inputUI: {
                type: 'dropdown',
                options: [
                    'veryslow',
                    'slower',
                    'slow',
                    'medium',
                    'fast',
                    'faster',
                    'veryfast',
                    'superfast',
                    'ultrafast',
                ],
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'ffmpegPresetEnabled',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify ffmpeg preset',
        },
        {
            label: 'Enable FFmpeg Quality',
            name: 'ffmpegQualityEnabled',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to set crf (or qp for GPU encoding)',
        },
        {
            label: 'FFmpeg Quality',
            name: 'ffmpegQuality',
            type: 'number',
            defaultValue: '25',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'ffmpegQualityEnabled',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify ffmpeg quality crf (or qp for GPU encoding)',
        },
        {
            label: 'Hardware Encoding',
            name: 'hardwareEncoding',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to use hardware encoding if available',
        },
        {
            label: 'Hardware Type',
            name: 'hardwareType',
            type: 'string',
            defaultValue: 'auto',
            inputUI: {
                type: 'dropdown',
                options: [
                    'auto',
                    'nvenc',
                    'rkmpp',
                    'qsv',
                    'vaapi',
                    'videotoolbox',
                ],
            },
            tooltip: 'Specify codec of the output file',
        },
        {
            label: 'Hardware Decoding',
            name: 'hardwareDecoding',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to use hardware decoding if available',
        },
        {
            label: 'Force Encoding',
            name: 'forceEncoding',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to force encoding if stream already has the target codec',
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
    var lib, hardwareDecoding, hardwareType, i, stream, targetCodec, _a, ffmpegPresetEnabled, ffmpegQualityEnabled, ffmpegPreset, ffmpegQuality, forceEncoding, hardwarEncoding, encoderProperties;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                (0, flowUtils_1.checkFfmpegCommandInit)(args);
                hardwareDecoding = args.inputs.hardwareDecoding === true;
                hardwareType = String(args.inputs.hardwareType);
                args.variables.ffmpegCommand.hardwareDecoding = hardwareDecoding;
                i = 0;
                _d.label = 1;
            case 1:
                if (!(i < args.variables.ffmpegCommand.streams.length)) return [3 /*break*/, 4];
                stream = args.variables.ffmpegCommand.streams[i];
                if (!(stream.codec_type === 'video' && stream.codec_name !== 'mjpeg')) return [3 /*break*/, 3];
                targetCodec = String(args.inputs.outputCodec);
                _a = args.inputs, ffmpegPresetEnabled = _a.ffmpegPresetEnabled, ffmpegQualityEnabled = _a.ffmpegQualityEnabled;
                ffmpegPreset = String(args.inputs.ffmpegPreset);
                ffmpegQuality = String(args.inputs.ffmpegQuality);
                forceEncoding = args.inputs.forceEncoding === true;
                hardwarEncoding = args.inputs.hardwareEncoding === true;
                if (!(forceEncoding
                    || stream.codec_name !== targetCodec)) return [3 /*break*/, 3];
                args.variables.ffmpegCommand.shouldProcess = true;
                return [4 /*yield*/, (0, hardwareUtils_1.getEncoder)({
                        targetCodec: targetCodec,
                        hardwareEncoding: hardwarEncoding,
                        hardwareType: hardwareType,
                        args: args,
                    })];
            case 2:
                encoderProperties = _d.sent();
                stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);
                if (ffmpegQualityEnabled) {
                    if (encoderProperties.isGpu) {
                        if (encoderProperties.encoder === 'hevc_qsv') {
                            stream.outputArgs.push('-global_quality', ffmpegQuality);
                        }
                        else {
                            stream.outputArgs.push('-qp', ffmpegQuality);
                        }
                    }
                    else {
                        stream.outputArgs.push('-crf', ffmpegQuality);
                    }
                }
                if (ffmpegPresetEnabled) {
                    if (targetCodec !== 'av1' && ffmpegPreset) {
                        stream.outputArgs.push('-preset', ffmpegPreset);
                    }
                }
                if (hardwareDecoding) {
                    (_b = stream.inputArgs).push.apply(_b, encoderProperties.inputArgs);
                }
                if (encoderProperties.outputArgs) {
                    (_c = stream.outputArgs).push.apply(_c, encoderProperties.outputArgs);
                }
                _d.label = 3;
            case 3:
                i += 1;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
