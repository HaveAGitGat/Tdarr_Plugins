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
exports.applyAudioEncoder = exports.applyNormalizeAudio = exports.applyEnsureAudioStream = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var renderUtils_1 = require("./renderUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var applyEnsureAudioStream = function (args, streams, inputs) {
    var audioEncoder = String(inputs.audioEncoder);
    var langTag = String(inputs.language).toLowerCase();
    var wantedChannelCount = Number(inputs.channels);
    var enableBitrate = inputs.enableBitrate === true;
    var bitrate = String(inputs.bitrate);
    var enableSamplerate = inputs.enableSamplerate === true;
    var samplerate = String(inputs.samplerate);
    var audioCodec = (0, renderUtils_1.getAudioCodecName)(audioEncoder);
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
            args.jobLog("File already has ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
            return {
                handled: true,
                changed: false,
            };
        }
        args.jobLog("Adding ".concat(targetLangTag, " stream in ").concat(audioEncoder, ", ").concat(targetChannels, " channels \n"));
        var streamCopy = __assign(__assign({}, (0, renderUtils_1.clone)(streamWithHighestChannel)), { removed: false, index: streams.length, sourceIndex: streamWithHighestChannel.sourceIndex, codec_name: audioCodec, channels: targetChannels, outputArgs: [
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
exports.applyEnsureAudioStream = applyEnsureAudioStream;
var getNormalizeAudioSettings = function (inputs) { return ({
    i: (0, renderUtils_1.getStringInput)(inputs.i, '-23.0'),
    lra: (0, renderUtils_1.getStringInput)(inputs.lra, '7.0'),
    tp: (0, renderUtils_1.getStringInput)(inputs.tp, '-2.0'),
    maxGain: (0, renderUtils_1.parseNumberInput)(inputs.maxGain, 15),
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
exports.applyNormalizeAudio = applyNormalizeAudio;
var applyAudioEncoder = function (streams, inputs) {
    var audioEncoder = (0, renderUtils_1.getStringInput)(inputs.audioEncoder, '');
    if (audioEncoder === '') {
        return false;
    }
    var audioCodec = (0, renderUtils_1.getAudioCodecName)(audioEncoder);
    var forceEncoding = inputs.forceEncoding === true;
    var enableBitrate = inputs.enableBitrate === true;
    var bitrate = String(inputs.bitrate);
    var enableSamplerate = inputs.enableSamplerate === true;
    var samplerate = String(inputs.samplerate);
    var shouldProcess = false;
    streams.forEach(function (stream) {
        var _a;
        if (stream.removed || stream.codec_type !== 'audio' || (0, renderUtils_1.hasCodecOutputArg)(stream.outputArgs)) {
            return;
        }
        var streamRequiresExplicitEncoder = !(0, renderUtils_1.shouldAddCopyCodec)(stream.outputArgs);
        if (forceEncoding
            || stream.codec_name !== audioCodec
            || streamRequiresExplicitEncoder
            || enableBitrate
            || enableSamplerate) {
            var outputArgs = [
                '-c:{outputIndex}',
                audioEncoder,
            ];
            if (enableBitrate) {
                outputArgs.push('-b:a:{outputTypeIndex}', "".concat(bitrate));
            }
            if (enableSamplerate) {
                outputArgs.push('-ar:a:{outputTypeIndex}', "".concat(samplerate));
            }
            (_a = stream.outputArgs).unshift.apply(_a, outputArgs);
            shouldProcess = true;
        }
    });
    return shouldProcess;
};
exports.applyAudioEncoder = applyAudioEncoder;
