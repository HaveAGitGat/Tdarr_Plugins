"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Crop Black Bars',
    description: 'Automatically detect and crop black bars from video using ffmpeg cropdetect.'
        + ' Samples multiple points in the video to find consistent crop values.'
        + ' Only crops if black bars exceed the configured threshold.',
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
            label: 'Crop Threshold',
            name: 'cropThreshold',
            type: 'number',
            defaultValue: '24',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Threshold for cropdetect filter (0-255). Higher values detect less aggressively.'
                + ' Default is 24. Lower values may detect dark scenes as black bars.',
        },
        {
            label: 'Sample Count',
            name: 'sampleCount',
            type: 'number',
            defaultValue: '5',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Number of sample points to analyse across the video duration.'
                + ' More samples give more accurate detection but take longer. Default is 5.',
        },
        {
            label: 'Frames Per Sample',
            name: 'framesPerSample',
            type: 'number',
            defaultValue: '30',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Number of frames to analyse per sample point. Default is 30.',
        },
        {
            label: 'Minimum Crop Percentage',
            name: 'minCropPercent',
            type: 'number',
            defaultValue: '2',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Minimum percentage of the image that must be cropped for the crop to be applied.'
                + ' Prevents tiny crops that may be detection noise. Default is 2%.',
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
var getMostCommonCrop = function (crops) {
    if (crops.length === 0)
        return null;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var childProcess = require('child_process');
    var cropThreshold = Math.max(0, Math.min(255, Number(args.inputs.cropThreshold) || 24));
    var sampleCount = Math.max(1, Number(args.inputs.sampleCount) || 5);
    var framesPerSample = Math.max(1, Number(args.inputs.framesPerSample) || 30);
    var minCropPercent = Math.max(0, Number(args.inputs.minCropPercent) || 2);
    var filePath = args.inputFileObj._id;
    var duration = Number((_b = (_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.format) === null || _b === void 0 ? void 0 : _b.duration) || 0;
    if (duration <= 0) {
        args.jobLog('Cannot detect crop: video duration unknown');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    var videoWidth = 0;
    var videoHeight = 0;
    for (var i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        var stream = args.variables.ffmpegCommand.streams[i];
        if (stream.codec_type === 'video' && stream.width && stream.height) {
            videoWidth = stream.width;
            videoHeight = stream.height;
            break;
        }
    }
    if (videoWidth === 0 || videoHeight === 0) {
        args.jobLog('Cannot detect crop: video dimensions unknown');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    args.jobLog("Detecting black bars on ".concat(videoWidth, "x").concat(videoHeight, " video (duration: ").concat(duration, "s)"));
    var allCrops = [];
    for (var s = 0; s < sampleCount; s += 1) {
        // Sample evenly across the video, avoiding the first and last 10%
        var seekTime = Math.floor(duration * (0.1 + (0.8 * (s + 1)) / (sampleCount + 1)));
        try {
            var cmd = "\"".concat(args.ffmpegPath, "\" -ss ").concat(seekTime, " -i \"").concat(filePath, "\"")
                + " -frames:v ".concat(framesPerSample, " -vf cropdetect=").concat(cropThreshold, ":2:0 -f null - 2>&1");
            var output = childProcess.execSync(cmd, {
                timeout: 30000,
                windowsHide: true,
                encoding: 'utf8',
            });
            var crops = parseCropValues(output);
            allCrops.push.apply(allCrops, crops);
            args.jobLog("Sample ".concat(s + 1, "/").concat(sampleCount, " at ").concat(seekTime, "s: ").concat(crops.length, " crop values detected"));
        }
        catch (err) {
            args.jobLog("Sample ".concat(s + 1, "/").concat(sampleCount, " at ").concat(seekTime, "s failed: ").concat(err));
        }
    }
    if (allCrops.length === 0) {
        args.jobLog('No crop values detected');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    var crop = getMostCommonCrop(allCrops);
    if (!crop) {
        args.jobLog('Could not determine consistent crop values');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Check if the crop is significant enough
    var croppedPixels = (videoWidth * videoHeight) - (crop.w * crop.h);
    var cropPercent = (croppedPixels / (videoWidth * videoHeight)) * 100;
    if (crop.w >= videoWidth && crop.h >= videoHeight) {
        args.jobLog('No black bars detected, no cropping needed');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    if (cropPercent < minCropPercent) {
        args.jobLog("Crop too small (".concat(cropPercent.toFixed(1), "% < ").concat(minCropPercent, "% threshold), skipping"));
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    args.jobLog("Cropping from ".concat(videoWidth, "x").concat(videoHeight, " to ").concat(crop.w, "x").concat(crop.h)
        + " (removing ".concat(cropPercent.toFixed(1), "% of image)"));
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        if (stream.codec_type === 'video') {
            stream.outputArgs.push('-vf', "crop=".concat(crop.w, ":").concat(crop.h, ":").concat(crop.x, ":").concat(crop.y));
        }
    });
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
