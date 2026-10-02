"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoImplicitEncoder = exports.assertAudioEncoderConfiguredForNormalize = exports.hasConfiguredAudioEncoder = exports.warnForCustomOutputConflicts = void 0;
var renderUtils_1 = require("./renderUtils");
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
exports.warnForCustomOutputConflicts = warnForCustomOutputConflicts;
var getExplicitEncoderGuidance = function (codecType) {
    if (codecType === 'video') {
        return 'Add Set Video Encoder when using video operations that require encoding.';
    }
    if (codecType === 'audio') {
        return 'Add Set Audio Encoder before audio operations that require encoding.';
    }
    return 'Add an explicit encoder before operations that require encoding.';
};
var getImplicitEncoderMessage = function (stream) {
    var codecType = String(stream.codec_type || 'unknown');
    return "FFmpeg command v2 ".concat(codecType, " stream ").concat(stream.sourceIndex, " requires encoding")
        + " but does not have an explicit encoder. ".concat(getExplicitEncoderGuidance(codecType));
};
var throwImplicitEncoderError = function (args, stream) {
    var message = getImplicitEncoderMessage(stream);
    args.jobLog(message);
    throw new Error(message);
};
var hasConfiguredAudioEncoder = function (audioEncoderInputs) { return (audioEncoderInputs !== undefined
    && (0, renderUtils_1.getStringInput)(audioEncoderInputs.audioEncoder, '') !== ''); };
exports.hasConfiguredAudioEncoder = hasConfiguredAudioEncoder;
var assertAudioEncoderConfiguredForNormalize = function (args, streams, audioEncoderInputs) {
    if ((0, exports.hasConfiguredAudioEncoder)(audioEncoderInputs)) {
        return;
    }
    var audioStream = streams.find(function (stream) { return (!stream.removed
        && stream.codec_type === 'audio'
        && !(0, renderUtils_1.hasCodecOutputArg)(stream.outputArgs)); });
    if (audioStream) {
        throwImplicitEncoderError(args, audioStream);
    }
};
exports.assertAudioEncoderConfiguredForNormalize = assertAudioEncoderConfiguredForNormalize;
var assertNoImplicitEncoder = function (args, streams) {
    streams.forEach(function (stream) {
        if ((0, renderUtils_1.shouldAddCopyCodec)(stream.outputArgs) || (0, renderUtils_1.hasCodecOutputArg)(stream.outputArgs)) {
            return;
        }
        throwImplicitEncoderError(args, stream);
    });
};
exports.assertNoImplicitEncoder = assertNoImplicitEncoder;
