"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Subtitles Add to MKV',
    description: 'Add Subtitles in SRT to MKV,'
        + ' You must you the Begin/Exectute Command made for Multi Input.',
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
            label: 'ONE Language tag to Add to MKV',
            name: 'langTag',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Choose ONE three letter language tag to insert into the mkv.',
        },
        {
            label: 'Include Forced Subs',
            name: 'include_forced',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Forced subtitles will also be added, required naming is source.eng.forced.srt,'
                + 'this example assumes chosen tag is eng.',
        },
        {
            label: 'Include SDH Subs',
            name: 'include_sdh',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Sdh subtitles will also be added, required naming is source.eng.sdh.srt,'
                + 'this example assumes chosen tag is eng.',
        },
        {
            label: 'Include CC Subs',
            name: 'include_cc',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Sdh subtitles will also be added, required naming is source.eng.cc.srt,'
                + 'this example assumes chosen tag is eng.',
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
// eslint-disable-next-line @typescript-eslint/ban-types
var loopOverStreamsOfType = function (args, type, method) {
    if (args.inputFileObj.ffProbeData.streams) {
        for (var i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
            if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
                method(args.inputFileObj.ffProbeData.streams[i]);
            }
        }
    }
};
var buildSubtitleConfiguration = function (args) {
    // eslint-disable-next-line import/no-unresolved
    var languages = require('@cospired/i18n-iso-languages');
    var fs = require('fs');
    var processLanguage = String(args.inputs.langTag).trim();
    var processLanguage2 = languages.alpha3BToAlpha2(processLanguage);
    var boolGetForced = Boolean(args.inputs.include_forced);
    var boolGetSdh = Boolean(args.inputs.include_sdh);
    var boolGetCc = Boolean(args.inputs.include_cc);
    var subtitleSettings = {
        processFile: false,
        subInput: [],
        subOutput: [],
    };
    var embeddedSubs = 0;
    var boolHaveMain = false;
    var boolHaveForced = false;
    var boolHaveSdh = false;
    var boolHaveCc = false;
    // Loop through the streams
    var subProcess = function (stream) {
        // eslint-disable-next-line no-plusplus
        embeddedSubs++;
        var lang = '';
        var title = '';
        var codec = '';
        if (stream.tags !== undefined) {
            if (stream.tags.language !== undefined) {
                lang = stream.tags.language.toLowerCase();
            }
            if (stream.tags.title !== undefined) {
                title = stream.tags.title.toLowerCase();
            }
        }
        if (stream.codec_name !== undefined) {
            codec = stream.codec_name.toLowerCase();
        }
        // Ignore these codecs
        if (codec !== 'subrip' && codec !== 'ass' && codec !== 'mov_text' && codec !== 'ssa') {
            return;
        }
        // Ignore languages we dont want
        if (processLanguage !== lang && processLanguage2 !== lang) {
            return;
        }
        // Check these titles and determine if we already have what we want
        if (processLanguage === lang || processLanguage2 === lang) {
            if (stream.disposition.forced || (title.includes('forced'))) {
                boolHaveForced = true;
            }
            else if (stream.disposition.sdh || (title.includes('sdh'))) {
                boolHaveSdh = true;
            }
            else if (stream.disposition.cc || (title.includes('cc'))) {
                boolHaveCc = true;
            }
            else {
                boolHaveMain = true;
            }
        }
    };
    loopOverStreamsOfType(args, 'subtitle', subProcess);
    // Check if all Good or Determine if we are missing a sub we want in the MKV
    var boolCheckForSrt = false;
    if (!boolHaveMain) {
        boolCheckForSrt = true;
    }
    if (boolGetForced) {
        if (!boolHaveForced) {
            boolCheckForSrt = true;
        }
    }
    if (boolGetSdh) {
        if (!boolHaveSdh) {
            boolCheckForSrt = true;
        }
    }
    if (boolGetCc) {
        if (!boolHaveCc) {
            boolCheckForSrt = true;
        }
    }
    if (!boolCheckForSrt) {
        return subtitleSettings;
    }
    // Setup Variable to Check Disk for the files
    var dispostionMain = '';
    var dispostionForced = '.forced';
    var dispostionSdh = '.sdh';
    var dispostionCc = '.cc';
    var buildSrtFile = function (lang, disposition) {
        var fileName = (0, fileUtils_1.getFileName)(args.originalLibraryFile._id);
        var orignalFolder = (0, fileUtils_1.getFileAbosluteDir)(args.originalLibraryFile._id);
        var tempsrtFile = [orignalFolder, '/', fileName];
        tempsrtFile.push(".".concat(lang).concat(disposition, ".srt"));
        var srtFile = tempsrtFile.join('');
        return srtFile;
    };
    var mainSubFile = buildSrtFile(processLanguage, dispostionMain);
    var mainAltSubFile = buildSrtFile(processLanguage2, dispostionMain);
    var forcedSubFile = buildSrtFile(processLanguage, dispostionForced);
    var forcedAltSubFile = buildSrtFile(processLanguage2, dispostionForced);
    var sdhSubFile = buildSrtFile(processLanguage, dispostionSdh);
    var sdhAltSubFile = buildSrtFile(processLanguage2, dispostionSdh);
    var ccSubFile = buildSrtFile(processLanguage, dispostionCc);
    var ccAltSubFile = buildSrtFile(processLanguage2, dispostionCc);
    // Check for the SRT files names we want
    var findSrtFile = function (subFile, altSubFile) {
        if (fs.existsSync("".concat(subFile))) {
            return subFile;
        }
        if (fs.existsSync("".concat(altSubFile))) {
            return altSubFile;
        }
        return null;
    };
    var mainChosenSubsFile = findSrtFile(mainSubFile, mainAltSubFile);
    var forcedChosenSubsFile = findSrtFile(forcedSubFile, forcedAltSubFile);
    var sdhChosenSubsFile = findSrtFile(sdhSubFile, sdhAltSubFile);
    var ccChosenSubsFile = findSrtFile(ccSubFile, ccAltSubFile);
    // Add Subs to MKV
    var subIndex = 1;
    var titlepMain = 'default';
    var titleForced = 'forced';
    var titleSdh = 'sdh';
    var titleCc = 'cc';
    var transcode = function (chosenSubsFile, title) {
        var disposition = title;
        if (disposition === 'sdh' || disposition === 'cc') {
            disposition = 'hearing_impaired';
        }
        var mInput = ['-sub_charenc', 'UTF-8', '-f', 'srt', '-i', chosenSubsFile];
        mInput.forEach(function (element) {
            subtitleSettings.subInput.push(element);
        });
        var output = [
            '-map',
            "".concat(subIndex, ":s"),
            "-codec:s:".concat(embeddedSubs),
            'srt',
            "-metadata:s:s:".concat(embeddedSubs),
            "language=".concat(processLanguage),
            "-metadata:s:s:".concat(embeddedSubs),
            "title=".concat(title),
            "-disposition:s:".concat(embeddedSubs),
            disposition
        ];
        output.forEach(function (element) {
            subtitleSettings.subOutput.push(element);
        });
        // eslint-disable-next-line no-plusplus
        embeddedSubs++;
        // eslint-disable-next-line no-plusplus
        subIndex++;
    };
    if (mainChosenSubsFile != null && !boolHaveMain) {
        transcode(mainChosenSubsFile, titlepMain);
        args.jobLog("Adding ".concat(args.inputs.langTag, " SRT to MKV"));
        subtitleSettings.processFile = true;
    }
    if (forcedChosenSubsFile != null && boolGetForced && !boolHaveForced) {
        transcode(forcedChosenSubsFile, titleForced);
        args.jobLog("Adding ".concat(args.inputs.langTag, " SRT FORCED to MKV"));
        subtitleSettings.processFile = true;
    }
    if (sdhChosenSubsFile != null && boolGetSdh && !boolHaveSdh) {
        transcode(sdhChosenSubsFile, titleSdh);
        args.jobLog("Adding ".concat(args.inputs.langTag, " SRT SDH to MKV"));
        subtitleSettings.processFile = true;
    }
    if (ccChosenSubsFile != null && boolGetCc && !boolHaveCc) {
        transcode(ccChosenSubsFile, titleCc);
        args.jobLog("Adding ".concat(args.inputs.langTag, " SRT CC to MKV"));
        subtitleSettings.processFile = true;
    }
    return subtitleSettings;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, dependencies, subtitleSettings;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                dependencies = ['@cospired/i18n-iso-languages'];
                return [4 /*yield*/, args.installClassicPluginDeps(dependencies)];
            case 1:
                _a.sent();
                subtitleSettings = buildSubtitleConfiguration(args);
                if (subtitleSettings.processFile) {
                    subtitleSettings.subInput.forEach(function (element) {
                        args.variables.ffmpegCommand.multiInputArguments.push(element);
                    });
                    subtitleSettings.subOutput.forEach(function (element) {
                        args.variables.ffmpegCommand.overallOuputArguments.push(element);
                    });
                }
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
