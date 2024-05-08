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
var fs_1 = require("fs");
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'HandBrake Custom Arguments',
    description: 'HandBrake Custom Arguments',
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
            label: 'Custom Arguments',
            name: 'customArguments',
            type: 'string',
            defaultValue: '-Z "Fast 1080p30" --all-subtitles',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify HandBrake arguments',
        },
        {
            label: 'JSON Preset',
            name: 'jsonPreset',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Paste a HandBrake JSON preset here. Leave blank to disable.',
        },
        {
            label: 'Container',
            name: 'container',
            type: 'string',
            defaultValue: 'mkv',
            inputUI: {
                type: 'dropdown',
                options: [
                    'original',
                    'mkv',
                    'mp4',
                    'm4v',
                    'avi',
                    'mov',
                    'mpg',
                    'mpeg',
                ],
            },
            tooltip: 'Specify output container',
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, customArguments, container, outputFilePath, presetString, cliArgs, presetPath, preset, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                customArguments = String(args.inputs.customArguments);
                container = String(args.inputs.container);
                if (container === 'original') {
                    container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                }
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(container);
                presetString = String(args.inputs.jsonPreset);
                cliArgs = [
                    '-i',
                    "".concat(args.inputFileObj._id),
                    '-o',
                    "".concat(outputFilePath),
                ];
                presetPath = "".concat(args.workDir, "/preset.json");
                if (!(presetString.trim() !== '')) return [3 /*break*/, 2];
                preset = JSON.parse(presetString);
                return [4 /*yield*/, fs_1.promises.writeFile(presetPath, JSON.stringify(preset, null, 2))];
            case 1:
                _a.sent();
                cliArgs.push('--preset-import-file');
                cliArgs.push(presetPath);
                cliArgs.push('-Z');
                cliArgs.push(preset.PresetList[0].PresetName);
                return [3 /*break*/, 3];
            case 2:
                cliArgs.push.apply(cliArgs, args.deps.parseArgsStringToArgv(customArguments, '', ''));
                _a.label = 3;
            case 3:
                args.updateWorker({
                    CLIType: args.handbrakePath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: args.handbrakePath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                });
                return [4 /*yield*/, cli.runCli()];
            case 4:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running HandBrake failed');
                    throw new Error('Running HandBrake failed');
                }
                args.logOutcome('tSuc');
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
