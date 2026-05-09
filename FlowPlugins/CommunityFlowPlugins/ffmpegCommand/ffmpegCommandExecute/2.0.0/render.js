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
var singletonOperationTypes = [
    'setVideoEncoder',
    'setVideoResolution',
    'setVideoFramerate',
    'setVideoBitrate',
    'setContainer',
    'reorderStreams',
    'cropBlackBars',
    'normalizeAudio',
];
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
var parseNumberInput = function (value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : defaultValue;
    }
    if (typeof value !== 'string') {
        return defaultValue;
    }
    var trimmedValue = value.trim();
    if (trimmedValue === '') {
        return defaultValue;
    }
    var parsed = Number(trimmedValue);
    return Number.isFinite(parsed) ? parsed : defaultValue;
};
var getStringInput = function (value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    var trimmedValue = String(value).trim();
    return trimmedValue === '' ? defaultValue : trimmedValue;
};
var getAudioCodecName = function (audioEncoder) {
    var codecNameByEncoder = {
        dca: 'dts',
        libmp3lame: 'mp3',
        libopus: 'opus',
    };
    return codecNameByEncoder[audioEncoder] || audioEncoder;
};
var parseCropValues = function (output) {
    var results = [];
    var lines = output.split('\n');
    for (var i = 0; i < lines.length; i += 1) {
        var match = lines[i].match(/crop=(\d+):(\d+):(\d+):(\d+)/);
        if (match) {
            results.push({
                w: parseInt(match[1], 10),
                h: parseInt(match[2], 10),
                x: parseInt(match[3], 10),
                y: parseInt(match[4], 10),
            });
        }
    }
    return results;
};
var selectCrop = function (crops, mode) {
    if (crops.length === 0) {
        return null;
    }
    if (mode === 'minimum') {
        var result = crops[0];
        for (var i = 1; i < crops.length; i += 1) {
            if ((crops[i].w * crops[i].h) > (result.w * result.h)) {
                result = crops[i];
            }
        }
        return result;
    }
    if (mode === 'maximum') {
        var result = crops[0];
        for (var i = 1; i < crops.length; i += 1) {
            if ((crops[i].w * crops[i].h) < (result.w * result.h)) {
                result = crops[i];
            }
        }
        return result;
    }
    var counts = new Map();
    for (var i = 0; i < crops.length; i += 1) {
        var key = "".concat(crops[i].w, ":").concat(crops[i].h, ":").concat(crops[i].x, ":").concat(crops[i].y);
        var existing = counts.get(key);
        if (existing) {
            existing.count += 1;
        }
        else {
            counts.set(key, { count: 1, crop: crops[i] });
        }
    }
    var bestCount = 0;
    var bestCrop = null;
    counts.forEach(function (entry) {
        if (entry.count > bestCount) {
            bestCount = entry.count;
            bestCrop = entry.crop;
        }
    });
    return bestCrop;
};
var getOperations = function (operations, operationType) { return operations.filter(function (operation) { return operation.operationType === operationType; }); };
var stableStringify = function (value) {
    if (Array.isArray(value)) {
        return "[".concat(value.map(function (row) { return stableStringify(row); }).join(','), "]");
    }
    if (value && typeof value === 'object') {
        var record_1 = value;
        var keys = Object.keys(record_1).sort();
        return "{".concat(keys.map(function (key) { return "".concat(JSON.stringify(key), ":").concat(stableStringify(record_1[key])); }).join(','), "}");
    }
    var primitiveValue = JSON.stringify(value);
    return primitiveValue === undefined ? String(value) : primitiveValue;
};
var getSingletonOperationInputs = function (args, operations, operationType) {
    var matches = getOperations(operations, operationType);
    if (matches.length === 0) {
        return undefined;
    }
    var firstInputs = matches[0].inputs || {};
    var firstInputsKey = stableStringify(firstInputs);
    var hasConflict = matches.some(function (operation) { return stableStringify(operation.inputs || {}) !== firstInputsKey; });
    if (hasConflict) {
        var message = "Conflicting FFmpeg command v2 ".concat(operationType, " operations found.")
            + " Use one ".concat(operationType, " operation.");
        args.jobLog(message);
        throw new Error(message);
    }
    return firstInputs;
};
var resolveSingletonOperationInputs = function (args, operations) {
    var resolvedInputs = {};
    singletonOperationTypes.forEach(function (operationType) {
        var inputs = getSingletonOperationInputs(args, operations, operationType);
        if (inputs) {
            resolvedInputs[operationType] = inputs;
        }
    });
    return resolvedInputs;
};
var hasOperation = function (operations, operationType) { return (getOperations(operations, operationType).length > 0); };
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
var getVaapiDeviceArgs = function (inputArgs) {
    var deviceArgIndex = inputArgs.indexOf('-hwaccel_device');
    if (deviceArgIndex === -1 || !inputArgs[deviceArgIndex + 1]) {
        return [];
    }
    return ['-vaapi_device', inputArgs[deviceArgIndex + 1]];
};
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
var getFixedResolutionDimensions = function (targetResolution) {
    switch (targetResolution) {
        case '480p':
            return { width: 720, height: 480 };
        case '576p':
            return { width: 720, height: 576 };
        case '720p':
            return { width: 1280, height: 720 };
        case '1080p':
            return { width: 1920, height: 1080 };
        case '1440p':
            return { width: 2560, height: 1440 };
        case '4KUHD':
            return { width: 3840, height: 2160 };
        default:
            return { width: 1920, height: 1080 };
    }
};
// Keep in sync with Tdarr's default scanner resolution boundaries.
var defaultResolutionBoundaries = [
    {
        resolution: '480p', widthMin: 100, widthMax: 792, heightMin: 100, heightMax: 528,
    },
    {
        resolution: '576p', widthMin: 100, widthMax: 792, heightMin: 100, heightMax: 634,
    },
    {
        resolution: '720p', widthMin: 100, widthMax: 1408, heightMin: 100, heightMax: 792,
    },
    {
        resolution: '1080p', widthMin: 100, widthMax: 2112, heightMin: 100, heightMax: 1188,
    },
    {
        resolution: '1440p', widthMin: 100, widthMax: 2816, heightMin: 100, heightMax: 1584,
    },
    {
        resolution: '4KUHD', widthMin: 100, widthMax: 4224, heightMin: 100, heightMax: 2376,
    },
    {
        resolution: 'DCI4K', widthMin: 100, widthMax: 4506, heightMin: 100, heightMax: 2376,
    },
    {
        resolution: '8KUHD', widthMin: 100, widthMax: 8448, heightMin: 100, heightMax: 4752,
    },
];
var getStreamResolution = function (stream) {
    var widthIn = Number(stream.width);
    var heightIn = Number(stream.height);
    if (!widthIn || !heightIn || Number.isNaN(widthIn) || Number.isNaN(heightIn)) {
        return undefined;
    }
    var width = widthIn;
    var height = heightIn;
    if (height > width) {
        width = heightIn;
        height = widthIn;
    }
    var boundary = defaultResolutionBoundaries.find(function (row) { return (width >= row.widthMin
        && width <= row.widthMax
        && height >= row.heightMin
        && height <= row.heightMax); });
    if (boundary) {
        return boundary.resolution;
    }
    return 'Other';
};
var shouldScaleVideoStream = function (args, stream, resolutionInputs) {
    if (!resolutionInputs) {
        return false;
    }
    var targetResolution = String(resolutionInputs.targetResolution);
    var streamResolution = getStreamResolution(stream);
    if (streamResolution) {
        return streamResolution !== targetResolution;
    }
    return targetResolution !== args.inputFileObj.video_resolution;
};
var getQsvScaleFilter = function (targetResolution, format) {
    var formatSuffix = format ? ":format=".concat(format) : '';
    var _a = getFixedResolutionDimensions(targetResolution), width = _a.width, height = _a.height;
    return "vpp_qsv=w=".concat(width, ":h=").concat(height).concat(formatSuffix);
};
var getVaapiScaleFilter = function (targetResolution, format) {
    var scaleArgs = [];
    if (targetResolution) {
        var _a = getFixedResolutionDimensions(targetResolution), width = _a.width, height = _a.height;
        scaleArgs.push("w=".concat(width), "h=".concat(height));
    }
    if (format) {
        scaleArgs.push("format=".concat(format));
    }
    return scaleArgs.length > 0 ? "scale_vaapi=".concat(scaleArgs.join(':')) : 'scale_vaapi';
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
    var audioCodec = getAudioCodecName(audioEncoder);
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
        var streamsWithLangTag = streams.filter(function (stream) { return (stream.codec_type === 'audio'
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
            hasStreamAlready.forEach(function (stream) {
                // Preserve the codec selected by Ensure Audio Stream if a later filter needs to re-encode.
                // eslint-disable-next-line no-param-reassign
                stream.normalizeAudioEncoder = audioEncoder;
            });
            args.jobLog("File already has ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
            return {
                handled: true,
                changed: false,
            };
        }
        args.jobLog("Adding ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        var streamCopy = __assign(__assign({}, clone(streamWithHighestChannel)), { removed: false, index: streams.length, sourceIndex: streamWithHighestChannel.sourceIndex, codec_name: audioCodec, channels: targetChannels, outputArgs: [
                '-c:{outputIndex}',
                audioEncoder,
                '-ac:a:{outputTypeIndex}',
                "".concat(targetChannels),
            ] });
        if (enableBitrate) {
            var ffType = (0, fileUtils_1.getFfType)(streamCopy.codec_type);
            streamCopy.outputArgs.push("-b:".concat(ffType, ":{outputTypeIndex}"), "".concat(bitrate));
        }
        if (enableSamplerate) {
            streamCopy.outputArgs.push('-ar:a:{outputTypeIndex}', "".concat(samplerate));
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
var getNormalizeAudioSettings = function (inputs) { return ({
    i: getStringInput(inputs.i, '-23.0'),
    lra: getStringInput(inputs.lra, '7.0'),
    tp: getStringInput(inputs.tp, '-2.0'),
    maxGain: parseNumberInput(inputs.maxGain, 15),
}); };
var getNullOutputPath = function (args) { return (String(args.platform || process.platform) === 'win32' ? 'NUL' : '/dev/null'); };
var getLoudnormFirstPassFilter = function (settings) { return ("loudnorm=I=".concat(settings.i, ":LRA=").concat(settings.lra, ":TP=").concat(settings.tp, ":print_format=json")); };
var getLoudnormSecondPassFilter = function (settings, values) { return ("loudnorm=print_format=summary:linear=true:I=".concat(settings.i, ":LRA=").concat(settings.lra, ":TP=").concat(settings.tp, ":")
    + "measured_i=".concat(values.input_i, ":")
    + "measured_lra=".concat(values.input_lra, ":")
    + "measured_tp=".concat(values.input_tp, ":")
    + "measured_thresh=".concat(values.input_thresh, ":offset=").concat(values.target_offset)); };
var parseLoudnormValues = function (output) {
    var loudnormIdx = output.lastIndexOf('Parsed_loudnorm');
    if (loudnormIdx === -1) {
        throw new Error('Failed to find loudnorm in report, please rerun');
    }
    var fullTail = output.slice(loudnormIdx);
    var targetOffsetIdx = fullTail.lastIndexOf('target_offset');
    if (targetOffsetIdx === -1) {
        throw new Error('Failed to find target_offset in loudnorm output, please rerun');
    }
    var closingBraceIdx = fullTail.indexOf('}', targetOffsetIdx);
    if (closingBraceIdx === -1) {
        throw new Error('Failed to find closing brace in loudnorm output, please rerun');
    }
    var openingBraceIdx = fullTail.lastIndexOf('{', targetOffsetIdx);
    if (openingBraceIdx === -1) {
        throw new Error('Failed to find opening brace in loudnorm output, please rerun');
    }
    var parsedValues = JSON.parse(fullTail.slice(openingBraceIdx, closingBraceIdx + 1));
    var getRequiredValue = function (key) {
        var value = parsedValues[key];
        if (value === undefined || value === null || String(value).trim() === '') {
            throw new Error("Failed to find ".concat(key, " in loudnorm output, please rerun"));
        }
        return String(value);
    };
    return {
        input_i: getRequiredValue('input_i'),
        input_tp: getRequiredValue('input_tp'),
        input_lra: getRequiredValue('input_lra'),
        input_thresh: getRequiredValue('input_thresh'),
        target_offset: getRequiredValue('target_offset'),
    };
};
var detectLoudnormValues = function (args, stream, settings) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var childProcess = require('child_process');
    var ffmpegArgs = [
        '-i',
        args.inputFileObj._id,
        '-map',
        "0:".concat(stream.sourceIndex),
        '-af',
        getLoudnormFirstPassFilter(settings),
        '-f',
        'null',
        getNullOutputPath(args),
    ];
    var result = childProcess.spawnSync(args.ffmpegPath, ffmpegArgs, {
        windowsHide: true,
        encoding: 'utf8',
        shell: false,
        maxBuffer: 50 * 1024 * 1024,
    });
    if (result.error) {
        args.jobLog('Running FFmpeg failed');
        throw result.error;
    }
    if (result.status !== 0) {
        args.jobLog('Running FFmpeg failed');
        throw new Error('FFmpeg failed');
    }
    var loudnormValues = parseLoudnormValues("".concat(result.stdout || '').concat(result.stderr || ''));
    args.jobLog("Loudnorm first pass values returned for stream ".concat(stream.sourceIndex, ":  \n").concat(JSON.stringify(loudnormValues)));
    return loudnormValues;
};
var getLoudnormValuesIfGainAllowed = function (args, stream, settings) {
    var loudnormValues = detectLoudnormValues(args, stream, settings);
    var gainNeeded = parseFloat(settings.i) - parseFloat(loudnormValues.input_i);
    args.jobLog("Gain required for stream ".concat(stream.sourceIndex, ": ")
        + "".concat(gainNeeded.toFixed(2), " LU (max allowed: ").concat(settings.maxGain, " LU)"));
    if (gainNeeded > settings.maxGain) {
        args.jobLog("Skipping normalization for stream ".concat(stream.sourceIndex, ": required gain of ")
            + "".concat(gainNeeded.toFixed(2), " LU exceeds max allowed gain of ").concat(settings.maxGain, " LU.")
            + ' File may be mostly quiet or noise.');
        return null;
    }
    return loudnormValues;
};
var appendNormalizeAudioOutputArgs = function (stream, settings, loudnormValues) {
    if (!hasCodecOutputArg(stream.outputArgs)) {
        var audioEncoder = stream.normalizeAudioEncoder || 'aac';
        stream.outputArgs.push('-c:{outputIndex}', audioEncoder);
        if (audioEncoder === 'aac') {
            stream.outputArgs.push('-b:a:{outputTypeIndex}', '192k');
        }
    }
    stream.outputArgs.push('-filter:a:{outputTypeIndex}', getLoudnormSecondPassFilter(settings, loudnormValues));
};
var applyNormalizeAudio = function (args, streams, inputs) {
    var settings = getNormalizeAudioSettings(inputs);
    var audioStreams = streams.filter(function (stream) { return !stream.removed && stream.codec_type === 'audio'; });
    var valuesBySourceIndex = new Map();
    var shouldProcess = false;
    if (audioStreams.length === 0) {
        args.jobLog('No audio streams found for Normalize Audio; skipping.');
        return false;
    }
    for (var i = 0; i < audioStreams.length; i += 1) {
        var stream = audioStreams[i];
        var sourceIndex = Number(stream.sourceIndex);
        var loudnormValues = valuesBySourceIndex.get(sourceIndex);
        if (!valuesBySourceIndex.has(sourceIndex)) {
            loudnormValues = getLoudnormValuesIfGainAllowed(args, stream, settings);
            valuesBySourceIndex.set(sourceIndex, loudnormValues);
        }
        if (loudnormValues) {
            appendNormalizeAudioOutputArgs(stream, settings, loudnormValues);
            shouldProcess = true;
        }
    }
    return shouldProcess;
};
var getCropDetectionSettings = function (inputs) { return ({
    cropMode: String(inputs.cropMode || 'mostCommon'),
    cropThreshold: Math.max(0, Math.min(255, parseNumberInput(inputs.cropThreshold, 24))),
    sampleCount: Math.max(1, Math.floor(parseNumberInput(inputs.sampleCount, 5))),
    framesPerSample: Math.max(1, Math.floor(parseNumberInput(inputs.framesPerSample, 30))),
    minCropPercent: Math.max(0, parseNumberInput(inputs.minCropPercent, 2)),
}); };
var getCropTargetStream = function (streams) {
    for (var i = 0; i < streams.length; i += 1) {
        var stream = streams[i];
        var width = Number(stream.width);
        var height = Number(stream.height);
        if (!stream.removed && stream.codec_type === 'video' && width > 0 && height > 0) {
            return {
                stream: stream,
                width: width,
                height: height,
            };
        }
    }
    return null;
};
var getCropPercent = function (target, crop) {
    var originalPixels = target.width * target.height;
    var croppedPixels = originalPixels - (crop.w * crop.h);
    return (croppedPixels / originalPixels) * 100;
};
var detectCropValues = function (args, target, settings, duration) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var childProcess = require('child_process');
    var allCrops = [];
    for (var s = 0; s < settings.sampleCount; s += 1) {
        var seekTime = Math.floor(duration * (0.1 + (0.8 * (s + 1)) / (settings.sampleCount + 1)));
        try {
            var ffmpegArgs = [
                '-ss',
                String(seekTime),
                '-i',
                args.inputFileObj._id,
                '-map',
                "0:".concat(target.stream.sourceIndex),
                '-frames:v',
                String(settings.framesPerSample),
                '-vf',
                "cropdetect=".concat(settings.cropThreshold, ":2:0"),
                '-f',
                'null',
                '-',
            ];
            var result = childProcess.spawnSync(args.ffmpegPath, ffmpegArgs, {
                timeout: 30000,
                windowsHide: true,
                encoding: 'utf8',
                shell: false,
            });
            if (result.error) {
                throw result.error;
            }
            if (result.status !== 0) {
                throw new Error("ffmpeg exited with status ".concat(result.status));
            }
            var output = "".concat(result.stdout || '').concat(result.stderr || '');
            var crops = parseCropValues(output);
            allCrops.push.apply(allCrops, crops);
            args.jobLog("Sample ".concat(s + 1, "/").concat(settings.sampleCount, " at ").concat(seekTime, "s: ").concat(crops.length, " crop values detected"));
        }
        catch (err) {
            args.jobLog("Sample ".concat(s + 1, "/").concat(settings.sampleCount, " at ").concat(seekTime, "s failed: ").concat(err));
        }
    }
    return allCrops;
};
var applyCropBlackBars = function (args, streams, inputs) {
    var _a, _b;
    var settings = getCropDetectionSettings(inputs);
    var duration = Number((_b = (_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.format) === null || _b === void 0 ? void 0 : _b.duration) || 0;
    if (duration <= 0) {
        args.jobLog('Cannot detect crop: video duration unknown');
        return false;
    }
    var cropTarget = getCropTargetStream(streams);
    if (!cropTarget) {
        args.jobLog('Cannot detect crop: video dimensions unknown');
        return false;
    }
    args.jobLog("Detecting black bars on stream ".concat(cropTarget.stream.sourceIndex, " ")
        + "(".concat(cropTarget.width, "x").concat(cropTarget.height, ", duration: ").concat(duration, "s)"));
    var allCrops = detectCropValues(args, cropTarget, settings, duration);
    if (allCrops.length === 0) {
        args.jobLog('No crop values detected');
        return false;
    }
    var crop = selectCrop(allCrops, settings.cropMode);
    if (!crop) {
        args.jobLog('Could not determine consistent crop values');
        return false;
    }
    var cropPercent = getCropPercent(cropTarget, crop);
    if (crop.w >= cropTarget.width && crop.h >= cropTarget.height) {
        args.jobLog('No black bars detected, no cropping needed');
        return false;
    }
    if (cropPercent < settings.minCropPercent) {
        args.jobLog("Crop too small (".concat(cropPercent.toFixed(1), "% < ").concat(settings.minCropPercent, "% threshold), skipping"));
        return false;
    }
    args.jobLog("Cropping stream ".concat(cropTarget.stream.sourceIndex, " from ").concat(cropTarget.width, "x").concat(cropTarget.height)
        + " to ".concat(crop.w, "x").concat(crop.h)
        + " (removing ".concat(cropPercent.toFixed(1), "% of image)"));
    // cropdetect measures the source frame, so this is prepended before scale/HDR/framerate filters later.
    cropTarget.stream.cropFilter = "crop=".concat(crop.w, ":").concat(crop.h, ":").concat(crop.x, ":").concat(crop.y);
    return true;
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
                has10BitOperation = hasOperation(operations, 'set10BitVideo');
                hasHdrToSdrOperation = hasOperation(operations, 'hdrToSdr');
                videoStreams = streams.filter(function (stream) { return (!stream.removed
                    && stream.codec_type === 'video'
                    && stream.codec_name !== 'mjpeg'); });
                i = 0;
                _c.label = 1;
            case 1:
                if (!(i < videoStreams.length)) return [3 /*break*/, 5];
                stream = videoStreams[i];
                videoOperationRequiresEncoding = (shouldScaleVideoStream(args, stream, resolutionInputs)
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
                    appendArgsOnce(overallInputArguments, getVaapiDeviceArgs(encoderProperties.inputArgs));
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
var applyVideoFilters = function (args, streams, operations, singletonInputs) {
    var resolutionInputs = singletonInputs.setVideoResolution;
    var frameRateInputs = singletonInputs.setVideoFramerate;
    var has10BitOperation = hasOperation(operations, 'set10BitVideo');
    var hasHdrToSdrOperation = hasOperation(operations, 'hdrToSdr');
    var shouldProcess = false;
    streams.forEach(function (stream) {
        var _a, _b;
        if (stream.removed || stream.codec_type !== 'video') {
            return;
        }
        var filterChain = [];
        var encoderName = ((_a = stream.encoder) === null || _a === void 0 ? void 0 : _a.encoder) || '';
        var usesQsv = encoderName.includes('qsv');
        var usesVaapi = encoderName.includes('vaapi');
        var hardwareDecoding = stream.hardwareDecoding === true;
        var hardwareDecodedQsv = usesQsv && hardwareDecoding;
        var hardwareDecodedVaapi = usesVaapi && hardwareDecoding;
        var hasCropFilter = Boolean(stream.cropFilter);
        var needsSoftwareOnlyFilter = hasCropFilter || hasHdrToSdrOperation || Boolean(frameRateInputs);
        var shouldScale = shouldScaleVideoStream(args, stream, resolutionInputs);
        var targetResolution = resolutionInputs ? String(resolutionInputs.targetResolution) : '';
        if (usesQsv
            && hardwareDecodedQsv
            && shouldScale
            && !hasCropFilter
            && !hasHdrToSdrOperation
            && !frameRateInputs) {
            filterChain.push(getQsvScaleFilter(targetResolution, has10BitOperation ? 'p010le' : undefined));
        }
        else if (usesQsv
            && hardwareDecodedQsv
            && has10BitOperation
            && !shouldScale
            && !hasCropFilter
            && !hasHdrToSdrOperation
            && !frameRateInputs) {
            filterChain.push('scale_qsv=format=p010le');
        }
        else if (usesVaapi) {
            var vaapiFormat = has10BitOperation ? 'p010' : undefined;
            if (!needsSoftwareOnlyFilter && (shouldScale || has10BitOperation)) {
                if (!hardwareDecodedVaapi) {
                    filterChain.push('format=nv12', 'hwupload');
                }
                filterChain.push(getVaapiScaleFilter(shouldScale ? targetResolution : undefined, vaapiFormat));
            }
            else {
                if (hardwareDecodedVaapi && needsSoftwareOnlyFilter) {
                    filterChain.push('hwdownload', 'format=nv12');
                }
                if (stream.cropFilter) {
                    filterChain.push(stream.cropFilter);
                }
                if (hasHdrToSdrOperation) {
                    filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
                }
                if (shouldScale && resolutionInputs) {
                    filterChain.push(getSoftwareScaleFilter(targetResolution));
                }
                if (frameRateInputs) {
                    filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
                }
                if (!hardwareDecodedVaapi || filterChain.length > 0) {
                    filterChain.push("format=".concat(has10BitOperation ? 'p010' : 'nv12'), 'hwupload');
                }
            }
        }
        else {
            if (usesQsv && hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale)) {
                filterChain.push('hwdownload', 'format=nv12');
            }
            if (stream.cropFilter) {
                filterChain.push(stream.cropFilter);
            }
            if (hasHdrToSdrOperation) {
                filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
            }
            if (shouldScale && resolutionInputs) {
                filterChain.push(getSoftwareScaleFilter(targetResolution));
            }
            if (frameRateInputs) {
                filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
            }
            if (usesQsv && has10BitOperation) {
                filterChain.push('format=p010le');
            }
            if (usesQsv && hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale)) {
                filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
            }
            else if (usesQsv && has10BitOperation && filterChain.length === 0) {
                filterChain.push('scale_qsv=format=p010le');
            }
        }
        if (filterChain.length > 0) {
            stream.outputArgs.push('-filter:v:{outputTypeIndex}', filterChain.join(','));
            shouldProcess = true;
        }
        if (has10BitOperation) {
            var isLibsvtav1 = ((_b = stream.encoder) === null || _b === void 0 ? void 0 : _b.encoder) === 'libsvtav1'
                || stream.outputArgs.some(function (row) { return String(row).includes('libsvtav1'); });
            if (!isLibsvtav1) {
                stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
            }
            if (usesQsv && hardwareDecodedQsv) {
                if (filterChain.length === 0) {
                    stream.outputArgs.push('-filter:v:{outputTypeIndex}', 'scale_qsv=format=p010le');
                }
            }
            else if (usesVaapi) {
                // VAAPI bit depth is handled inside the upload/scale_vaapi filter chain.
            }
            else if (isLibsvtav1) {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'yuv420p10le');
            }
            else {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
            }
            shouldProcess = true;
        }
        if (hasHdrToSdrOperation) {
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
        '-af',
        '-filter',
        '-filter:v',
        '-filter:a',
        '-c',
        '-codec',
        '-map',
    ];
    var hasConflict = outputArguments.some(function (arg) { return conflictArgs.some(function (conflictArg) { return (arg === conflictArg || arg.startsWith("".concat(conflictArg, ":"))); }); });
    if (hasConflict) {
        args.jobLog('Custom FFmpeg output arguments include command-shaping options that may conflict with v2 rendering.');
    }
};
var renderFfmpegCommandV2 = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var commandState, operations, singletonInputs, streams, shouldProcess, container, overallInputArguments, overallOutputArguments, cropBlackBarsInputs, containerInputs, targetContainer, currentContainer, fileContainer, reorderInputs, originalStreams, normalizeAudioInputs, encoderInputs, bitrateInputs, filteredStreams, spawnArgs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
                commandState = args.variables.ffmpegCommandV2;
                if ((commandState === null || commandState === void 0 ? void 0 : commandState.sourceFileId) && commandState.sourceFileId !== args.inputFileObj._id) {
                    args.jobLog('FFmpeg command v2 input changed between Begin Command and Execute; rendering from current input file.');
                }
                operations = (commandState === null || commandState === void 0 ? void 0 : commandState.operations) || [];
                singletonInputs = resolveSingletonOperationInputs(args, operations);
                streams = createInitialWorkingStreams(args);
                shouldProcess = false;
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                overallInputArguments = [];
                overallOutputArguments = [];
                getOperations(operations, 'customArguments').forEach(function (operation) {
                    var inputArguments = splitArgs(args, operation.inputs.inputArguments);
                    var outputArguments = splitArgs(args, operation.inputs.outputArguments);
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
                getOperations(operations, 'removeDataStreams').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'data') {
                            shouldProcess = markRemoved(stream) || shouldProcess;
                        }
                    });
                });
                getOperations(operations, 'removeSubtitles').forEach(function () {
                    streams.forEach(function (stream) {
                        if (stream.codec_type === 'subtitle') {
                            shouldProcess = markRemoved(stream) || shouldProcess;
                        }
                    });
                });
                getOperations(operations, 'removeStreamByProperty').forEach(function (operation) {
                    shouldProcess = applyRemoveStreamByProperty(args, streams, operation.inputs) || shouldProcess;
                });
                cropBlackBarsInputs = singletonInputs.cropBlackBars;
                if (cropBlackBarsInputs) {
                    shouldProcess = applyCropBlackBars(args, streams, cropBlackBarsInputs) || shouldProcess;
                }
                containerInputs = singletonInputs.setContainer;
                if (containerInputs) {
                    targetContainer = String(containerInputs.container);
                    currentContainer = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                    container = targetContainer;
                    if (currentContainer !== targetContainer) {
                        shouldProcess = true;
                        if (containerInputs.forceConform === true) {
                            shouldProcess = applyContainerConform(streams, targetContainer) || shouldProcess;
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
                getOperations(operations, 'ensureAudioStream').forEach(function (operation) {
                    shouldProcess = applyEnsureAudioStream(args, streams, operation.inputs) || shouldProcess;
                });
                reorderInputs = singletonInputs.reorderStreams;
                if (reorderInputs) {
                    originalStreams = JSON.stringify(streams);
                    streams = applyReorderStreams(streams, reorderInputs);
                    if (JSON.stringify(streams) !== originalStreams) {
                        shouldProcess = true;
                    }
                }
                normalizeAudioInputs = singletonInputs.normalizeAudio;
                if (normalizeAudioInputs) {
                    shouldProcess = applyNormalizeAudio(args, streams, normalizeAudioInputs) || shouldProcess;
                }
                encoderInputs = singletonInputs.setVideoEncoder;
                if (!encoderInputs) return [3 /*break*/, 2];
                return [4 /*yield*/, applyVideoEncoder({
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
                shouldProcess = applyVideoFilters(args, streams, operations, singletonInputs) || shouldProcess;
                bitrateInputs = singletonInputs.setVideoBitrate;
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
