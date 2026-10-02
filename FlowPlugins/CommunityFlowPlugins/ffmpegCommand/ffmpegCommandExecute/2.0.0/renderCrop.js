"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var renderUtils_1 = require("./renderUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
var getCropDetectionSettings = function (inputs) { return ({
    cropMode: String(inputs.cropMode || 'mostCommon'),
    cropThreshold: Math.max(0, Math.min(255, (0, renderUtils_1.parseNumberInput)(inputs.cropThreshold, 24))),
    sampleCount: Math.max(1, Math.floor((0, renderUtils_1.parseNumberInput)(inputs.sampleCount, 5))),
    framesPerSample: Math.max(1, Math.floor((0, renderUtils_1.parseNumberInput)(inputs.framesPerSample, 30))),
    minCropPercent: Math.max(0, (0, renderUtils_1.parseNumberInput)(inputs.minCropPercent, 2)),
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
exports.default = applyCropBlackBars;
