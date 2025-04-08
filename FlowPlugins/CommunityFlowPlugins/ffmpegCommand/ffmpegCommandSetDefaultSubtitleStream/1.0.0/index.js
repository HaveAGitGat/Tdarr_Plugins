"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
// Optimized plugin details with better type safety
var details = function () { return ({
    name: 'Set Default Subtitle Stream',
    description: 'Sets the default subtitle track based on language',
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
            label: 'Language',
            name: 'language',
            type: 'string',
            defaultValue: 'eng',
            inputUI: { type: 'text' },
            tooltip: 'Specify what language to use in the ISO 639-2 format.\nExample:\neng\nfre',
        },
        {
            label: 'Allow descriptive streams to be default',
            name: 'allowDescriptive',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: { type: 'switch' },
            tooltip: 'If set to yes, descriptive streams will not be discarded when finding the default stream.',
        },
        {
            label: 'Allow forced streams to be default',
            name: 'allowForced',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: { type: 'switch' },
            tooltip: 'If set to yes, forced streams will not be discarded when finding the default stream.',
        },
    ],
    outputs: [
        { number: 1, tooltip: 'Default has been set' },
        { number: 2, tooltip: 'No default has been set' },
    ],
}); };
exports.details = details;
var DESCRIPTIVE_KEYWORDS = /\b(commentary|description|descriptive|sdh)\b/gi;
var FORCED_KEYWORDS = /\b(forced|force|forcé|forces|forcés)\b/gi;
var getFFMPEGDisposition = function (isDefault, dispositions) {
    if (!dispositions)
        return isDefault ? 'default' : '0';
    var activeDispositions = Object.entries(dispositions)
        .filter(function (_a) {
        var key = _a[0], value = _a[1];
        return key !== 'default' && value === 1;
    })
        .map(function (_a) {
        var key = _a[0];
        return key;
    });
    if (isDefault)
        activeDispositions.unshift('default');
    return activeDispositions.length ? activeDispositions.join('+') : '0';
};
var getIsDescriptiveSubtitleStream = function (stream) {
    var disposition = stream.disposition, tags = stream.tags;
    return Boolean((disposition === null || disposition === void 0 ? void 0 : disposition.comment)
        || (disposition === null || disposition === void 0 ? void 0 : disposition.descriptions)
        || (disposition === null || disposition === void 0 ? void 0 : disposition.hearing_impaired)
        || DESCRIPTIVE_KEYWORDS.test((tags === null || tags === void 0 ? void 0 : tags.title) || ''));
};
var getIsForcedSubtitleStream = function (stream) {
    var disposition = stream.disposition, tags = stream.tags;
    return Boolean((disposition === null || disposition === void 0 ? void 0 : disposition.forced)
        || FORCED_KEYWORDS.test((tags === null || tags === void 0 ? void 0 : tags.title) || ''));
};
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var shouldProcess = false;
    var streams = args.variables.ffmpegCommand.streams;
    var _a = args.inputs, allowDescriptive = _a.allowDescriptive, allowForced = _a.allowForced;
    // Sets the language code used to determine the default subtitle stream
    var languageCode = args.inputs.language;
    var defaultSet = false;
    streams.forEach(function (stream, index) {
        var _a, _b, _c;
        if (stream.codec_type !== 'subtitle')
            return;
        var streamLanguage = (_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '';
        var dispositions = stream.disposition;
        var isDefault = (dispositions === null || dispositions === void 0 ? void 0 : dispositions.default) !== 0;
        var isDescriptive = getIsDescriptiveSubtitleStream(stream);
        var isForced = getIsForcedSubtitleStream(stream);
        var shouldBeDefault = streamLanguage === languageCode
            && !isDefault
            && (!isDescriptive || allowDescriptive)
            && (!isForced || allowForced)
            && !defaultSet;
        var shouldRemoveDefault = isDefault
            && (streamLanguage !== languageCode
                || (isDescriptive && !allowDescriptive)
                || (isForced && !allowForced)
                || defaultSet);
        if (shouldBeDefault || shouldRemoveDefault) {
            (_c = stream.outputArgs) === null || _c === void 0 ? void 0 : _c.push("-c:".concat(index), 'copy', "-disposition:".concat(index), getFFMPEGDisposition(shouldBeDefault, dispositions));
            if (shouldBeDefault) {
                defaultSet = true;
                args.jobLog("Stream ".concat(index, " (language ").concat(streamLanguage, ") set as default"));
            }
            else {
                args.jobLog("Stream ".concat(index, " (language ").concat(streamLanguage, ", descriptive ").concat(isDescriptive, ", ")
                    + "forced ".concat(isForced, ") set as not default"));
            }
            shouldProcess = true;
        }
    });
    if (shouldProcess) {
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.shouldProcess = true;
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.streams = streams;
    }
    else {
        args.jobLog('No stream to modify');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: shouldProcess ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
