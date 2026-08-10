"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Subtitles Extract Subs',
    description: 'Extract Subtitles to SRT,'
        + ' You must use the Begin/Exectute Command made for Multi Output.'
        + 'This outputs the subs to the input folder',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'subtitle',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Overwrite existing SRT Files',
            name: 'overwrite',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Overwrite with the extracted SRT files',
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
var buildSubtitleConfiguration = function (args) {
    var overwrite = Boolean(args.inputs.overwrite);
    var fs = require('fs');
    var subIdx = -1;
    var subtitleSettings = {
        processFile: false,
        subOutput: [],
    };
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        var _a, _b;
        if (stream.codec_type !== 'subtitle') {
            return;
        }
        subIdx += 1;
        if (stream.removed) {
            return;
        }
        var lang = '';
        var title = '';
        var strDisposition = '';
        var boolTextSubs = false;
        var codec = '';
        if (((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== undefined) {
            lang = stream.tags.language.toLowerCase();
        }
        if (((_b = stream.tags) === null || _b === void 0 ? void 0 : _b.title) !== undefined) {
            title = stream.tags.title.toLowerCase();
        }
        if (stream.codec_name !== undefined) {
            codec = stream.codec_name.toLowerCase();
        }
        if (stream.disposition.forced || (title.includes('forced'))) {
            strDisposition = '.forced';
        }
        else if (stream.disposition.sdh || (title.includes('sdh'))) {
            strDisposition = '.sdh';
        }
        else if (stream.disposition.cc || (title.includes('cc'))) {
            strDisposition = '.cc';
        }
        else if (stream.disposition.commentary || stream.disposition.description
            || (title.includes('commentary')) || (title.includes('description'))) {
            strDisposition = '.commentary';
        }
        else if (stream.disposition.lyrics
            || (title.includes('signs')) || (title.includes('songs'))) {
            strDisposition = '.signsandsongs';
        }
        if (codec === 'ass' || codec === 'mov_text' || codec === 'ssa' || codec === 'subrip') {
            boolTextSubs = true;
        }
        if (!boolTextSubs) {
            return;
        }
        // Build subtitle file names.
        var fileName = (0, fileUtils_1.getFileName)(args.originalLibraryFile._id);
        var orignalFolder = (0, fileUtils_1.getFileAbosluteDir)(args.originalLibraryFile._id);
        var tempsubsFile = [orignalFolder, '/', fileName];
        if (lang === '') {
            tempsubsFile.push(".und".concat(strDisposition, ".srt"));
        }
        else {
            tempsubsFile.push(".".concat(lang).concat(strDisposition, ".srt"));
        }
        var subsFile = tempsubsFile.join('');
        // Send Commands.
        if (fs.existsSync(subsFile) && !overwrite) {
            return;
        }
        args.jobLog("Extracting Subtitles at index ".concat(stream.index));
        subtitleSettings.processFile = true;
        subtitleSettings.subOutput.push('-map', "0:s:".concat(subIdx), subsFile);
    });
    return subtitleSettings;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var subtitleSettings = buildSubtitleConfiguration(args);
    if (subtitleSettings.processFile) {
        subtitleSettings.subOutput.forEach(function (element) {
            args.variables.ffmpegCommand.multiOutputArguments.push(element);
        });
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
