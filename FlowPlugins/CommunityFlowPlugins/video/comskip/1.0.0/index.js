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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fs_1 = require("fs");
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var normJoinPath_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/normJoinPath"));
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Comskip - Detect and Remove Commercials',
    description: "Uses comskip to detect commercials in a video file and ffmpeg to remove them.\n     \\nComskip must be installed and accessible on the system.\n     \\nThis plugin reads comskip output (EDL or TXT format) to identify commercial segments,\n     then uses ffmpeg to cut them out and produce a clean output file.\n     \\nUseful for DVR recordings from OTA or cable TV.",
    style: {
        borderColor: '#6EB5FF',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faScissors',
    inputs: [
        {
            label: 'Comskip Path',
            name: 'comskipPath',
            type: 'string',
            defaultValue: 'comskip',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to the comskip binary. If comskip is on your PATH, you can just use "comskip".'
                + ' Otherwise, provide the full path (e.g. /usr/bin/comskip).',
        },
        {
            label: 'Use Custom comskip.ini?',
            name: 'useCustomIni',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Enable this to specify a custom comskip.ini configuration file.',
        },
        {
            label: 'Custom comskip.ini Path',
            name: 'customIniPath',
            type: 'string',
            defaultValue: '/config/comskip.ini',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useCustomIni',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Full path to a custom comskip.ini configuration file.',
        },
        {
            label: 'Output Container',
            name: 'container',
            type: 'string',
            defaultValue: 'original',
            inputUI: {
                type: 'dropdown',
                options: [
                    'original',
                    'mkv',
                    'mp4',
                    'ts',
                ],
            },
            tooltip: 'Container format for the output file after commercial removal.'
                + ' "original" will use the same container as the input file.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Commercials detected and removed',
        },
        {
            number: 2,
            tooltip: 'No commercials detected',
        },
    ],
}); };
exports.details = details;
var parseEdlFile = function (edlContent) {
    var lines = edlContent.trim().split('\n');
    var entries = [];
    for (var i = 0; i < lines.length; i += 1) {
        var line = lines[i].trim();
        if (line === '') {
            continue; // eslint-disable-line no-continue
        }
        var parts = line.split(/\s+/);
        if (parts.length >= 3) {
            var start = parseFloat(parts[0]);
            var end = parseFloat(parts[1]);
            var type = parseInt(parts[2], 10);
            // Type 0 = cut (commercial), Type 3 = commercial
            if (!Number.isNaN(start) && !Number.isNaN(end) && (type === 0 || type === 3)) {
                entries.push({ start: start, end: end });
            }
        }
    }
    return entries;
};
// Parses comskip .txt output (frame-based) and converts to seconds
// Header format: "FILE PROCESSING COMPLETE  <frames> FRAMES AT  <rate>"
// where rate is fps * 100 (e.g. 2996 = 29.96 fps)
// Data lines: <start_frame>\t<end_frame>
var parseTxtFile = function (txtContent) {
    var lines = txtContent.trim().split('\n');
    var entries = [];
    if (lines.length < 3)
        return entries;
    // Parse framerate from header: "FILE PROCESSING COMPLETE  20489 FRAMES AT  2996"
    var headerMatch = lines[0].match(/FRAMES\s+AT\s+(\d+)/);
    if (!headerMatch)
        return entries;
    var fps = parseInt(headerMatch[1], 10) / 100;
    if (fps <= 0 || Number.isNaN(fps))
        return entries;
    // Skip header and separator line, parse frame ranges
    for (var i = 2; i < lines.length; i += 1) {
        var line = lines[i].trim();
        if (line === '') {
            continue; // eslint-disable-line no-continue
        }
        var parts = line.split(/\s+/);
        if (parts.length >= 2) {
            var startFrame = parseInt(parts[0], 10);
            var endFrame = parseInt(parts[1], 10);
            if (!Number.isNaN(startFrame) && !Number.isNaN(endFrame)) {
                entries.push({
                    start: startFrame / fps,
                    end: endFrame / fps,
                });
            }
        }
    }
    return entries;
};
var buildKeepSegments = function (commercials, duration) {
    // Sort entries by start time
    var sorted = __spreadArray([], commercials, true).sort(function (a, b) { return a.start - b.start; });
    var segments = [];
    var currentPos = 0;
    for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].start > currentPos) {
            segments.push({ start: currentPos, end: sorted[i].start });
        }
        currentPos = sorted[i].end;
    }
    // Add final segment after last commercial
    if (currentPos < duration) {
        segments.push({ start: currentPos, end: duration });
    }
    return segments;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, comskipPath, useCustomIni, customIniPath, container, inputFilePath, fileName, workDir, comskipArgs, comskipCli, comskipRes, edlPath, txtPath, commercials, edlContent, txtContent, duration, keepSegments, outputFilePath, filterParts, i, seg, concatInputs, filterComplex, ffmpegArgs, ffmpegCli, ffmpegRes;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                comskipPath = String(args.inputs.comskipPath);
                useCustomIni = args.inputs.useCustomIni === true || args.inputs.useCustomIni === 'true';
                customIniPath = String(args.inputs.customIniPath);
                container = String(args.inputs.container);
                inputFilePath = args.inputFileObj._id;
                fileName = (0, fileUtils_1.getFileName)(inputFilePath);
                if (container === 'original') {
                    container = (0, fileUtils_1.getContainer)(inputFilePath);
                }
                workDir = (0, fileUtils_1.getPluginWorkDir)(args);
                args.jobLog('Starting comskip commercial detection...');
                comskipArgs = [
                    '--output', workDir,
                ];
                if (useCustomIni) {
                    comskipArgs.push('--ini', customIniPath);
                }
                comskipArgs.push(inputFilePath);
                args.jobLog("Running: ".concat(comskipPath, " ").concat(comskipArgs.join(' ')));
                comskipCli = new cliUtils_1.CLI({
                    cli: comskipPath,
                    spawnArgs: comskipArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: '',
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, comskipCli.runCli()];
            case 1:
                comskipRes = _c.sent();
                if (comskipRes.cliExitCode !== 0 && comskipRes.cliExitCode !== 1) {
                    args.jobLog("Comskip exited with code ".concat(comskipRes.cliExitCode));
                    throw new Error("Comskip failed with exit code ".concat(comskipRes.cliExitCode));
                }
                edlPath = (0, normJoinPath_1.default)({
                    upath: args.deps.upath,
                    paths: [workDir, "".concat(fileName, ".edl")],
                });
                txtPath = (0, normJoinPath_1.default)({
                    upath: args.deps.upath,
                    paths: [workDir, "".concat(fileName, ".txt")],
                });
                commercials = [];
                return [4 /*yield*/, (0, fileUtils_1.fileExists)(edlPath)];
            case 2:
                if (!_c.sent()) return [3 /*break*/, 4];
                return [4 /*yield*/, fs_1.promises.readFile(edlPath, 'utf8')];
            case 3:
                edlContent = _c.sent();
                args.jobLog("EDL file contents:\n".concat(edlContent));
                commercials = parseEdlFile(edlContent);
                return [3 /*break*/, 8];
            case 4: return [4 /*yield*/, (0, fileUtils_1.fileExists)(txtPath)];
            case 5:
                if (!_c.sent()) return [3 /*break*/, 7];
                return [4 /*yield*/, fs_1.promises.readFile(txtPath, 'utf8')];
            case 6:
                txtContent = _c.sent();
                args.jobLog("TXT file contents:\n".concat(txtContent));
                commercials = parseTxtFile(txtContent);
                return [3 /*break*/, 8];
            case 7:
                args.jobLog('No EDL or TXT file generated - no commercials detected.');
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 8:
                if (commercials.length === 0) {
                    args.jobLog('Comskip output contained no commercial segments.');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                args.jobLog("Found ".concat(commercials.length, " commercial segment(s) to remove."));
                duration = 0;
                try {
                    duration = parseFloat(((_b = (_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.format) === null || _b === void 0 ? void 0 : _b.duration) || '0');
                }
                catch (err) {
                    // fallback
                }
                if (duration <= 0) {
                    args.jobLog('Could not determine video duration, using large fallback value.');
                    duration = 999999;
                }
                keepSegments = buildKeepSegments(commercials, duration);
                if (keepSegments.length === 0) {
                    args.jobLog('No content segments remaining after commercial removal - skipping.');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                args.jobLog("Keeping ".concat(keepSegments.length, " content segment(s)."));
                outputFilePath = "".concat(workDir, "/").concat(fileName, ".").concat(container);
                filterParts = [];
                for (i = 0; i < keepSegments.length; i++) {
                    seg = keepSegments[i];
                    filterParts.push("[0:v]trim=start=".concat(seg.start, ":end=").concat(seg.end, ",setpts=PTS-STARTPTS[v").concat(i, "];")
                        + "[0:a]atrim=start=".concat(seg.start, ":end=").concat(seg.end, ",asetpts=PTS-STARTPTS[a").concat(i, "];"));
                }
                concatInputs = keepSegments.map(function (_seg, i) { return "[v".concat(i, "][a").concat(i, "]"); }).join('');
                filterComplex = "".concat(filterParts.join(''))
                    + "".concat(concatInputs, "concat=n=").concat(keepSegments.length, ":v=1:a=1[outv][outa]");
                ffmpegArgs = [
                    '-y',
                    '-i', inputFilePath,
                    '-filter_complex', filterComplex,
                    '-map', '[outv]',
                    '-map', '[outa]',
                    '-c:v', 'libx264',
                    '-preset', 'medium',
                    '-crf', '18',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    outputFilePath,
                ];
                args.jobLog('Running ffmpeg to remove commercials...');
                ffmpegCli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: ffmpegArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, ffmpegCli.runCli()];
            case 9:
                ffmpegRes = _c.sent();
                if (ffmpegRes.cliExitCode !== 0) {
                    args.jobLog('FFmpeg commercial removal failed.');
                    throw new Error('FFmpeg commercial removal failed');
                }
                args.jobLog("Commercials removed successfully. Output: ".concat(outputFilePath));
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: outputFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
