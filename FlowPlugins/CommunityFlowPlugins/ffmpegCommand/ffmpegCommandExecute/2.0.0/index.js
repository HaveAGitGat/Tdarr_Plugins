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
exports.plugin = exports.details = void 0;
var os_1 = __importDefault(require("os"));
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var hardwareUtils_1 = require("../../../../FlowHelpers/1.0.0/hardwareUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Execute',
    description: 'Execute the FFmpeg command using all gathered plugin inputs',
    style: {
        borderColor: 'green',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: 2,
    icon: 'faPlay',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var getOuputStreamIndex = function (streams, stream) {
    var index = 0;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (streams[idx] === stream) {
            break;
        }
        index += 1;
    }
    return index;
};
var getOuputStreamTypeIndex = function (streams, stream) {
    var index = 0;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (streams[idx] === stream) {
            break;
        }
        if (streams[idx].codec_type === stream.codec_type) {
            index += 1;
        }
    }
    return index;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, cliArgs, pluginInputs, shouldProcess, streams, ffmpegStreams, hardwareDecoding, overallInputArguments, overallOutputArguments, _a, inputArguments, outputArguments, encoderSettings, i, stream, targetCodec, encoderProperties, i, stream, bitrateSettings_1, containerSettings, currentContainer, i, stream, codecType, codecName, targetResolution, getVfScale, i, stream, scaleArgs, framerate, desiredFrameRate_1, _b, propertyToCheck_1, valuesToRemove_1, condition_1, ensureSettings, audioEncoder_1, langTag_1, wantedChannelCount_1, enableBitrate_1, bitrate_1, enableSamplerate_1, samplerate_1, audioCodec_1, getHighest_1, langMatch_1, attemptMakeStream, addedOrExists, reorderSettings, reorderedStreams_1, originalStreams, sortStreams, sortTypes, processOrderArr, k, filteredStreams, _loop_1, i, idx, outputFilePath, spawnArgs, cli, res;
    var _c, _d, _e;
    var _f, _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
                cliArgs = [];
                pluginInputs = args.variables.ffmpegCommand.pluginInputs;
                // Ensure pluginInputs is defined
                if (!pluginInputs) {
                    throw new Error('Plugin inputs not initialized. Make sure to use Begin Command first.');
                }
                cliArgs.push('-y');
                cliArgs.push('-i');
                cliArgs.push(args.inputFileObj._id);
                shouldProcess = args.variables.ffmpegCommand.shouldProcess;
                streams = args.variables.ffmpegCommand.streams;
                ffmpegStreams = __spreadArray([], streams, true);
                hardwareDecoding = false;
                overallInputArguments = [];
                overallOutputArguments = [];
                // Process custom arguments first
                if (pluginInputs.ffmpegCommandCustomArguments) {
                    _a = pluginInputs.ffmpegCommandCustomArguments, inputArguments = _a.inputArguments, outputArguments = _a.outputArguments;
                    if (inputArguments) {
                        overallInputArguments.push.apply(overallInputArguments, inputArguments.split(' '));
                        shouldProcess = true;
                    }
                    if (outputArguments) {
                        overallOutputArguments.push.apply(overallOutputArguments, outputArguments.split(' '));
                        shouldProcess = true;
                    }
                }
                if (!pluginInputs.ffmpegCommandSetVideoEncoder) return [3 /*break*/, 4];
                encoderSettings = pluginInputs.ffmpegCommandSetVideoEncoder;
                hardwareDecoding = encoderSettings.hardwareDecoding;
                i = 0;
                _k.label = 1;
            case 1:
                if (!(i < ffmpegStreams.length)) return [3 /*break*/, 4];
                stream = ffmpegStreams[i];
                if (!(stream.codec_type === 'video' && stream.codec_name !== 'mjpeg')) return [3 /*break*/, 3];
                targetCodec = encoderSettings.outputCodec;
                if (!(encoderSettings.forceEncoding
                    || stream.codec_name !== targetCodec)) return [3 /*break*/, 3];
                shouldProcess = true;
                return [4 /*yield*/, (0, hardwareUtils_1.getEncoder)({
                        targetCodec: targetCodec,
                        hardwareEncoding: encoderSettings.hardwareEncoding,
                        hardwareType: encoderSettings.hardwareType,
                        args: args,
                    })];
            case 2:
                encoderProperties = _k.sent();
                stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);
                if (encoderSettings.ffmpegQualityEnabled) {
                    if (encoderProperties.isGpu) {
                        if (encoderProperties.encoder === 'hevc_qsv') {
                            stream.outputArgs.push('-global_quality', encoderSettings.ffmpegQuality);
                        }
                        else {
                            stream.outputArgs.push('-qp', encoderSettings.ffmpegQuality);
                        }
                    }
                    else {
                        stream.outputArgs.push('-crf', encoderSettings.ffmpegQuality);
                    }
                }
                if (encoderSettings.ffmpegPresetEnabled) {
                    if (targetCodec !== 'av1' && encoderSettings.ffmpegPreset) {
                        stream.outputArgs.push('-preset', encoderSettings.ffmpegPreset);
                    }
                }
                if (hardwareDecoding) {
                    (_c = stream.inputArgs).push.apply(_c, encoderProperties.inputArgs);
                }
                if (encoderProperties.outputArgs) {
                    (_d = stream.outputArgs).push.apply(_d, encoderProperties.outputArgs);
                }
                _k.label = 3;
            case 3:
                i += 1;
                return [3 /*break*/, 1];
            case 4:
                // Process 10-bit video settings
                if ((_f = pluginInputs.ffmpegCommand10BitVideo) === null || _f === void 0 ? void 0 : _f.enabled) {
                    for (i = 0; i < ffmpegStreams.length; i += 1) {
                        stream = ffmpegStreams[i];
                        if (stream.codec_type === 'video') {
                            stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
                            if (stream.outputArgs.some(function (row) { return row.includes('qsv'); }) && os_1.default.platform() !== 'win32') {
                                stream.outputArgs.push('-vf', 'scale_qsv=format=p010le');
                            }
                            else {
                                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
                            }
                            shouldProcess = true;
                        }
                    }
                }
                // Process video bitrate settings
                if (pluginInputs.ffmpegCommandSetVideoBitrate) {
                    bitrateSettings_1 = pluginInputs.ffmpegCommandSetVideoBitrate;
                    ffmpegStreams.forEach(function (stream) {
                        var _a, _b, _c;
                        if (stream.codec_type === 'video') {
                            var ffType = (0, fileUtils_1.getFfType)(stream.codec_type);
                            if (bitrateSettings_1.useInputBitrate) {
                                args.jobLog('Attempting to use % of input bitrate as output bitrate');
                                // check if input bitrate is available
                                var tracks = (_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.track;
                                var inputBitrate = (_c = tracks === null || tracks === void 0 ? void 0 : tracks.find(function (x) { return x.StreamOrder === stream.index.toString(); })) === null || _c === void 0 ? void 0 : _c.BitRate;
                                if (inputBitrate) {
                                    args.jobLog("Found input bitrate: ".concat(inputBitrate));
                                    // @ts-expect-error type
                                    inputBitrate = parseInt(inputBitrate, 10) / 1000;
                                    var targetBitrate = (inputBitrate * (parseInt(bitrateSettings_1.targetBitratePercent, 10) / 100));
                                    args.jobLog("Setting video bitrate as ".concat(targetBitrate, "k"));
                                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(targetBitrate, "k"));
                                }
                                else {
                                    args.jobLog('Unable to find input bitrate, setting fallback bitrate as '
                                        + "".concat(bitrateSettings_1.fallbackBitrate, "k"));
                                    stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrateSettings_1.fallbackBitrate, "k"));
                                }
                            }
                            else {
                                args.jobLog("Using fixed bitrate. Setting video bitrate as ".concat(bitrateSettings_1.bitrate, "k"));
                                stream.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrateSettings_1.bitrate, "k"));
                            }
                            shouldProcess = true;
                        }
                    });
                }
                // Process container settings
                if (pluginInputs.ffmpegCommandSetContainer) {
                    containerSettings = pluginInputs.ffmpegCommandSetContainer;
                    currentContainer = args.inputFileObj.container.toLowerCase();
                    if (currentContainer !== containerSettings.container) {
                        shouldProcess = true;
                        if (containerSettings.forceConform) {
                            for (i = 0; i < ffmpegStreams.length; i += 1) {
                                stream = ffmpegStreams[i];
                                try {
                                    codecType = stream.codec_type.toLowerCase();
                                    codecName = stream.codec_name.toLowerCase();
                                    if (containerSettings.container === 'mkv') {
                                        if (codecType === 'data'
                                            || [
                                                'mov_text',
                                                'eia_608',
                                                'timed_id3',
                                            ].includes(codecName)) {
                                            stream.removed = true;
                                        }
                                    }
                                    if (containerSettings.container === 'mp4') {
                                        if (codecType === 'attachment'
                                            || [
                                                'hdmv_pgs_subtitle',
                                                'eia_608',
                                                'timed_id3',
                                                'subrip',
                                                'ass',
                                                'ssa',
                                            ].includes(codecName)) {
                                            stream.removed = true;
                                        }
                                    }
                                }
                                catch (err) {
                                    // Error
                                }
                            }
                        }
                        // handle genpts if coming from odd container
                        if ([
                            'ts',
                            'avi',
                            'mpg',
                            'mpeg',
                        ].includes(currentContainer)) {
                            overallInputArguments.push('-fflags', '+genpts');
                        }
                    }
                }
                // Process video resolution settings
                if (pluginInputs.ffmpegCommandSetVdeoResolution) {
                    targetResolution = pluginInputs.ffmpegCommandSetVdeoResolution.targetResolution;
                    getVfScale = function (resolution) {
                        switch (resolution) {
                            case '480p':
                                return ['-vf', 'scale=720:-2'];
                            case '576p':
                                return ['-vf', 'scale=720:-2'];
                            case '720p':
                                return ['-vf', 'scale=1280:-2'];
                            case '1080p':
                                return ['-vf', 'scale=1920:-2'];
                            case '1440p':
                                return ['-vf', 'scale=2560:-2'];
                            case '4KUHD':
                                return ['-vf', 'scale=3840:-2'];
                            default:
                                return ['-vf', 'scale=1920:-2'];
                        }
                    };
                    for (i = 0; i < ffmpegStreams.length; i += 1) {
                        stream = ffmpegStreams[i];
                        if (stream.codec_type === 'video') {
                            if (targetResolution !== args.inputFileObj.video_resolution) {
                                shouldProcess = true;
                                scaleArgs = getVfScale(targetResolution);
                                (_e = stream.outputArgs).push.apply(_e, scaleArgs);
                            }
                        }
                    }
                }
                // Process video framerate settings
                if (pluginInputs.ffmpegCommandSetVdeoFramerate) {
                    framerate = pluginInputs.ffmpegCommandSetVdeoFramerate.framerate;
                    desiredFrameRate_1 = framerate;
                    args.jobLog("Desired framerate: ".concat(desiredFrameRate_1));
                    ffmpegStreams.forEach(function (stream) {
                        if (stream.codec_type === 'video') {
                            var fileFramerateUsed = false;
                            if (stream.avg_frame_rate) {
                                var parts = stream.avg_frame_rate.split('/');
                                if (parts.length === 2) {
                                    var numerator = parseInt(parts[0], 10);
                                    var denominator = parseInt(parts[1], 10);
                                    if (numerator > 0 && denominator > 0) {
                                        var fileFramerate = numerator / denominator;
                                        args.jobLog("File framerate: ".concat(fileFramerate));
                                        if (fileFramerate < desiredFrameRate_1) {
                                            args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
                                            stream.outputArgs.push('-r', "".concat(String(fileFramerate)));
                                            fileFramerateUsed = true;
                                        }
                                        else {
                                            args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
                                        }
                                    }
                                }
                            }
                            if (!fileFramerateUsed) {
                                args.jobLog('Using desired framerate.');
                                stream.outputArgs.push('-r', "".concat(String(desiredFrameRate_1)));
                            }
                            shouldProcess = true;
                        }
                    });
                }
                // Process HDR to SDR conversion
                if ((_g = pluginInputs.ffmpegCommandHdrToSdr) === null || _g === void 0 ? void 0 : _g.enabled) {
                    ffmpegStreams.forEach(function (stream) {
                        if (stream.codec_type === 'video') {
                            stream.outputArgs.push('-vf', 'zscale=t=linear:npl=100,format=yuv420p');
                            shouldProcess = true;
                        }
                    });
                }
                // Process remove subtitles
                if ((_h = pluginInputs.ffmpegCommandRemoveSubtitles) === null || _h === void 0 ? void 0 : _h.enabled) {
                    ffmpegStreams.forEach(function (stream) {
                        if (stream.codec_type === 'subtitle') {
                            // eslint-disable-next-line no-param-reassign
                            stream.removed = true;
                            shouldProcess = true;
                        }
                    });
                }
                // Process remove stream by property
                if (pluginInputs.ffmpegCommandRemoveStreamByProperty) {
                    _b = pluginInputs.ffmpegCommandRemoveStreamByProperty, propertyToCheck_1 = _b.propertyToCheck, valuesToRemove_1 = _b.valuesToRemove, condition_1 = _b.condition;
                    ffmpegStreams.forEach(function (stream) {
                        var _a;
                        var target = '';
                        if (propertyToCheck_1.includes('.')) {
                            var parts = propertyToCheck_1.split('.');
                            target = (_a = stream[parts[0]]) === null || _a === void 0 ? void 0 : _a[parts[1]];
                        }
                        else {
                            target = stream[propertyToCheck_1];
                        }
                        if (target) {
                            var prop = String(target).toLowerCase();
                            for (var i = 0; i < valuesToRemove_1.length; i += 1) {
                                var val = valuesToRemove_1[i].toLowerCase();
                                var prefix = "Removing stream index ".concat(stream.index, " because ").concat(propertyToCheck_1, " of ").concat(prop);
                                if (condition_1 === 'includes' && prop.includes(val)) {
                                    args.jobLog("".concat(prefix, " includes ").concat(val, "\n"));
                                    // eslint-disable-next-line no-param-reassign
                                    stream.removed = true;
                                    shouldProcess = true;
                                }
                                else if (condition_1 === 'not_includes' && !prop.includes(val)) {
                                    args.jobLog("".concat(prefix, " not_includes ").concat(val, "\n"));
                                    // eslint-disable-next-line no-param-reassign
                                    stream.removed = true;
                                    shouldProcess = true;
                                }
                            }
                        }
                    });
                }
                // Process ensure audio stream
                if (pluginInputs.ffmpegCommandEnsureAudioStream) {
                    ensureSettings = pluginInputs.ffmpegCommandEnsureAudioStream;
                    audioEncoder_1 = ensureSettings.audioEncoder, langTag_1 = ensureSettings.language, wantedChannelCount_1 = ensureSettings.channels;
                    enableBitrate_1 = ensureSettings.enableBitrate, bitrate_1 = ensureSettings.bitrate, enableSamplerate_1 = ensureSettings.enableSamplerate, samplerate_1 = ensureSettings.samplerate;
                    audioCodec_1 = audioEncoder_1;
                    if (audioEncoder_1 === 'dca') {
                        audioCodec_1 = 'dts';
                    }
                    if (audioEncoder_1 === 'libmp3lame') {
                        audioCodec_1 = 'mp3';
                    }
                    if (audioEncoder_1 === 'libopus') {
                        audioCodec_1 = 'opus';
                    }
                    getHighest_1 = function (first, second) {
                        if (((first === null || first === void 0 ? void 0 : first.channels) || 0) > ((second === null || second === void 0 ? void 0 : second.channels) || 0)) {
                            return first;
                        }
                        return second;
                    };
                    langMatch_1 = function (stream) {
                        var _a;
                        return ((langTag_1 === 'und'
                            && (stream.tags === undefined || stream.tags.language === undefined))
                            || (((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) && stream.tags.language.toLowerCase().includes(langTag_1)));
                    };
                    attemptMakeStream = function (targetLangTag) {
                        var streamsWithLangTag = ffmpegStreams.filter(function (stream) {
                            if (stream.codec_type === 'audio' && langMatch_1(stream)) {
                                return true;
                            }
                            return false;
                        });
                        if (streamsWithLangTag.length === 0) {
                            args.jobLog("No streams with language tag ".concat(targetLangTag, " found. Skipping \n"));
                            return false;
                        }
                        var streamWithHighestChannel = streamsWithLangTag.reduce(getHighest_1);
                        var highestChannelCount = Number(streamWithHighestChannel.channels);
                        var targetChannels = 0;
                        if (wantedChannelCount_1 <= highestChannelCount) {
                            targetChannels = wantedChannelCount_1;
                            args.jobLog("The wanted channel count ".concat(wantedChannelCount_1, " is <= than the highest ")
                                + "available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
                        }
                        else {
                            targetChannels = highestChannelCount;
                            args.jobLog("The wanted channel count ".concat(wantedChannelCount_1, " is higher than the highest ")
                                + "available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
                        }
                        var hasStreamAlready = ffmpegStreams.filter(function (stream) {
                            if (stream.codec_type === 'audio'
                                && langMatch_1(stream)
                                && stream.codec_name === audioCodec_1
                                && stream.channels === targetChannels) {
                                return true;
                            }
                            return false;
                        });
                        if (hasStreamAlready.length > 0) {
                            args.jobLog("File already has ".concat(targetLangTag, " stream in ").concat(audioEncoder_1, ", ").concat(targetChannels, " channels \n"));
                            return true;
                        }
                        args.jobLog("Adding ".concat(targetLangTag, " stream in ").concat(audioEncoder_1, ", ").concat(targetChannels, " channels \n"));
                        var streamCopy = JSON.parse(JSON.stringify(streamWithHighestChannel));
                        streamCopy.removed = false;
                        streamCopy.index = ffmpegStreams.length;
                        streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder_1);
                        streamCopy.outputArgs.push('-ac', "".concat(targetChannels));
                        if (enableBitrate_1) {
                            var ffType = (0, fileUtils_1.getFfType)(streamCopy.codec_type);
                            streamCopy.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate_1));
                        }
                        if (enableSamplerate_1) {
                            streamCopy.outputArgs.push('-ar', "".concat(samplerate_1));
                        }
                        shouldProcess = true;
                        ffmpegStreams.push(streamCopy);
                        return true;
                    };
                    addedOrExists = attemptMakeStream(langTag_1);
                    if (!addedOrExists) {
                        attemptMakeStream('und');
                    }
                }
                // Process stream reordering
                if (pluginInputs.ffmpegCommandRorderStreams) {
                    reorderSettings = pluginInputs.ffmpegCommandRorderStreams;
                    reorderedStreams_1 = JSON.parse(JSON.stringify(ffmpegStreams));
                    reorderedStreams_1.forEach(function (stream, index) {
                        // eslint-disable-next-line no-param-reassign
                        stream.typeIndex = index;
                    });
                    originalStreams = JSON.stringify(reorderedStreams_1);
                    sortStreams = function (sortType) {
                        var items = sortType.inputs.split(',');
                        items.reverse();
                        for (var i = 0; i < items.length; i += 1) {
                            var matchedStreams = [];
                            for (var j = 0; j < reorderedStreams_1.length; j += 1) {
                                if (String(sortType.getValue(reorderedStreams_1[j])) === String(items[i])) {
                                    if (reorderedStreams_1[j].codec_long_name
                                        && (reorderedStreams_1[j].codec_long_name.includes('image')
                                            || reorderedStreams_1[j].codec_name.includes('png'))) {
                                        // do nothing, ffmpeg bug, doesn't move image streams
                                    }
                                    else {
                                        matchedStreams.push(reorderedStreams_1[j]);
                                        reorderedStreams_1.splice(j, 1);
                                        j -= 1;
                                    }
                                }
                            }
                            reorderedStreams_1 = matchedStreams.concat(reorderedStreams_1);
                        }
                    };
                    sortTypes = {
                        languages: {
                            getValue: function (stream) {
                                var _a;
                                if ((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) {
                                    return stream.tags.language;
                                }
                                return '';
                            },
                            inputs: reorderSettings.languages,
                        },
                        codecs: {
                            getValue: function (stream) {
                                try {
                                    return stream.codec_name;
                                }
                                catch (err) {
                                    // err
                                }
                                return '';
                            },
                            inputs: reorderSettings.codecs,
                        },
                        channels: {
                            getValue: function (stream) {
                                var chanMap = {
                                    8: '7.1',
                                    6: '5.1',
                                    2: '2',
                                    1: '1',
                                };
                                if ((stream === null || stream === void 0 ? void 0 : stream.channels) && chanMap[stream.channels]) {
                                    return chanMap[stream.channels];
                                }
                                return '';
                            },
                            inputs: reorderSettings.channels,
                        },
                        streamTypes: {
                            getValue: function (stream) {
                                if (stream.codec_type) {
                                    return stream.codec_type;
                                }
                                return '';
                            },
                            inputs: reorderSettings.streamTypes,
                        },
                    };
                    processOrderArr = reorderSettings.processOrder.split(',');
                    for (k = 0; k < processOrderArr.length; k += 1) {
                        if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
                            sortStreams(sortTypes[processOrderArr[k]]);
                        }
                    }
                    if (JSON.stringify(reorderedStreams_1) !== originalStreams) {
                        shouldProcess = true;
                        // Replace the ffmpegStreams with reordered streams
                        ffmpegStreams.length = 0;
                        ffmpegStreams.push.apply(ffmpegStreams, reorderedStreams_1);
                    }
                }
                // Process remove data streams
                if ((_j = pluginInputs.ffmpegCommandRemoveDataStreams) === null || _j === void 0 ? void 0 : _j.enabled) {
                    ffmpegStreams.forEach(function (stream) {
                        if (stream.codec_type === 'data') {
                            // eslint-disable-next-line no-param-reassign
                            stream.removed = true;
                            shouldProcess = true;
                        }
                    });
                }
                filteredStreams = ffmpegStreams.filter(function (stream) { return !stream.removed; });
                if (filteredStreams.length === 0) {
                    args.jobLog('No streams mapped for new file');
                    throw new Error('No streams mapped for new file');
                }
                _loop_1 = function (i) {
                    var stream = filteredStreams[i];
                    // Replace placeholders in output args
                    stream.outputArgs = stream.outputArgs.map(function (arg) {
                        if (arg.includes('{outputIndex}')) {
                            // eslint-disable-next-line no-param-reassign
                            arg = arg.replace('{outputIndex}', String(getOuputStreamIndex(filteredStreams, stream)));
                        }
                        if (arg.includes('{outputTypeIndex}')) {
                            // eslint-disable-next-line no-param-reassign
                            arg = arg.replace('{outputTypeIndex}', String(getOuputStreamTypeIndex(filteredStreams, stream)));
                        }
                        return arg;
                    });
                    cliArgs.push.apply(cliArgs, stream.mapArgs);
                    if (stream.outputArgs.length === 0) {
                        cliArgs.push("-c:".concat(getOuputStreamIndex(filteredStreams, stream)), 'copy');
                    }
                    else {
                        cliArgs.push.apply(cliArgs, stream.outputArgs);
                    }
                    overallInputArguments.push.apply(overallInputArguments, stream.inputArgs);
                };
                // Build the final command
                for (i = 0; i < filteredStreams.length; i += 1) {
                    _loop_1(i);
                }
                idx = cliArgs.indexOf('-i');
                cliArgs.splice.apply(cliArgs, __spreadArray([idx, 0], overallInputArguments, false));
                // Add output arguments
                if (overallOutputArguments.length > 0) {
                    cliArgs.push.apply(cliArgs, overallOutputArguments);
                    shouldProcess = true;
                }
                if (!shouldProcess) {
                    args.jobLog('No need to process file, already as required');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id))
                    + ".".concat(args.variables.ffmpegCommand.container);
                cliArgs.push(outputFilePath);
                spawnArgs = cliArgs.map(function (row) { return row.trim(); }).filter(function (row) { return row !== ''; });
                args.jobLog('Processing file');
                args.jobLog(JSON.stringify({
                    spawnArgs: spawnArgs,
                    outputFilePath: outputFilePath,
                }));
                args.updateWorker({
                    CLIType: args.ffmpegPath,
                    preset: spawnArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: spawnArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 5:
                res = _k.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('FFmpeg failed');
                }
                args.logOutcome('tSuc');
                // Reset the v2.0.0 ffmpegCommand structure
                // eslint-disable-next-line no-param-reassign
                args.variables.ffmpegCommand.init = false;
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
