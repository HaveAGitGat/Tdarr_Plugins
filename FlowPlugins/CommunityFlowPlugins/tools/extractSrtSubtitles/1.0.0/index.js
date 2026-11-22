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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var fs_1 = require("fs");
var iso6392_1 = require("./iso6392");
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var details = function () { return ({
    name: 'Extract SRT Subtitles',
    description: 'Extract SRT subtitles from video',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faClosedCaptioning',
    inputs: [
        {
            label: 'Input Codec',
            name: 'inputCodec',
            type: 'string',
            defaultValue: 'subrip',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Comma separated list of input subtitle codecs to be processed.\n        They should be text based format subtitle.\n        Supported values are subrip, srt, ass, ssa.\n          \\nExample:\\n\n          subrip,srt\n      ",
        },
        {
            label: 'Languages',
            name: 'languages',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Comma separated language tag(s) to be kept.\n        \\nMust follow ISO-639-2 3 letter format.\n        https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.\n          \\nExample:\\n\n          eng,ind\n      ",
        },
        {
            label: 'Overwrite Existing File',
            name: 'overwriteFile',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to overwrite existing subtitle file if found',
        },
        {
            label: 'Use ISO 639-1 Output Filename',
            name: 'useISO6391',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: "\n        Toggle whether to use ISO 639-1 2 letter format for output file.\n        \\nThis is so that it is compatible with Bazarr default format.\n        \\nMeaning that with this turned on the output file will be\n        '<name>.en.srt' instead of '<name>.eng.srt' for English subtitle.\n      ",
        },
        {
            label: 'Enable Hearing Impaired Detection',
            name: 'enableHI',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: "\n        Toggle whether to enable Hearing Impaired subtitle detection.\n        \\nThe detection is done by checking if one of these conditions is true:\n        \\n  - The title tag contains \"HI\" or \"SDH\"\n        \\n  - The stream has \"disposition.hearing_impaired: 1\"\n      ",
        },
        {
            label: 'Hearing Impaired Filename Flag',
            name: 'hiTag',
            type: 'string',
            defaultValue: 'hi',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableHI',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\n        String to add to the filename if subtitle is detected as Hearing Impaired subtitle.\n        \\nFor instance, the resulting filename will be \"<name>.<lang>.hi.srt\" if you set this\n        to \"hi\" and the subtitle is detected as Hearing Impaired subtitle.\n      ",
        },
        {
            label: 'Enable Forced Detection',
            name: 'enableForced',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: "\n        Toggle whether to enable Forced subtitle detection.\n        \\nThe detection is done by checking if one of these conditions is true:\n        \\n  - The title tag contains case insensitive \"forced\"\n        \\n  - The stream has \"disposition.forced: 1\"\n      ",
        },
        {
            label: 'Forced Filename Flag',
            name: 'forcedTag',
            type: 'string',
            defaultValue: 'forced',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableForced',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\n        String to add to the filename if subtitle is detected as Forced subtitle.\n        \\nFor instance, the resulting filename will be \"<name>.<lang>.forced.srt\" if you set\n        this to \"forced\" and the subtitle is detected as Forced subtitle.\n      ",
        },
        {
            label: 'Enable Default Detection',
            name: 'enableDefault',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: "\n        Toggle whether to enable Default subtitle detection.\n        \\nThe detection is done by checking if this condition is true:\n        \\n  - The stream has \"disposition.default: 1\"\n      ",
        },
        {
            label: 'Default Filename Flag',
            name: 'defaultTag',
            type: 'string',
            defaultValue: 'default',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enableDefault',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\n        String to add to the filename if subtitle is detected as Default subtitle.\n        \\nFor instance, the resulting filename will be \"<name>.<lang>.default.srt\" if you set\n        this to \"default\" and the subtitle is detected as Default subtitle.\n      ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Subtitle(s) extracted',
        },
        {
            number: 2,
            tooltip: 'No Subtitle extracted',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputCodec, languages, overwriteFile, useISO6391, validCodecs, invalidCodecs, inputFilename, subStreams, ffmpegCommand, spawnArgs, cli, result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                inputCodec = String(args.inputs.inputCodec)
                    .split(',')
                    .map(function (item) { return item.trim().toLowerCase(); })
                    .filter(Boolean);
                languages = String(args.inputs.languages)
                    .split(',')
                    .map(function (item) { return item.trim().toLowerCase(); })
                    .filter(Boolean);
                overwriteFile = Boolean(args.inputs.overwriteFile);
                useISO6391 = Boolean(args.inputs.useISO6391);
                validCodecs = ['subrip', 'srt', 'ass', 'ssa'];
                invalidCodecs = inputCodec.filter(function (codec) { return !validCodecs.includes(codec); });
                if (invalidCodecs.length > 0) {
                    throw new Error("Unsupported inputCodec: ".concat(invalidCodecs.join(','))
                        + '. Supported values are:'
                        + ' "subrip", "srt", "ass", "ssa".');
                }
                inputFilename = args.inputFileObj._id;
                subStreams = (_a = args.inputFileObj.ffProbeData.streams) === null || _a === void 0 ? void 0 : _a.filter(function (stream) { return stream.codec_type.toLowerCase() === 'subtitle'; });
                if (subStreams === undefined || subStreams.length === 0) {
                    args.jobLog("No subtitle stream found, there's nothing to do");
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                args.jobLog("Found ".concat(subStreams.length, " subtitle stream(s), processing..."));
                ffmpegCommand = {
                    inputArgs: ['-y', '-i', "".concat(inputFilename)],
                    streamArgs: [],
                };
                subStreams.forEach(function (stream, index) {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    var codecName = stream.codec_name.toLowerCase();
                    var lang = ((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) || '';
                    var title = ((_b = stream.tags) === null || _b === void 0 ? void 0 : _b.title) || '';
                    var isCommentary = ((_c = stream.disposition) === null || _c === void 0 ? void 0 : _c.comment) === 1
                        || title.toLowerCase().includes('commentary')
                        || title.toLowerCase().includes('description');
                    args.jobLog("Subtitle stream[".concat(index, "] => {\n      \n  codec: \"").concat(codecName, "\",\n      \n  lang: \"").concat(lang, "\",\n      \n  title: \"").concat(title, "\",\n      \n  isCommentary: \"").concat(isCommentary, "\"\n      }"));
                    if (!languages.includes(lang)
                        || !inputCodec.includes(codecName)
                        || isCommentary) {
                        args.jobLog("Subtitle stream[".concat(index, "] doesn't match input \"languages\" ")
                            + 'or "input" or "is a commentary subtitle". Skipping...');
                        return;
                    }
                    args.jobLog("Subtitle stream[".concat(index, "] will be processed..."));
                    if (useISO6391) {
                        // try to get the 639-1 language code, fallback to detected language
                        lang = (_e = (_d = iso6392_1.iso6392BTo1[lang]) !== null && _d !== void 0 ? _d : iso6392_1.iso6392TTo1[lang]) !== null && _e !== void 0 ? _e : lang;
                    }
                    var isHI = ((_f = stream.disposition) === null || _f === void 0 ? void 0 : _f.hearing_impaired) === 1
                        || title.includes('HI')
                        || title.includes('SDH');
                    var isForced = ((_g = stream.disposition) === null || _g === void 0 ? void 0 : _g.forced) === 1
                        || title.toLowerCase().includes('forced');
                    var isDefault = ((_h = stream.disposition) === null || _h === void 0 ? void 0 : _h.default) === 1;
                    // determine the output filename
                    var out = inputFilename.split('.');
                    out[out.length - 1] = 'srt';
                    out[out.length - 2] += ".".concat(lang);
                    if (isHI && Boolean(args.inputs.enableHI)) {
                        out[out.length - 2] += ".".concat(String(args.inputs.hiTag).toLowerCase());
                    }
                    if (isForced && Boolean(args.inputs.enableForced)) {
                        out[out.length - 2] += ".".concat(String(args.inputs.forcedTag).toLowerCase());
                    }
                    if (isDefault && Boolean(args.inputs.enableDefault)) {
                        out[out.length - 2] += ".".concat(String(args.inputs.defaultTag).toLowerCase());
                    }
                    var outputFile = out.join('.');
                    args.jobLog("Output filename for subtitle stream[".concat(index, "]: \"").concat(outputFile, "\""));
                    if ((0, fs_1.existsSync)(outputFile) && !overwriteFile) {
                        args.jobLog("\"".concat(outputFile, "\" already exists")
                            + '. Skipping because "overwriteFile" is set to "false"...');
                        return;
                    }
                    var streamArg = {
                        mapArgs: ['-map', "0:s:".concat(index)],
                        inputArgs: ['-c:s', 'srt'],
                        outputFile: outputFile,
                    };
                    args.jobLog("Generated FFmpeg args for subtitle stream[".concat(index, "]:")
                        + "\n".concat(JSON.stringify({ streamArg: streamArg })));
                    ffmpegCommand.streamArgs.push(streamArg);
                });
                if (ffmpegCommand.streamArgs.length === 0) {
                    args.jobLog('No stream needed to be processed. Exiting...');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                spawnArgs = ffmpegCommand.inputArgs;
                ffmpegCommand.streamArgs.forEach(function (arg) {
                    spawnArgs.push.apply(spawnArgs, __spreadArray(__spreadArray(__spreadArray([], arg.mapArgs, false), arg.inputArgs, false), [arg.outputFile], false));
                });
                args.jobLog('Sending job to worker node...');
                args.jobLog(JSON.stringify({ spawnArgs: spawnArgs }));
                args.updateWorker({
                    CLIType: args.ffmpegPath,
                    preset: spawnArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: spawnArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: '',
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                result = _b.sent();
                if (result.cliExitCode !== 0) {
                    args.jobLog('FFmpeg command failed');
                    throw new Error('FFmpeg failed');
                }
                args.logOutcome('tSuc');
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
