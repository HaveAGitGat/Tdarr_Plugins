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
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var classicPlugins_1 = require("../../../../FlowHelpers/1.0.0/classicPlugins");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Run Classic Transcode Plugin',
    description: 'Run one of Tdarr\'s classic plugins that has Operation: Transcode',
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
            label: 'Plugin Source ID',
            name: 'pluginSourceId',
            type: 'string',
            defaultValue: 'Community:Tdarr_Plugin_MC93_Migz1FFMPEG',
            inputUI: {
                type: 'dropdown',
                options: [],
            },
            tooltip: 'Specify the classic plugin ID',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Processing was done by the classic plugin',
        },
        {
            number: 2,
            tooltip: 'Processing was not done by the classic plugin',
        },
    ],
}); };
exports.details = details;
var replaceContainer = function (filePath, container) {
    var parts = filePath.split('.');
    parts[parts.length - 1] = container.split('.').join('');
    return parts.join('.');
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, outcome, result, absolutePath, cacheFilePath, cliPath_1, customArgs, isCustomConfig, presetSplit, workerCommand, cliPath, cli, res;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                return [4 /*yield*/, (0, classicPlugins_1.runClassicPlugin)(args, 'transcode')];
            case 1:
                outcome = _d.sent();
                result = outcome.result, absolutePath = outcome.absolutePath;
                cacheFilePath = outcome.cacheFilePath;
                args.jobLog(JSON.stringify(result, null, 2));
                if (!result) {
                    args.jobLog('No result from classic plugin. Continuing to next flow plugin.');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                // --- Backwards compatibility------------
                if (result.handBrakeMode) {
                    result.handbrakeMode = result.handBrakeMode;
                }
                if (result.FFmpegMode) {
                    result.ffmpegMode = result.FFmpegMode;
                }
                //----------------------------------------
                if (result.ffmpegMode) {
                    result.cliToUse = 'ffmpeg';
                }
                else if (result.handbrakeMode) {
                    result.cliToUse = 'handbrake';
                }
                else if (typeof ((_a = result === null || result === void 0 ? void 0 : result.custom) === null || _a === void 0 ? void 0 : _a.cliPath) === 'string') {
                    cliPath_1 = result.custom.cliPath;
                    if (cliPath_1.toLowerCase().includes('ffmpeg')) {
                        result.cliToUse = 'ffmpeg';
                    }
                    else if (cliPath_1.toLowerCase().includes('handbrake')) {
                        result.cliToUse = 'handbrake';
                    }
                    else if (cliPath_1.toLowerCase().includes('editready')) {
                        result.cliToUse = 'editready';
                    }
                    else if (cliPath_1.toLowerCase().includes('av1an')) {
                        result.cliToUse = 'av1an';
                    }
                }
                result.workerLog = result.transcodeSettingsLog;
                args.jobLog(JSON.stringify(result, null, 2));
                if (result.error) {
                    throw new Error("Plugin ".concat(absolutePath, " failed: ").concat(result.error));
                }
                if (result.processFile !== true) {
                    args.jobLog('Classic plugin does not need to process file. Continuing to next flow plugin.');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                customArgs = (_b = result === null || result === void 0 ? void 0 : result.custom) === null || _b === void 0 ? void 0 : _b.args;
                isCustomConfig = (Array.isArray(customArgs) && customArgs.length > 0)
                    || (typeof customArgs === 'string'
                        // @ts-expect-error length
                        && customArgs.length
                            > 0);
                if (!isCustomConfig) {
                    cacheFilePath = replaceContainer(cacheFilePath, result.container);
                }
                else {
                    // @ts-expect-error type
                    cacheFilePath = result.custom.outputPath;
                }
                if (result.preset.includes('<io>')) {
                    presetSplit = result.preset.split('<io>');
                }
                else {
                    presetSplit = result.preset.split(',');
                }
                workerCommand = [];
                cliPath = '';
                if (isCustomConfig) {
                    // @ts-expect-error cliPath
                    cliPath = (_c = result === null || result === void 0 ? void 0 : result.custom) === null || _c === void 0 ? void 0 : _c.cliPath;
                    if (Array.isArray(customArgs)) {
                        workerCommand = customArgs;
                    }
                    else {
                        workerCommand = __spreadArray([], args.deps.parseArgsStringToArgv(customArgs, '', ''), true);
                    }
                }
                else {
                    // working on windows with '` and spaces
                    // working on unix with '
                    switch (true) {
                        case result.cliToUse === 'handbrake':
                            workerCommand = __spreadArray([
                                '-i',
                                "".concat(args.inputFileObj._id),
                                '-o',
                                "".concat(cacheFilePath)
                            ], args.deps.parseArgsStringToArgv(result.preset, '', ''), true);
                            cliPath = "".concat(args.handbrakePath);
                            break;
                        case result.cliToUse === 'ffmpeg':
                            workerCommand = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], args.deps.parseArgsStringToArgv(presetSplit[0], '', ''), true), [
                                '-i',
                                "".concat(args.inputFileObj._id)
                            ], false), args.deps.parseArgsStringToArgv(presetSplit[1], '', ''), true), [
                                "".concat(cacheFilePath),
                            ], false);
                            cliPath = "".concat(args.ffmpegPath);
                            break;
                        default:
                    }
                }
                cli = new cliUtils_1.CLI({
                    cli: cliPath,
                    spawnArgs: workerCommand,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: cacheFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 2:
                res = _d.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog("Running ".concat(cliPath, " failed"));
                    throw new Error("Running ".concat(cliPath, " failed"));
                }
                args.logOutcome('tSuc');
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: cacheFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
