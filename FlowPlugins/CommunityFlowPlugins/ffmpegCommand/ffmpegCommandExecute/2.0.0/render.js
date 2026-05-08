"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.renderFfmpegCommandV2 = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var hardwareUtils_1 = require("../../../../FlowHelpers/1.0.0/hardwareUtils");
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
var createInitialWorkingStreams = function (args) {
    try {
        var streams = clone(args.inputFileObj.ffProbeData.streams);
        if (!Array.isArray(streams)) {
            throw new Error('FFprobe streams is not an array');
        }
        return streams.map(function (stream) {
            var _a;
            var normalizedStream = __assign({}, stream);
            if (Number((_a = stream === null || stream === void 0 ? void 0 : stream.disposition) === null || _a === void 0 ? void 0 : _a.attached_pic) === 1) {
                normalizedStream.codec_type = 'attachment';
            }
            return __assign(__assign({}, normalizedStream), { removed: false, sourceIndex: stream.index, outputArgs: [] });
        });
    }
    catch (err) {
        var message = "Error parsing FFprobe streams, it seems FFprobe could not scan the file: ".concat(JSON.stringify(err));
        args.jobLog(message);
        throw new Error(message);
    }
};
var splitArgs = function (args, value) {
    var _a;
    var rawValue = String(value || '').trim();
    if (rawValue === '') {
        return [];
    }
    var parseArgsStringToArgv = (_a = args === null || args === void 0 ? void 0 : args.deps) === null || _a === void 0 ? void 0 : _a.parseArgsStringToArgv;
    if (typeof parseArgsStringToArgv === 'function') {
        try {
            var parsedArgs = parseArgsStringToArgv(rawValue, '', '');
            if (Array.isArray(parsedArgs)) {
                return parsedArgs.map(function (row) { return String(row).trim(); }).filter(function (row) { return row !== ''; });
            }
        }
        catch (err) {
            // Fall back to v1-compatible splitting if the injected parser is unavailable.
        }
    }
    return rawValue
        .split(' ')
        .map(function (row) { return row.trim(); })
        .filter(function (row) { return row !== ''; });
};
var getRequests = function (requests, requestType) { return requests.filter(function (request) { return request.requestType === requestType; }); };
var getLastRequestInputs = function (requests, requestType) {
    var matches = getRequests(requests, requestType);
    return matches.length > 0 ? matches[matches.length - 1].inputs : undefined;
};
var hasRequest = function (requests, requestType) { return (getRequests(requests, requestType).length > 0); };
var getOutputStreamIndex = function (streams, stream) {
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (streams[idx] === stream) {
            return idx;
        }
    }
    return -1;
};
var getOutputStreamTypeIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (streams[idx].codec_type === stream.codec_type) {
            index += 1;
        }
        if (streams[idx] === stream) {
            break;
        }
    }
    return index;
};
var hasCodecOutputArg = function (outputArgs) { return outputArgs.some(function (arg) { return (/^-(c|codec)(:|$)/.test(arg)
    || /^-[vasd]codec(:|$)/.test(arg)); }); };
var isCopyCompatibleOutputOption = function (arg) { return (arg === '-metadata'
    || arg.startsWith('-metadata:')
    || arg === '-disposition'
    || arg.startsWith('-disposition:')); };
var hasOnlyCopyCompatibleOutputArgs = function (outputArgs) {
    for (var i = 0; i < outputArgs.length; i += 1) {
        var arg = outputArgs[i];
        if (!isCopyCompatibleOutputOption(arg)) {
            return false;
        }
        i += 1;
    }
    return true;
};
var shouldAddCopyCodec = function (outputArgs) { return (outputArgs.length === 0
    || (!hasCodecOutputArg(outputArgs) && hasOnlyCopyCompatibleOutputArgs(outputArgs))); };
var appendArgs = function (target, argsToAppend) {
    argsToAppend.forEach(function (arg) {
        target.push(arg);
    });
};
var appendArgsOnce = function (target, argsToAppend) {
    if (argsToAppend.length === 0) {
        return;
    }
    var _loop_1 = function (i) {
        var hasSequence = argsToAppend.every(function (arg, index) { return target[i + index] === arg; });
        if (hasSequence) {
            return { value: void 0 };
        }
    };
    for (var i = 0; i <= target.length - argsToAppend.length; i += 1) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    appendArgs(target, argsToAppend);
};
var replaceOutputPlaceholders = function (outputArgs, streams, stream) { return outputArgs.map(function (arg) {
    var nextArg = arg;
    if (nextArg.includes('{outputIndex}')) {
        nextArg = nextArg.replace('{outputIndex}', String(getOutputStreamIndex(streams, stream)));
    }
    if (nextArg.includes('{outputTypeIndex}')) {
        nextArg = nextArg.replace('{outputTypeIndex}', String(getOutputStreamTypeIndex(streams, stream)));
    }
    return nextArg;
}); };
var getNestedProperty = function (stream, propertyToCheck) {
    var _a;
    if (propertyToCheck.includes('.')) {
        var parts = propertyToCheck.split('.');
        return (_a = stream[parts[0]]) === null || _a === void 0 ? void 0 : _a[parts[1]];
    }
    return stream[propertyToCheck];
};
var markRemoved = function (stream) {
    if (!stream.removed) {
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
        return true;
    }
    return false;
};
var getQsvScaleFilter = function (targetResolution, format) {
    var formatSuffix = format ? ":format=".concat(format) : '';
    switch (targetResolution) {
        case '480p':
            return "vpp_qsv=w=720:h=480".concat(formatSuffix);
        case '576p':
            return "vpp_qsv=w=720:h=576".concat(formatSuffix);
        case '720p':
            return "vpp_qsv=w=1280:h=720".concat(formatSuffix);
        case '1080p':
            return "vpp_qsv=w=1920:h=1080".concat(formatSuffix);
        case '1440p':
            return "vpp_qsv=w=2560:h=1440".concat(formatSuffix);
        case '4KUHD':
            return "vpp_qsv=w=3840:h=2160".concat(formatSuffix);
        default:
            return "vpp_qsv=w=1920:h=1080".concat(formatSuffix);
    }
};
var getSoftwareScaleFilter = function (targetResolution) {
    switch (targetResolution) {
        case '480p':
            return 'scale=720:-2';
        case '576p':
            return 'scale=720:-2';
        case '720p':
            return 'scale=1280:-2';
        case '1080p':
            return 'scale=1920:-2';
        case '1440p':
            return 'scale=2560:-2';
        case '4KUHD':
            return 'scale=3840:-2';
        default:
            return 'scale=1920:-2';
    }
};
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
var getFrameRateFilter = function (args, stream, desiredFrameRate) {
    var frameRate = desiredFrameRate;
    args.jobLog("Desired framerate: ".concat(desiredFrameRate));
    if (stream.avg_frame_rate) {
        var parts = stream.avg_frame_rate.split('/');
        if (parts.length === 2) {
            var numerator = parseInt(parts[0], 10);
            var denominator = parseInt(parts[1], 10);
            if (numerator > 0 && denominator > 0) {
                var fileFramerate = numerator / denominator;
                args.jobLog("File framerate: ".concat(fileFramerate));
                if (fileFramerate < desiredFrameRate) {
                    args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
                    frameRate = fileFramerate;
                }
                else {
                    args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
                }
            }
        }
    }
    return "fps=".concat(String(frameRate));
};
var applyRemoveStreamByProperty = function (args, streams, inputs) {
    var codecType = String(inputs.codecType).trim();
    var propertyToCheck = String(inputs.propertyToCheck).trim();
    var valuesToRemove = String(inputs.valuesToRemove).trim().split(',').map(function (item) { return item.trim(); })
        .filter(function (row) { return row.length > 0; });
    var condition = String(inputs.condition);
    var changed = false;
    streams
        .filter(function (stream) { return codecType === 'any' || stream.codec_type === codecType; })
        .forEach(function (stream) {
        var target = getNestedProperty(stream, propertyToCheck);
        if (target === undefined || target === null) {
            return;
        }
        var prop = String(target).toLowerCase();
        var lowerValues = valuesToRemove.map(function (val) { return val.toLowerCase(); });
        var shouldRemove = false;
        switch (condition) {
            case 'includes':
                shouldRemove = lowerValues.some(function (val) { return prop.includes(val); });
                break;
            case 'not_includes':
                shouldRemove = !lowerValues.some(function (val) { return prop.includes(val); });
                break;
            case 'equals':
                shouldRemove = lowerValues.some(function (val) { return prop === val; });
                break;
            case 'not_equals':
                shouldRemove = !lowerValues.some(function (val) { return prop === val; });
                break;
            default:
                shouldRemove = false;
        }
        var valuesStr = valuesToRemove.join(', ');
        var action = shouldRemove ? 'Removing' : 'Keep';
        args.jobLog("".concat(action, " stream index ").concat(stream.index, " because ").concat(propertyToCheck, " of ").concat(prop, " ").concat(condition, " ").concat(valuesStr, "\n"));
        if (shouldRemove) {
            changed = markRemoved(stream) || changed;
        }
    });
    return changed;
};
var applyContainerConform = function (streams, container) {
    var changed = false;
    for (var i = 0; i < streams.length; i += 1) {
        var stream = streams[i];
        try {
            var codecType = stream.codec_type.toLowerCase();
            var codecName = stream.codec_name.toLowerCase();
            if (container === 'mkv'
                && (codecType === 'data'
                    || [
                        'mov_text',
                        'eia_608',
                        'timed_id3',
                    ].includes(codecName))) {
                changed = markRemoved(stream) || changed;
            }
            if (container === 'mp4'
                && (codecType === 'attachment'
                    || [
                        'hdmv_pgs_subtitle',
                        'eia_608',
                        'timed_id3',
                        'subrip',
                        'ass',
                        'ssa',
                    ].includes(codecName))) {
                changed = markRemoved(stream) || changed;
            }
        }
        catch (err) {
            // Ignore incomplete stream metadata.
        }
    }
    return changed;
};
var applyEnsureAudioStream = function (args, streams, inputs) {
    var audioEncoder = String(inputs.audioEncoder);
    var langTag = String(inputs.language).toLowerCase();
    var wantedChannelCount = Number(inputs.channels);
    var enableBitrate = inputs.enableBitrate === true;
    var bitrate = String(inputs.bitrate);
    var enableSamplerate = inputs.enableSamplerate === true;
    var samplerate = String(inputs.samplerate);
    var audioCodec = audioEncoder;
    if (audioEncoder === 'dca') {
        audioCodec = 'dts';
    }
    if (audioEncoder === 'libmp3lame') {
        audioCodec = 'mp3';
    }
    if (audioEncoder === 'libopus') {
        audioCodec = 'opus';
    }
    var getHighest = function (first, second) {
        if (((first === null || first === void 0 ? void 0 : first.channels) || 0) > ((second === null || second === void 0 ? void 0 : second.channels) || 0)) {
            return first;
        }
        return second;
    };
    var langMatch = function (stream, targetLangTag) {
        var _a;
        return ((targetLangTag === 'und'
            && (stream.tags === undefined || stream.tags.language === undefined))
            || (((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) && stream.tags.language.toLowerCase().includes(targetLangTag)));
    };
    var attemptMakeStream = function (targetLangTag) {
        var streamsWithLangTag = streams.filter(function (stream) { return (!stream.removed
            && stream.codec_type === 'audio'
            && langMatch(stream, targetLangTag)); });
        if (streamsWithLangTag.length === 0) {
            args.jobLog("No streams with language tag ".concat(targetLangTag, " found. Skipping \n"));
            return {
                handled: false,
                changed: false,
            };
        }
        var streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
        var highestChannelCount = Number(streamWithHighestChannel.channels);
        var targetChannels = 0;
        if (wantedChannelCount <= highestChannelCount) {
            targetChannels = wantedChannelCount;
            args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is <= than the")
                + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
        }
        else {
            targetChannels = highestChannelCount;
            args.jobLog("The wanted channel count ".concat(wantedChannelCount, " is higher than the")
                + " highest available channel count (".concat(streamWithHighestChannel.channels, "). \n"));
        }
        var hasStreamAlready = streams.filter(function (stream) { return (!stream.removed
            && stream.codec_type === 'audio'
            && langMatch(stream, targetLangTag)
            && stream.codec_name === audioCodec
            && stream.channels === targetChannels); });
        if (hasStreamAlready.length > 0) {
            args.jobLog("File already has ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
            return {
                handled: true,
                changed: false,
            };
        }
        args.jobLog("Adding ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        var streamCopy = __assign(__assign({}, clone(streamWithHighestChannel)), { removed: false, index: streams.length, sourceIndex: streamWithHighestChannel.sourceIndex, outputArgs: [
                '-c:{outputIndex}',
                audioEncoder,
                '-ac',
                "".concat(targetChannels),
            ] });
        if (enableBitrate) {
            var ffType = (0, fileUtils_1.getFfType)(streamCopy.codec_type);
            streamCopy.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate));
        }
        if (enableSamplerate) {
            streamCopy.outputArgs.push('-ar', "".concat(samplerate));
        }
        streams.push(streamCopy);
        return {
            handled: true,
            changed: true,
        };
    };
    var addedOrExists = attemptMakeStream(langTag);
    if (!addedOrExists.handled) {
        return attemptMakeStream('und').changed;
    }
    return addedOrExists.changed;
};
var applyReorderStreams = function (streams, inputs) {
    var reorderedStreams = clone(streams);
    var sortStreams = function (sortType) {
        var items = sortType.inputs.split(',');
        items.reverse();
        for (var i = 0; i < items.length; i += 1) {
            var matchedStreams = [];
            for (var j = 0; j < reorderedStreams.length; j += 1) {
                if (String(sortType.getValue(reorderedStreams[j])) === String(items[i])) {
                    if (reorderedStreams[j].codec_long_name
                        && (reorderedStreams[j].codec_long_name.includes('image')
                            || reorderedStreams[j].codec_name.includes('png'))) {
                        // Do not move image streams due to FFmpeg map behavior.
                    }
                    else {
                        matchedStreams.push(reorderedStreams[j]);
                        reorderedStreams.splice(j, 1);
                        j -= 1;
                    }
                }
            }
            reorderedStreams = matchedStreams.concat(reorderedStreams);
        }
    };
    var sortTypes = {
        languages: {
            getValue: function (stream) {
                var _a;
                if ((_a = stream === null || stream === void 0 ? void 0 : stream.tags) === null || _a === void 0 ? void 0 : _a.language) {
                    return stream.tags.language;
                }
                return '';
            },
            inputs: String(inputs.languages),
        },
        codecs: {
            getValue: function (stream) {
                try {
                    return stream.codec_name;
                }
                catch (err) {
                    // Ignore incomplete stream metadata.
                }
                return '';
            },
            inputs: String(inputs.codecs),
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
            inputs: String(inputs.channels),
        },
        streamTypes: {
            getValue: function (stream) {
                if (stream.codec_type) {
                    return stream.codec_type;
                }
                return '';
            },
            inputs: String(inputs.streamTypes),
        },
    };
    var processOrderArr = String(inputs.processOrder).split(',');
    for (var k = 0; k < processOrderArr.length; k += 1) {
        if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
            sortStreams(sortTypes[processOrderArr[k]]);
        }
    }
    return reorderedStreams;
};
var applyVideoEncoder = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var shouldProcess, targetCodec, ffmpegPresetEnabled, ffmpegPreset, ffmpegQualityEnabled, ffmpegQuality, hardwareEncoding, hardwareType, hardwareDecoding, forceEncoding, encoderProperties, i, stream, presetToUse;
    var args = _b.args, streams = _b.streams, inputs = _b.inputs, overallInputArguments = _b.overallInputArguments;
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
                i = 0;
                _c.label = 1;
            case 1:
                if (!(i < streams.length)) return [3 /*break*/, 5];
                stream = streams[i];
                if (!(stream.codec_type === 'video'
                    && stream.codec_name !== 'mjpeg'
                    && (forceEncoding || stream.codec_name !== targetCodec))) return [3 /*break*/, 4];
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
                if (hardwareDecoding) {
                    appendArgsOnce(overallInputArguments, encoderProperties.inputArgs);
                }
                if (encoderProperties.outputArgs) {
                    appendArgs(stream.outputArgs, encoderProperties.outputArgs);
                }
                _c.label = 4;
            case 4:
                i += 1;
                return [3 /*break*/, 1];
            case 5: return [2 /*return*/, shouldProcess];
        }
    });
}); };
var applyVideoBitrate = function (args, streams, inputs) {
    var useInputBitrate = inputs.useInputBitrate === true;
    var targetBitratePercent = String(inputs.targetBitratePercent);
    var fallbackBitrate = String(inputs.fallbackBitrate);
    var bitrate = String(inputs.bitrate);
    var shouldProcess = false;
    streams.forEach(function (stream) {
        var _a, _b, _c;
        if (stream.codec_type === 'video') {
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
var applyVideoFilters = function (args, streams, requests) {
    var resolutionInputs = getLastRequestInputs(requests, 'setVideoResolution');
    var frameRateInputs = getLastRequestInputs(requests, 'setVideoFramerate');
    var has10BitRequest = hasRequest(requests, 'set10BitVideo');
    var hasHdrToSdrRequest = hasRequest(requests, 'hdrToSdr');
    var shouldProcess = false;
    streams.forEach(function (stream) {
        var _a, _b;
        if (stream.codec_type !== 'video') {
            return;
        }
        var filterChain = [];
        var usesQsv = ((_a = stream.encoder) === null || _a === void 0 ? void 0 : _a.encoder.includes('qsv')) === true;
        var hardwareDecoding = usesQsv && stream.hardwareDecoding === true;
        var shouldScale = (resolutionInputs
            && String(resolutionInputs.targetResolution) !== args.inputFileObj.video_resolution);
        if (usesQsv
            && hardwareDecoding
            && shouldScale
            && !hasHdrToSdrRequest
            && !frameRateInputs) {
            filterChain.push(getQsvScaleFilter(String(resolutionInputs.targetResolution), has10BitRequest ? 'p010le' : undefined));
        }
        else if (usesQsv
            && hardwareDecoding
            && has10BitRequest
            && !shouldScale
            && !hasHdrToSdrRequest
            && !frameRateInputs) {
            filterChain.push('scale_qsv=format=p010le');
        }
        else {
            if (usesQsv && hardwareDecoding && (hasHdrToSdrRequest || shouldScale || frameRateInputs)) {
                filterChain.push('hwdownload', 'format=nv12');
            }
            if (hasHdrToSdrRequest) {
                filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
            }
            if (shouldScale && resolutionInputs) {
                filterChain.push(getSoftwareScaleFilter(String(resolutionInputs.targetResolution)));
            }
            if (frameRateInputs) {
                filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
            }
            if (usesQsv && has10BitRequest) {
                filterChain.push('format=p010le');
            }
            if (usesQsv && hardwareDecoding && (hasHdrToSdrRequest || shouldScale || frameRateInputs)) {
                filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
            }
            else if (usesQsv && has10BitRequest && filterChain.length === 0) {
                filterChain.push('scale_qsv=format=p010le');
            }
        }
        if (filterChain.length > 0) {
            stream.outputArgs.push('-filter:v:{outputTypeIndex}', filterChain.join(','));
            shouldProcess = true;
        }
        if (has10BitRequest) {
            var isLibsvtav1 = ((_b = stream.encoder) === null || _b === void 0 ? void 0 : _b.encoder) === 'libsvtav1'
                || stream.outputArgs.some(function (row) { return String(row).includes('libsvtav1'); });
            if (!isLibsvtav1) {
                stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
            }
            if (usesQsv && hardwareDecoding) {
                if (filterChain.length === 0) {
                    stream.outputArgs.push('-filter:v:{outputTypeIndex}', 'scale_qsv=format=p010le');
                }
            }
            else if (isLibsvtav1) {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'yuv420p10le');
            }
            else {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
            }
            shouldProcess = true;
        }
        if (hasHdrToSdrRequest) {
            shouldProcess = true;
        }
        if (shouldScale) {
            shouldProcess = true;
        }
        if (frameRateInputs) {
            shouldProcess = true;
        }
    });
    return shouldProcess;
};
var warnForCustomOutputConflicts = function (args, outputArguments) {
    var conflictArgs = [
        '-vf',
        '-filter',
        '-filter:v',
        '-c',
        '-codec',
        '-map',
    ];
    var hasConflict = outputArguments.some(function (arg) { return conflictArgs.some(function (conflictArg) { return (arg === conflictArg || arg.startsWith("".concat(conflictArg, ":"))); }); });
    if (hasConflict) {
        args.jobLog('Custom FFmpeg output arguments include command-shaping options that may conflict with v2 rendering.');
    }
};
var logNoopRequests = function (args, requests) {
    getRequests(requests, 'cropBlackBars').forEach(function () {
        args.jobLog('Crop Black Bars v2 request has no render action yet; leaving streams unchanged.');
    });
    getRequests(requests, 'normalizeAudio').forEach(function () {
        args.jobLog('Normalize Audio v2 request has no render action yet; leaving streams unchanged.');
    });
};
var renderFfmpegCommandV2 = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var commandState, requests, streams, shouldProcess, container, overallInputArguments, overallOutputArguments, containerInputs, requestedContainer, currentContainer, fileContainer, reorderInputs, originalStreams, encoderInputs, bitrateInputs, filteredStreams, spawnArgs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
                commandState = args.variables.ffmpegCommandV2;
                if ((commandState === null || commandState === void 0 ? void 0 : commandState.sourceFileId) && commandState.sourceFileId !== args.inputFileObj._id) {
                    args.jobLog('FFmpeg command v2 input changed between Begin Command and Execute; rendering from current input file.');
                }
                requests = (commandState === null || commandState === void 0 ? void 0 : commandState.requests) || [];
                streams = createInitialWorkingStreams(args);
                shouldProcess = false;
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                overallInputArguments = [];
                overallOutputArguments = [];
                getRequests(requests, 'customArguments').forEach(function (request) {
                    var inputArguments = splitArgs(args, request.inputs.inputArguments);
                    var outputArguments = splitArgs(args, request.inputs.outputArguments);
                    if (inputArguments.length > 0) {
                        appendArgs(overallInputArguments, inputArguments);
                        shouldProcess = true;
                    }
                    if (outputArguments.length > 0) {
                        warnForCustomOutputConflicts(args, outputArguments);
                        appendArgs(overallOutputArguments, outputArguments);
                        shouldProcess = true;
                    }
                });
                getRequests(requests, 'removeDataStreams').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'data') {
                            shouldProcess = markRemoved(stream) || shouldProcess;
                        }
                    });
                });
                getRequests(requests, 'removeSubtitles').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'subtitle') {
                            shouldProcess = markRemoved(stream) || shouldProcess;
                        }
                    });
                });
                getRequests(requests, 'removeStreamByProperty').forEach(function (request) {
                    shouldProcess = applyRemoveStreamByProperty(args, streams, request.inputs) || shouldProcess;
                });
                logNoopRequests(args, requests);
                containerInputs = getLastRequestInputs(requests, 'setContainer');
                if (containerInputs) {
                    requestedContainer = String(containerInputs.container);
                    currentContainer = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                    container = requestedContainer;
                    if (currentContainer !== requestedContainer) {
                        shouldProcess = true;
                        if (containerInputs.forceConform === true) {
                            shouldProcess = applyContainerConform(streams, requestedContainer) || shouldProcess;
                        }
                        fileContainer = String(args.inputFileObj.container || '').toLowerCase();
                        if ([
                            'ts',
                            'avi',
                            'mpg',
                            'mpeg',
                        ].includes(fileContainer)) {
                            appendArgs(overallInputArguments, ['-fflags', '+genpts']);
                        }
                    }
                }
                getRequests(requests, 'ensureAudioStream').forEach(function (request) {
                    shouldProcess = applyEnsureAudioStream(args, streams, request.inputs) || shouldProcess;
                });
                reorderInputs = getLastRequestInputs(requests, 'reorderStreams');
                if (reorderInputs) {
                    originalStreams = JSON.stringify(streams);
                    streams = applyReorderStreams(streams, reorderInputs);
                    if (JSON.stringify(streams) !== originalStreams) {
                        shouldProcess = true;
                    }
                }
                encoderInputs = getLastRequestInputs(requests, 'setVideoEncoder');
                if (!encoderInputs) return [3 /*break*/, 2];
                return [4 /*yield*/, applyVideoEncoder({
                        args: args,
                        streams: streams,
                        inputs: encoderInputs,
                        overallInputArguments: overallInputArguments,
                    })];
            case 1:
                shouldProcess = (_a.sent()) || shouldProcess;
                _a.label = 2;
            case 2:
                shouldProcess = applyVideoFilters(args, streams, requests) || shouldProcess;
                bitrateInputs = getLastRequestInputs(requests, 'setVideoBitrate');
                if (bitrateInputs) {
                    shouldProcess = applyVideoBitrate(args, streams, bitrateInputs) || shouldProcess;
                }
                filteredStreams = streams.filter(function (stream) { return !stream.removed; });
                if (filteredStreams.length === 0) {
                    args.jobLog('No streams mapped for new file');
                    throw new Error('No streams mapped for new file');
                }
                spawnArgs = __spreadArray(__spreadArray([
                    '-y'
                ], overallInputArguments, true), [
                    '-i',
                    args.inputFileObj._id,
                ], false);
                filteredStreams.forEach(function (stream) {
                    var outputArgs = replaceOutputPlaceholders(stream.outputArgs, filteredStreams, stream);
                    spawnArgs.push('-map', "0:".concat(stream.sourceIndex));
                    if (shouldAddCopyCodec(outputArgs)) {
                        spawnArgs.push("-c:".concat(getOutputStreamIndex(filteredStreams, stream)), 'copy');
                    }
                    appendArgs(spawnArgs, outputArgs);
                });
                appendArgs(spawnArgs, overallOutputArguments);
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
