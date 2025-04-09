"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var details = function () { return ({
    name: 'Set Default Audio Stream',
    description: 'Sets the default audio track based on channels count and language',
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
            tooltip: 'Specify what language to use in the ISO 639-2 format. If the setFlowVariablesFromRadarrOrSonarr plugin is run before this one you can use the default language variable. \nExample:\neng\nfre\{{{args.variables.user.ArrOriginalLanguageCode}}}',
        },
        {
            label: 'Use the highest number of channels as default',
            name: 'useHightestNumberOfChannels',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: { type: 'switch' },
            tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set '
                + 'as the default audio stream? If yes, the Channels property will be ignored. If no, please indicate '
                + 'the channels to use in the Channels count property.',
        },
        {
            label: 'Channels count',
            name: 'channelsCount',
            type: 'string',
            defaultValue: '6',
            inputUI: {
                type: 'dropdown',
                options: ['8', '6', '2'],
            },
            tooltip: 'Specify what number of channels should be used as the default channel.',
        },
        {
            label: 'Allow descriptive streams to be default',
            name: 'allowDescriptive',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: { type: 'switch' },
            tooltip: 'If set to yes, descriptive streams will not be discarded when finding the default stream.',
        },
    ],
    outputs: [
        { number: 1, tooltip: 'Default has been set' },
        { number: 2, tooltip: 'No default has been set' },
    ],
}); };
exports.details = details;
var DESCRIPTIVE_KEYWORDS = /\b(commentary|description|descriptive|sdh)\b/gi;
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
    if (isDefault) {
        activeDispositions.unshift('default');
    }
    return activeDispositions.length ? activeDispositions.join('+') : '0';
};
var getIsDescriptiveAudioStream = function (stream) {
    var disposition = stream.disposition, tags = stream.tags;
    return Boolean((disposition === null || disposition === void 0 ? void 0 : disposition.comment)
        || (disposition === null || disposition === void 0 ? void 0 : disposition.descriptions)
        || (disposition === null || disposition === void 0 ? void 0 : disposition.visual_impaired)
        || DESCRIPTIVE_KEYWORDS.test((tags === null || tags === void 0 ? void 0 : tags.title) || ''));
};
var findHighestChannelCount = function (streams, languageCode) {
    var audioStreams = streams.filter(function (stream) {
        var _a, _b;
        return stream.codec_type === 'audio'
            && ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '') === languageCode;
    });
    if (!audioStreams.length)
        return 0;
    return Math.max.apply(Math, audioStreams.map(function (stream) { var _a; return (_a = stream.channels) !== null && _a !== void 0 ? _a : 0; }));
};
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var shouldProcess = false;
    var streams = args.variables.ffmpegCommand.streams;
    var _a = args.inputs, allowDescriptive = _a.allowDescriptive, useHightestNumberOfChannels = _a.useHightestNumberOfChannels;
    // Sets the language code used to determine the default subtitle stream
    var languageCode = String(args.inputs.language);
    // Determine target channel count
    var targetChannelsCount = useHightestNumberOfChannels
        ? findHighestChannelCount(streams, languageCode)
        : parseInt(String(args.inputs.channelsCount), 10);
    if (useHightestNumberOfChannels) {
        args.jobLog("".concat(targetChannelsCount, " channels count determined as being the highest match"));
    }
    var defaultSet = false;
    streams.forEach(function (stream, index) {
        var _a, _b, _c, _d, _e;
        if (stream.codec_type !== 'audio')
            return;
        var streamLanguage = (_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '';
        var streamChannels = (_c = stream.channels) !== null && _c !== void 0 ? _c : 0;
        var isDefault = ((_d = stream.disposition) === null || _d === void 0 ? void 0 : _d.default) !== 0;
        var isDescriptive = getIsDescriptiveAudioStream(stream);
        var shouldBeDefault = streamLanguage === languageCode
            && streamChannels === targetChannelsCount
            && !isDefault
            && (!isDescriptive || allowDescriptive)
            && !defaultSet;
        var shouldRemoveDefault = isDefault
            && (streamLanguage !== languageCode
                || streamChannels !== targetChannelsCount
                || (isDescriptive && !allowDescriptive)
                || defaultSet);
        if (shouldBeDefault || shouldRemoveDefault) {
            (_e = stream.outputArgs) === null || _e === void 0 ? void 0 : _e.push("-c:".concat(index), 'copy', "-disposition:".concat(index), getFFMPEGDisposition(shouldBeDefault, stream.disposition));
            if (shouldBeDefault) {
                defaultSet = true;
                args.jobLog("Stream ".concat(index, " (language ").concat(streamLanguage, ", channels ").concat(streamChannels, ") set as default"));
            }
            else {
                args.jobLog("Stream ".concat(index, " (language ").concat(streamLanguage, ", channels ").concat(streamChannels, ", ")
                    + "descriptive ".concat(isDescriptive, ") set as not default"));
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
