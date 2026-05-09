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
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRemoved = exports.getNestedProperty = exports.getVaapiDeviceArgs = exports.replaceOutputPlaceholders = exports.appendArgsOnce = exports.appendArgs = exports.shouldAddCopyCodec = exports.hasCodecOutputArg = exports.getOutputStreamIndex = exports.hasOperation = exports.resolveSingletonOperationInputs = exports.getOperations = exports.getAudioCodecName = exports.getStringInput = exports.parseNumberInput = exports.splitArgs = exports.createInitialWorkingStreams = exports.clone = void 0;
var renderTypes_1 = require("./renderTypes");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
exports.clone = clone;
var createInitialWorkingStreams = function (args) {
    try {
        var streams = (0, exports.clone)(args.inputFileObj.ffProbeData.streams);
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
exports.createInitialWorkingStreams = createInitialWorkingStreams;
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
exports.splitArgs = splitArgs;
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
exports.parseNumberInput = parseNumberInput;
var getStringInput = function (value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    var trimmedValue = String(value).trim();
    return trimmedValue === '' ? defaultValue : trimmedValue;
};
exports.getStringInput = getStringInput;
var getAudioCodecName = function (audioEncoder) {
    var codecNameByEncoder = {
        dca: 'dts',
        libmp3lame: 'mp3',
        libopus: 'opus',
    };
    return codecNameByEncoder[audioEncoder] || audioEncoder;
};
exports.getAudioCodecName = getAudioCodecName;
var getOperations = function (operations, operationType) { return operations.filter(function (operation) { return operation.operationType === operationType; }); };
exports.getOperations = getOperations;
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
    var matches = (0, exports.getOperations)(operations, operationType);
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
    renderTypes_1.singletonOperationTypes.forEach(function (operationType) {
        var inputs = getSingletonOperationInputs(args, operations, operationType);
        if (inputs) {
            resolvedInputs[operationType] = inputs;
        }
    });
    return resolvedInputs;
};
exports.resolveSingletonOperationInputs = resolveSingletonOperationInputs;
var hasOperation = function (operations, operationType) { return ((0, exports.getOperations)(operations, operationType).length > 0); };
exports.hasOperation = hasOperation;
var getOutputStreamIndex = function (streams, stream) {
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (streams[idx] === stream) {
            return idx;
        }
    }
    return -1;
};
exports.getOutputStreamIndex = getOutputStreamIndex;
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
exports.hasCodecOutputArg = hasCodecOutputArg;
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
    || (!(0, exports.hasCodecOutputArg)(outputArgs) && hasOnlyCopyCompatibleOutputArgs(outputArgs))); };
exports.shouldAddCopyCodec = shouldAddCopyCodec;
var appendArgs = function (target, argsToAppend) {
    argsToAppend.forEach(function (arg) {
        target.push(arg);
    });
};
exports.appendArgs = appendArgs;
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
    (0, exports.appendArgs)(target, argsToAppend);
};
exports.appendArgsOnce = appendArgsOnce;
var replaceOutputPlaceholders = function (outputArgs, streams, stream) { return outputArgs.map(function (arg) {
    var nextArg = arg;
    if (nextArg.includes('{outputIndex}')) {
        nextArg = nextArg.replace('{outputIndex}', String((0, exports.getOutputStreamIndex)(streams, stream)));
    }
    if (nextArg.includes('{outputTypeIndex}')) {
        nextArg = nextArg.replace('{outputTypeIndex}', String(getOutputStreamTypeIndex(streams, stream)));
    }
    return nextArg;
}); };
exports.replaceOutputPlaceholders = replaceOutputPlaceholders;
var getVaapiDeviceArgs = function (inputArgs) {
    var deviceArgIndex = inputArgs.indexOf('-hwaccel_device');
    if (deviceArgIndex === -1 || !inputArgs[deviceArgIndex + 1]) {
        return [];
    }
    return ['-vaapi_device', inputArgs[deviceArgIndex + 1]];
};
exports.getVaapiDeviceArgs = getVaapiDeviceArgs;
var getNestedProperty = function (stream, propertyToCheck) {
    var _a;
    if (propertyToCheck.includes('.')) {
        var parts = propertyToCheck.split('.');
        return (_a = stream[parts[0]]) === null || _a === void 0 ? void 0 : _a[parts[1]];
    }
    return stream[propertyToCheck];
};
exports.getNestedProperty = getNestedProperty;
var markRemoved = function (stream) {
    if (!stream.removed) {
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
        return true;
    }
    return false;
};
exports.markRemoved = markRemoved;
