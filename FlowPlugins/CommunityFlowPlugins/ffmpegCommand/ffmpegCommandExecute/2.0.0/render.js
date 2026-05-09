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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFfmpegCommandV2 = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var renderUtils_1 = require("./renderUtils");
var renderCrop_1 = __importDefault(require("./renderCrop"));
var renderStreamOperations_1 = require("./renderStreamOperations");
var renderAudio_1 = require("./renderAudio");
var renderVideoEncoder_1 = require("./renderVideoEncoder");
var renderVideoFilters_1 = require("./renderVideoFilters");
var renderValidation_1 = require("./renderValidation");
var renderFfmpegCommandV2 = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var commandState, operations, singletonInputs, streams, shouldProcess, container, overallInputArguments, overallOutputArguments, cropBlackBarsInputs, containerInputs, targetContainer, currentContainer, fileContainer, reorderInputs, originalStreams, audioEncoderInputs, normalizeAudioInputs, encoderInputs, bitrateInputs, filteredStreams, spawnArgs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
                commandState = args.variables.ffmpegCommandV2;
                if ((commandState === null || commandState === void 0 ? void 0 : commandState.sourceFileId) && commandState.sourceFileId !== args.inputFileObj._id) {
                    args.jobLog('FFmpeg command v2 input changed between Begin Command and Execute; rendering from current input file.');
                }
                operations = (commandState === null || commandState === void 0 ? void 0 : commandState.operations) || [];
                singletonInputs = (0, renderUtils_1.resolveSingletonOperationInputs)(args, operations);
                streams = (0, renderUtils_1.createInitialWorkingStreams)(args);
                shouldProcess = false;
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                overallInputArguments = [];
                overallOutputArguments = [];
                (0, renderUtils_1.getOperations)(operations, 'customArguments').forEach(function (operation) {
                    var inputArguments = (0, renderUtils_1.splitArgs)(args, operation.inputs.inputArguments);
                    var outputArguments = (0, renderUtils_1.splitArgs)(args, operation.inputs.outputArguments);
                    if (inputArguments.length > 0) {
                        (0, renderUtils_1.appendArgs)(overallInputArguments, inputArguments);
                        shouldProcess = true;
                    }
                    if (outputArguments.length > 0) {
                        (0, renderValidation_1.warnForCustomOutputConflicts)(args, outputArguments);
                        (0, renderUtils_1.appendArgs)(overallOutputArguments, outputArguments);
                        shouldProcess = true;
                    }
                });
                (0, renderUtils_1.getOperations)(operations, 'removeDataStreams').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'data') {
                            shouldProcess = (0, renderUtils_1.markRemoved)(stream) || shouldProcess;
                        }
                    });
                });
                (0, renderUtils_1.getOperations)(operations, 'removeSubtitles').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'subtitle') {
                            shouldProcess = (0, renderUtils_1.markRemoved)(stream) || shouldProcess;
                        }
                    });
                });
                (0, renderUtils_1.getOperations)(operations, 'removeStreamByProperty').forEach(function (operation) {
                    shouldProcess = (0, renderStreamOperations_1.applyRemoveStreamByProperty)(args, streams, operation.inputs) || shouldProcess;
                });
                cropBlackBarsInputs = singletonInputs.cropBlackBars;
                if (cropBlackBarsInputs) {
                    shouldProcess = (0, renderCrop_1.default)(args, streams, cropBlackBarsInputs) || shouldProcess;
                }
                containerInputs = singletonInputs.setContainer;
                if (containerInputs) {
                    targetContainer = String(containerInputs.container);
                    currentContainer = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                    container = targetContainer;
                    if (currentContainer !== targetContainer) {
                        shouldProcess = true;
                        if (containerInputs.forceConform === true) {
                            shouldProcess = (0, renderStreamOperations_1.applyContainerConform)(streams, targetContainer) || shouldProcess;
                        }
                        fileContainer = String(args.inputFileObj.container || '').toLowerCase();
                        if ([
                            'ts',
                            'avi',
                            'mpg',
                            'mpeg',
                        ].includes(fileContainer)) {
                            (0, renderUtils_1.appendArgs)(overallInputArguments, ['-fflags', '+genpts']);
                        }
                    }
                }
                (0, renderUtils_1.getOperations)(operations, 'ensureAudioStream').forEach(function (operation) {
                    shouldProcess = (0, renderAudio_1.applyEnsureAudioStream)(args, streams, operation.inputs) || shouldProcess;
                });
                reorderInputs = singletonInputs.reorderStreams;
                if (reorderInputs) {
                    originalStreams = JSON.stringify(streams);
                    streams = (0, renderStreamOperations_1.applyReorderStreams)(streams, reorderInputs);
                    if (JSON.stringify(streams) !== originalStreams) {
                        shouldProcess = true;
                    }
                }
                audioEncoderInputs = singletonInputs.setAudioEncoder;
                normalizeAudioInputs = singletonInputs.normalizeAudio;
                if (normalizeAudioInputs) {
                    (0, renderValidation_1.assertAudioEncoderConfiguredForNormalize)(args, streams, audioEncoderInputs);
                    shouldProcess = (0, renderAudio_1.applyNormalizeAudio)(args, streams, normalizeAudioInputs) || shouldProcess;
                }
                if ((0, renderValidation_1.hasConfiguredAudioEncoder)(audioEncoderInputs)) {
                    shouldProcess = (0, renderAudio_1.applyAudioEncoder)(streams, audioEncoderInputs) || shouldProcess;
                }
                encoderInputs = singletonInputs.setVideoEncoder;
                if (!encoderInputs) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, renderVideoEncoder_1.applyVideoEncoder)({
                        args: args,
                        streams: streams,
                        operations: operations,
                        inputs: encoderInputs,
                        singletonInputs: singletonInputs,
                        overallInputArguments: overallInputArguments,
                    })];
            case 1:
                shouldProcess = (_a.sent()) || shouldProcess;
                _a.label = 2;
            case 2:
                shouldProcess = (0, renderVideoFilters_1.applyVideoFilters)(args, streams, operations, singletonInputs) || shouldProcess;
                bitrateInputs = singletonInputs.setVideoBitrate;
                if (bitrateInputs) {
                    shouldProcess = (0, renderVideoEncoder_1.applyVideoBitrate)(args, streams, bitrateInputs) || shouldProcess;
                }
                filteredStreams = streams.filter(function (stream) { return !stream.removed; });
                if (filteredStreams.length === 0) {
                    args.jobLog('No streams mapped for new file');
                    throw new Error('No streams mapped for new file');
                }
                (0, renderValidation_1.assertNoImplicitEncoder)(args, filteredStreams);
                spawnArgs = __spreadArray(__spreadArray([
                    '-y'
                ], overallInputArguments, true), [
                    '-i',
                    args.inputFileObj._id,
                ], false);
                filteredStreams.forEach(function (stream) {
                    var outputArgs = (0, renderUtils_1.replaceOutputPlaceholders)(stream.outputArgs, filteredStreams, stream);
                    spawnArgs.push('-map', "0:".concat(stream.sourceIndex));
                    if ((0, renderUtils_1.shouldAddCopyCodec)(outputArgs)) {
                        spawnArgs.push("-c:".concat((0, renderUtils_1.getOutputStreamIndex)(filteredStreams, stream)), 'copy');
                    }
                    (0, renderUtils_1.appendArgs)(spawnArgs, outputArgs);
                });
                (0, renderUtils_1.appendArgs)(spawnArgs, overallOutputArguments);
                return [2 /*return*/, {
                        spawnArgs: spawnArgs.map(function (row) { return row.trim(); }).filter(function (row) { return row !== ''; }),
                        shouldProcess: shouldProcess,
                        container: container,
                        streams: filteredStreams,
                    }];
        }
    });
}); };
exports.renderFfmpegCommandV2 = renderFfmpegCommandV2;
