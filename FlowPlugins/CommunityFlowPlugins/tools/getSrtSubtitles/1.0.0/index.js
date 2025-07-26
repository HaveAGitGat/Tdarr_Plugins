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
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var iso_639_2_1 = require("iso-639-2");
var fs_1 = require("fs");
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var details = function () { return ({
    name: 'Get SRT Subtitles',
    description: 'Get SRT subtitles from video file',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Input Codec',
            name: 'inputCodec',
            type: 'string',
            defaultValue: 'srt',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Comma separated list of input subtitle codecs to be processed.\n        They should be text based format subtitle.\n        Supported values are subrip, srt, ass, ssa.\n          \\nExample:\\n\n          subrip,srt\n        ",
        },
        {
            label: 'Languages',
            name: 'languages',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Comma separated language tag/s to be kept.\n        \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.\n          \\nExample:\\n\n          eng,ind\n        ",
        },
        {
            label: 'Overwrite file',
            name: 'overwriteFile',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to overwrite existing subtitle file if found',
        },
        {
            label: 'ISO 639-1 output filename',
            name: 'useISO6391',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: "\n        Toggle whether to use ISO 639-1 (2 letter language code) instead for output file.\n        This is so that it is compatible with Bazarr default format.\n        For instance, you will get <filename>.en.srt instead of <filename>.eng.srt for English subtitle.\n        ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Subtitles are extracted',
        },
        {
            number: 2,
            tooltip: 'No subtitle extracted',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputCodec, langs, overwrite, useISO6391, supportedCodecs, invalidInputCodec, inputFileName, subsStreams, cliArgs, shouldProcess, spawnArgs, cli, res;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                inputCodec = String(args.inputs.inputCodec).trim().split(',').map(function (item) { return item.trim().toLowerCase(); });
                langs = String(args.inputs.languages).trim().split(',').map(function (item) { return item.trim().toLowerCase(); });
                overwrite = Boolean(args.inputs.overwriteFile);
                useISO6391 = Boolean(args.inputs.useISO6391);
                supportedCodecs = ['subrip', 'srt', 'ass', 'ssa'];
                invalidInputCodec = inputCodec.filter(function (codec) { return !supportedCodecs.includes(codec); });
                if (invalidInputCodec.length > 0) {
                    throw new Error("Unsupported inputCodec: ".concat(invalidInputCodec.join(','), ". Supported values are 'subrip', 'srt', 'ass', 'ssa'"));
                }
                inputFileName = args.inputFileObj._id;
                subsStreams = (_a = args.inputFileObj.ffProbeData.streams) === null || _a === void 0 ? void 0 : _a.filter(function (stream) { return stream.codec_type.toLowerCase() === 'subtitle'; });
                if (subsStreams === undefined || subsStreams.length === 0) {
                    args.jobLog('No subtitle stream found, there\'s nothing to do');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                cliArgs = ['-y', "-i ".concat(inputFileName)];
                shouldProcess = false;
                subsStreams.forEach(function (stream, index) {
                    var _a, _b;
                    // default to english when language tag is not defined
                    var lang = 'eng';
                    var title = '';
                    var streamCodec = stream.codec_name.toLowerCase();
                    if (stream.tags && stream.tags.language) {
                        lang = stream.tags.language.toLowerCase();
                    }
                    if (stream.tags && stream.tags.title) {
                        title = stream.tags.title.toLowerCase();
                    }
                    var isCommentary = title.includes('commentary') || title.includes('description');
                    if (langs.includes(lang) && inputCodec.includes(streamCodec) && !isCommentary) {
                        args.jobLog("Subtitle stream with index s:".concat(index, " matches language and input codec, processing..."));
                        if (useISO6391) {
                            // try to get the 639-1 language code and fallback to the language from ffprobeData
                            lang = (_b = (_a = iso_639_2_1.iso6392BTo1[lang]) !== null && _a !== void 0 ? _a : iso_639_2_1.iso6392TTo1[lang]) !== null && _b !== void 0 ? _b : lang;
                        }
                        var out = inputFileName.split('.');
                        out[out.length - 2] += ".".concat(lang);
                        out[out.length - 1] = 'srt';
                        var outFile = out.join('.');
                        args.jobLog("Output filename for subtitle stream with index s:".concat(index, " is ").concat(outFile));
                        if ((0, fs_1.existsSync)(outFile)) {
                            if (overwrite) {
                                args.jobLog("".concat(outFile, " already exists. Will be overwritten because overwrite is set to true"));
                                cliArgs.push("-map 0:s:".concat(index, " -c:s srt ").concat(outFile));
                                shouldProcess = true;
                            }
                            else {
                                args.jobLog("".concat(outFile, " already exists. Skipping because overwrite is set to false"));
                            }
                        }
                        else {
                            cliArgs.push("-map 0:s:".concat(index, " -c:s srt ").concat(outFile));
                            shouldProcess = true;
                        }
                    }
                });
                if (!shouldProcess) {
                    args.jobLog('No processing needed. Exiting...');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                spawnArgs = cliArgs.map(function (row) { return row.trim(); }).filter(function (row) { return row !== ''; });
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
                res = _b.sent();
                if (res.cliExitCode !== 0) {
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
