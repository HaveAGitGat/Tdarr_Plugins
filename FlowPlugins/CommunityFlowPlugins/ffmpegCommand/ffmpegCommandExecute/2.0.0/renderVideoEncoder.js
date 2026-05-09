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
exports.applyVideoBitrate = exports.applyVideoEncoder = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var hardwareUtils_1 = require("../../../../FlowHelpers/1.0.0/hardwareUtils");
var renderUtils_1 = require("./renderUtils");
var renderVideoFilters_1 = require("./renderVideoFilters");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var getPresetToUse = function (_a) {
    var encoder = _a.encoder, ffmpegPreset = _a.ffmpegPreset, targetCodec = _a.targetCodec;
    if (targetCodec === 'av1' || !ffmpegPreset) {
        return null;
    }
    if (!encoder.isGpu) {
        return ffmpegPreset;
    }
    if (encoder.encoder.includes('nvenc')) {
        var nvencPresetMap = {
            veryslow: 'p7',
            slower: 'p7',
            slow: 'p6',
            medium: 'p5',
            fast: 'p4',
            faster: 'p3',
            veryfast: 'p2',
            superfast: 'p1',
            ultrafast: 'p1',
        };
        return nvencPresetMap[ffmpegPreset] || 'p5';
    }
    if (encoder.encoder.includes('amf')) {
        var amfPresetMap = {
            veryslow: 'quality',
            slower: 'quality',
            slow: 'quality',
            medium: 'balanced',
            fast: 'balanced',
            faster: 'speed',
            veryfast: 'speed',
            superfast: 'speed',
            ultrafast: 'speed',
        };
        return amfPresetMap[ffmpegPreset] || 'balanced';
    }
    if (encoder.encoder.includes('qsv')) {
        return ffmpegPreset;
    }
    return null;
};
var applyVideoEncoder = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var shouldProcess, targetCodec, ffmpegPresetEnabled, ffmpegPreset, ffmpegQualityEnabled, ffmpegQuality, hardwareEncoding, hardwareType, hardwareDecoding, forceEncoding, encoderProperties, resolutionInputs, frameRateInputs, videoBitrateInputs, has10BitOperation, hasHdrToSdrOperation, videoStreams, i, stream, videoOperationRequiresEncoding, presetToUse;
    var args = _b.args, streams = _b.streams, operations = _b.operations, inputs = _b.inputs, singletonInputs = _b.singletonInputs, overallInputArguments = _b.overallInputArguments;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                shouldProcess = false;
                targetCodec = String(inputs.outputCodec);
                ffmpegPresetEnabled = inputs.ffmpegPresetEnabled === true;
                ffmpegPreset = String(inputs.ffmpegPreset);
                ffmpegQualityEnabled = inputs.ffmpegQualityEnabled === true;
                ffmpegQuality = String(inputs.ffmpegQuality);
                hardwareEncoding = inputs.hardwareEncoding === true;
                hardwareType = String(inputs.hardwareType);
                hardwareDecoding = inputs.hardwareDecoding === true;
                forceEncoding = inputs.forceEncoding === true;
                resolutionInputs = singletonInputs.setVideoResolution;
                frameRateInputs = singletonInputs.setVideoFramerate;
                videoBitrateInputs = singletonInputs.setVideoBitrate;
                has10BitOperation = (0, renderUtils_1.hasOperation)(operations, 'set10BitVideo');
                hasHdrToSdrOperation = (0, renderUtils_1.hasOperation)(operations, 'hdrToSdr');
                videoStreams = streams.filter(function (stream) { return (!stream.removed
                    && stream.codec_type === 'video'
                    && stream.codec_name !== 'mjpeg'); });
                i = 0;
                _c.label = 1;
            case 1:
                if (!(i < videoStreams.length)) return [3 /*break*/, 5];
                stream = videoStreams[i];
                videoOperationRequiresEncoding = ((0, renderVideoFilters_1.shouldScaleVideoStream)(args, stream, resolutionInputs)
                    || Boolean(frameRateInputs)
                    || Boolean(videoBitrateInputs)
                    || Boolean(stream.cropFilter)
                    || has10BitOperation
                    || hasHdrToSdrOperation);
                if (!(forceEncoding
                    || stream.codec_name !== targetCodec
                    || videoOperationRequiresEncoding)) return [3 /*break*/, 4];
                shouldProcess = true;
                if (!!encoderProperties) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, hardwareUtils_1.getEncoder)({
                        targetCodec: targetCodec,
                        hardwareEncoding: hardwareEncoding,
                        hardwareType: hardwareType,
                        args: args,
                    })];
            case 2:
                // eslint-disable-next-line no-await-in-loop
                encoderProperties = _c.sent();
                _c.label = 3;
            case 3:
                stream.encoder = encoderProperties;
                stream.hardwareDecoding = hardwareDecoding;
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
                    presetToUse = getPresetToUse({
                        encoder: encoderProperties,
                        ffmpegPreset: ffmpegPreset,
                        targetCodec: targetCodec,
                    });
                    if (presetToUse) {
                        stream.outputArgs.push('-preset', presetToUse);
                    }
                }
                if (encoderProperties.encoder.includes('vaapi')) {
                    (0, renderUtils_1.appendArgsOnce)(overallInputArguments, (0, renderUtils_1.getVaapiDeviceArgs)(encoderProperties.inputArgs));
                }
                if (hardwareDecoding) {
                    (0, renderUtils_1.appendArgsOnce)(overallInputArguments, encoderProperties.inputArgs);
                }
                if (encoderProperties.outputArgs) {
                    (0, renderUtils_1.appendArgs)(stream.outputArgs, encoderProperties.outputArgs);
                }
                _c.label = 4;
            case 4:
                i += 1;
                return [3 /*break*/, 1];
            case 5: return [2 /*return*/, shouldProcess];
        }
    });
}); };
exports.applyVideoEncoder = applyVideoEncoder;
var applyVideoBitrate = function (args, streams, inputs) {
    var useInputBitrate = inputs.useInputBitrate === true;
    var targetBitratePercent = String(inputs.targetBitratePercent);
    var fallbackBitrate = String(inputs.fallbackBitrate);
    var bitrate = String(inputs.bitrate);
    var shouldProcess = false;
    streams.forEach(function (stream) {
        var _a, _b, _c;
        if (!stream.removed && stream.codec_type === 'video') {
            var ffType = (0, fileUtils_1.getFfType)(stream.codec_type);
            shouldProcess = true;
            if (useInputBitrate) {
                args.jobLog('Attempting to use % of input bitrate as output bitrate');
                var tracks = (_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.track;
                var inputBitrate = (_c = tracks === null || tracks === void 0 ? void 0 : tracks.find(function (x) { return x.StreamOrder === stream.index.toString(); })) === null || _c === void 0 ? void 0 : _c.BitRate;
                var parsedInputBitrate = parseInt(String(inputBitrate), 10);
                if (inputBitrate && !Number.isNaN(parsedInputBitrate)) {
                    args.jobLog("Found input bitrate: ".concat(inputBitrate));
                    var inputBitrateKbps = parsedInputBitrate / 1000;
                    var targetBitrate = (inputBitrateKbps * (parseInt(targetBitratePercent, 10) / 100));
                    args.jobLog("Setting video bitrate as ".concat(targetBitrate, "k"));
                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(targetBitrate, "k"));
                }
                else {
                    args.jobLog("Unable to find input bitrate, setting fallback bitrate as ".concat(fallbackBitrate, "k"));
                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(fallbackBitrate, "k"));
                }
            }
            else {
                args.jobLog("Using fixed bitrate. Setting video bitrate as ".concat(bitrate, "k"));
                stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate, "k"));
            }
        }
    });
    return shouldProcess;
};
exports.applyVideoBitrate = applyVideoBitrate;
