"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyVideoFilters = exports.shouldScaleVideoStream = void 0;
var renderUtils_1 = require("./renderUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
exports.shouldScaleVideoStream = shouldScaleVideoStream;
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
var appendSoftwareVideoFilters = function (_a) {
    var args = _a.args, stream = _a.stream, filterChain = _a.filterChain, hasHdrToSdrOperation = _a.hasHdrToSdrOperation, shouldScale = _a.shouldScale, resolutionInputs = _a.resolutionInputs, targetResolution = _a.targetResolution, frameRateInputs = _a.frameRateInputs;
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
};
var applyVideoFilters = function (args, streams, operations, singletonInputs) {
    var resolutionInputs = singletonInputs.setVideoResolution;
    var frameRateInputs = singletonInputs.setVideoFramerate;
    var has10BitOperation = (0, renderUtils_1.hasOperation)(operations, 'set10BitVideo');
    var hasHdrToSdrOperation = (0, renderUtils_1.hasOperation)(operations, 'hdrToSdr');
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
        var shouldScale = (0, exports.shouldScaleVideoStream)(args, stream, resolutionInputs);
        var targetResolution = resolutionInputs ? String(resolutionInputs.targetResolution) : '';
        var qsvNeedsSoftwareRoundTrip = hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale);
        if (hardwareDecodedQsv
            && shouldScale
            && !hasCropFilter
            && !hasHdrToSdrOperation
            && !frameRateInputs) {
            filterChain.push(getQsvScaleFilter(targetResolution, has10BitOperation ? 'p010le' : undefined));
        }
        else if (hardwareDecodedQsv
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
                appendSoftwareVideoFilters({
                    args: args,
                    stream: stream,
                    filterChain: filterChain,
                    hasHdrToSdrOperation: hasHdrToSdrOperation,
                    shouldScale: shouldScale,
                    resolutionInputs: resolutionInputs,
                    targetResolution: targetResolution,
                    frameRateInputs: frameRateInputs,
                });
                if (!hardwareDecodedVaapi || filterChain.length > 0) {
                    filterChain.push("format=".concat(has10BitOperation ? 'p010' : 'nv12'), 'hwupload');
                }
            }
        }
        else {
            if (qsvNeedsSoftwareRoundTrip) {
                filterChain.push('hwdownload', 'format=nv12');
            }
            appendSoftwareVideoFilters({
                args: args,
                stream: stream,
                filterChain: filterChain,
                hasHdrToSdrOperation: hasHdrToSdrOperation,
                shouldScale: shouldScale,
                resolutionInputs: resolutionInputs,
                targetResolution: targetResolution,
                frameRateInputs: frameRateInputs,
            });
            if (usesQsv && has10BitOperation) {
                filterChain.push('format=p010le');
            }
            if (qsvNeedsSoftwareRoundTrip) {
                filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
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
            var hardwareBitDepthHandledByFilterChain = usesVaapi || hardwareDecodedQsv;
            if (!hardwareBitDepthHandledByFilterChain) {
                stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', isLibsvtav1 ? 'yuv420p10le' : 'p010le');
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
exports.applyVideoFilters = applyVideoFilters;
