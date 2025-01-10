"use strict";
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
var addDisposition = function (disposition, dispositionToAdd) { return (dispositionToAdd.length > 0
    ? "".concat(disposition).concat(disposition.length > 0 ? '+' : '').concat(dispositionToAdd)
    : disposition); };
var getFFMPEGDisposition = function (stream, isDefault) {
    if (!stream.disposition)
        return '0';
    var disposition = addDisposition(isDefault ? 'default' : '', Object.entries(stream.disposition)
        .filter(function (_a) {
        var value = _a[0];
        return value === '1';
    })
        .map(function (_a) {
        var key = _a[0];
        return key;
    })
        .join('+'));
    return disposition.length > 0 ? disposition : '0';
};
// addDisposition(disposition, stream.disposition.dub === 1 ? 'dub' : '');
// addDisposition(disposition, stream.disposition.original === 1 ? 'original' : '');
// addDisposition(disposition, stream.disposition.comment === 1 ? 'comment' : '');
// addDisposition(disposition, stream.disposition.lyrics === 1 ? 'lyrics' : '');
// addDisposition(disposition, stream.disposition.karaoke === 1 ? 'karaoke' : '');
// addDisposition(disposition, stream.disposition.forced === 1 ? 'forced' : '');
// addDisposition(disposition, stream.disposition.hearing_impaired === 1 ? 'hearing_impaired' : '');
// addDisposition(disposition, stream.disposition.visual_impaired === 1 ? 'visual_impaired' : '');
// addDisposition(disposition, stream.disposition.clean_effects === 1 ? 'clean_effects' : '');
// addDisposition(disposition, stream.disposition.attached_pic === 1 ? 'attached_pic' : '');
// addDisposition(disposition, stream.disposition.timed_thumbnails === 1 ? 'timed_thumbnails' : '');
// addDisposition(disposition, stream.disposition.captions === 1 ? 'captions' : '');
// addDisposition(disposition, stream.disposition.descriptions === 1 ? 'descriptions' : '');
// addDisposition(disposition, stream.disposition.metadata === 1 ? 'metadata' : '');
// addDisposition(disposition, stream.disposition.dependent === 1 ? 'dependent' : '');
// addDisposition(disposition, stream.disposition.still_image === 1 ? 'still_image' : '');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b, _c, _d;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    // const streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
    var streams = args.variables.ffmpegCommand.streams;
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
        var _a, _b, _c, _d, _e;
        if (stream.codec_type === 'audio') {
            if (((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '') === languageCode
                && ((_c = stream.channels) !== null && _c !== void 0 ? _c : 0) === channels
                && !defaultSet) {
                args.jobLog("Setting stream ".concat(index, " (language ").concat(languageCode, ", channels ").concat(channels, ") has default"));
                var disposition = getFFMPEGDisposition(stream, true);
                args.jobLog("Original ".concat(JSON.stringify((_d = stream.disposition) !== null && _d !== void 0 ? _d : {}), "; new ").concat(disposition));
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), disposition);
                defaultSet = true;
            }
            else {
                var disposition = getFFMPEGDisposition(stream, false);
                args.jobLog("Original ".concat(JSON.stringify((_e = stream.disposition) !== null && _e !== void 0 ? _e : {}), "}; new ").concat(disposition));
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), disposition);
            }
        }
    });
    if (defaultSet) {
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.shouldProcess = true;
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.streams = streams;
    }
    else
        args.jobLog('No matching stream was found');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: defaultSet ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
