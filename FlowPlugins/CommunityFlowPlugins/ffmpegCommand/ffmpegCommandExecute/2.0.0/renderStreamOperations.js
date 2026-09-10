"use strict";
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
exports.applyReorderStreams = exports.applyContainerConform = exports.applyRemoveStreamByProperty = void 0;
var renderUtils_1 = require("./renderUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
        var target = (0, renderUtils_1.getNestedProperty)(stream, propertyToCheck);
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
            changed = (0, renderUtils_1.markRemoved)(stream) || changed;
        }
    });
    return changed;
};
exports.applyRemoveStreamByProperty = applyRemoveStreamByProperty;
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
                changed = (0, renderUtils_1.markRemoved)(stream) || changed;
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
                changed = (0, renderUtils_1.markRemoved)(stream) || changed;
            }
        }
        catch (err) {
            // Ignore incomplete stream metadata.
        }
    }
    return changed;
};
exports.applyContainerConform = applyContainerConform;
var applyReorderStreams = function (streams, inputs) {
    var reorderedStreams = __spreadArray([], streams, true);
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
exports.applyReorderStreams = applyReorderStreams;
