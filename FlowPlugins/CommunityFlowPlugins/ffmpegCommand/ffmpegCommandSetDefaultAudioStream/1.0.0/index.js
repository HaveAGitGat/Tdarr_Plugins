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
            .filter(function (stream) { var _a, _b; return stream.codec_type === 'audio' && ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : languageCode === ''); })) === null || _a === void 0 ? void 0 : _a.sort(function (stream1, stream2) { var _a, _b; return (((_a = stream1.channels) !== null && _a !== void 0 ? _a : 0) > ((_b = stream2.channels) !== null && _b !== void 0 ? _b : 0) ? 1 : -1); })) === null || _b === void 0 ? void 0 : _b.at(0)) === null || _c === void 0 ? void 0 : _c.channels) !== null && _d !== void 0 ? _d : 0;
        args.jobLog("Channels ".concat(channels, " determined has being the highest channels"));
    }
    streams.forEach(function (stream, index) {
        var _a, _b, _c;
        if (stream.codec_type === 'audio') {
            if (((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '') === languageCode
                && ((_c = stream.channels) !== null && _c !== void 0 ? _c : 0) === channels
                && !defaultSet) {
                args.jobLog("Setting stream ".concat(index, " (language ").concat(languageCode, ", channels ").concat(channels, ") has default"));
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), 'default');
                defaultSet = true;
            }
            else
                stream.outputArgs.push("-c:".concat(index), 'copy', "-disposition:".concat(index), '0');
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
