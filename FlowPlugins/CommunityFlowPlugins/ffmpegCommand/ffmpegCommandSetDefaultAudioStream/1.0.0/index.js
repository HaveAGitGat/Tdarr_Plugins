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
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Default Audio Stream',
    description: 'Sets the default audio track based on channels count and Radarr or Sonar',
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
            label: 'Use Radarr or Sonarr to get original language',
            name: 'useRadarrOrSonarr',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Should the language of the default audio track be read from Radarr or Sonarr ? If yes, '
                + 'the "Set Flow Variables From Radarr Or Sonarr" has to be run before and the Language property will be '
                + 'ignored. If no, please indicate the language to use in the Language property.',
        },
        {
            label: 'Language',
            name: 'language',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify what language to use in the ISO 639-2 format.'
                + '\\nExample:\\n'
                + 'eng\\n'
                + 'fre\\n',
        },
        {
            label: 'Use the highest number of channels as default',
            name: 'useHightestNumberOfChannels',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set '
                + 'as the default audio stream ? If yes, the Channels property will be ignored. If no, please indicate '
                + 'the channels to use in the Channels property.',
        },
        {
            label: 'Channels ',
            name: 'channels',
            type: 'string',
            defaultValue: '6',
            inputUI: {
                type: 'dropdown',
                options: ['8', '6', '2'],
            },
            tooltip: 'Specify what number of channels should be used as the default channel.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Default has been set',
        },
        {
            number: 2,
            tooltip: 'No default has been set',
        },
    ],
}); };
exports.details = details;
var getFFMPEGDisposition = function (isDefault, dispositions) {
    if (!dispositions)
        return isDefault ? 'default' : '0';
    var previousDispositions = Object.entries(dispositions)
        .reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        if (key !== 'default' && value === 1) {
            acc.push(key);
        }
        return acc;
    }, []);
    return __spreadArray([
        isDefault ? 'default' : ''
    ], previousDispositions, true).filter(Boolean)
        .join('+')
        || '0';
};
var getIsDescriptiveAudioStream = function (stream) {
    var _a;
    return Boolean(stream.disposition
        && (stream.disposition.comment
            || stream.disposition.descriptions
            || stream.disposition.visual_impaired
            || /\b(commentary|description|descriptive)\b/gi.test(((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.title) || '')));
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b, _c, _d;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    // const streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
    var streams = args.variables.ffmpegCommand.streams;
    var shouldProcess = false;
    var defaultSet = false;
    // Sets the language code used to determine the default audio stream
    var languageCode = args.inputs.language;
    if (args.inputs.useRadarrOrSonarr) {
        languageCode = args.variables.user.ArrOriginalLanguageCode;
        args.jobLog("Language ".concat(languageCode, " read from flow variables"));
    }
    // Sets the channels used to determine the default audio stream
    var channels = args.inputs.channels;
    if (args.inputs.useHightestNumberOfChannels) {
        channels = (_d = (_c = (_b = (_a = streams
            .filter(function (stream) { var _a, _b; return stream.codec_type === 'audio' && ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : languageCode === ''); })) === null || _a === void 0 ? void 0 : _a.sort(function (stream1, stream2) { var _a, _b; return ((_a = stream2.channels) !== null && _a !== void 0 ? _a : 0) - ((_b = stream1.channels) !== null && _b !== void 0 ? _b : 0); })) === null || _b === void 0 ? void 0 : _b.at(0)) === null || _c === void 0 ? void 0 : _c.channels) !== null && _d !== void 0 ? _d : 0;
        args.jobLog("Channels ".concat(channels, " determined has being the highest match"));
    }
    streams.forEach(function (stream, index) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (stream.codec_type === 'audio') {
            var dispositions = stream.disposition;
            var isDescriptiveAudioStream = getIsDescriptiveAudioStream(stream);
            if (((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '') === languageCode
                && ((_c = stream.channels) !== null && _c !== void 0 ? _c : 0) === channels
                && ((_d = dispositions === null || dispositions === void 0 ? void 0 : dispositions.default) !== null && _d !== void 0 ? _d : 0) === 0
                && !isDescriptiveAudioStream
                && !defaultSet) {
                args.jobLog("Stream ".concat(index, " (language ").concat(languageCode, ", channels ").concat(channels, ") set has default"));
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), getFFMPEGDisposition(true, dispositions));
                defaultSet = true;
                shouldProcess = true;
            }
            else if (((_e = dispositions === null || dispositions === void 0 ? void 0 : dispositions.default) !== null && _e !== void 0 ? _e : 0) === 1
                && (((_g = (_f = stream.tags) === null || _f === void 0 ? void 0 : _f.language) !== null && _g !== void 0 ? _g : '') !== languageCode
                    || ((_h = stream.channels) !== null && _h !== void 0 ? _h : 0) !== channels
                    || isDescriptiveAudioStream)) {
                args.jobLog("Stream ".concat(index, " (language ").concat(languageCode, ", channels ").concat(channels, ", \n          descriptive ").concat(isDescriptiveAudioStream, ") set has not default"));
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), getFFMPEGDisposition(false, dispositions));
                shouldProcess = true;
            }
        }
    });
    if (shouldProcess) {
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.shouldProcess = true;
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.streams = streams;
    }
    else
        args.jobLog('No stream to modify');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: shouldProcess ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
