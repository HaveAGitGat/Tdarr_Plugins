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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Run CLI',
    description: 'Choose a CLI and custom arguments to run',
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
            label: 'Use Custom CLI Path?',
            name: 'useCustomCliPath',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to use a custom CLI path',
        },
        {
            label: 'CLI',
            name: 'userCli',
            type: 'string',
            defaultValue: 'mkvmerge',
            inputUI: {
                type: 'dropdown',
                options: [
                    'mkvmerge',
                    'mkvpropedit',
                ],
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useCustomCliPath',
                                    value: 'false',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'CLI to run',
        },
        {
            label: 'Custom CLI Path',
            name: 'customCliPath',
            type: 'string',
            defaultValue: '/usr/bin/mkvmerge',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useCustomCliPath',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the path to the CLI to run',
        },
        {
            label: 'Does Command Create Output File?',
            name: 'doesCommandCreateOutputFile',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
                onSelect: {
                    false: {
                        outputFileBecomesWorkingFile: 'false',
                    },
                },
            },
            tooltip: 'Toggle this on if the command creates an output file.',
        },
        {
            label: 'Output File Path',
            name: 'userOutputFilePath',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '${cacheDir}/${fileName}.{{{args.inputFileObj.container}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'doesCommandCreateOutputFile',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\n      This path can be accessed using ${outputFilePath} in the \"CLI Arguments\" input below.\n\n      \\n\n      ${cacheDir} is a special variable that points to the Tdarr worker cache directory.\n\n      \\n \n      ${fileName} is a special variable for the filename without extension.\n      \n      \\nExample\\n\n      ${cacheDir}/${fileName}.{{{args.inputFileObj.container}}}\n      ",
        },
        {
            label: 'CLI Arguments',
            name: 'cliArguments',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '-o "${outputFilePath}" "{{{args.inputFileObj._id}}}"',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify arguments to pass to the CLI. \n      Normal variable templating with {{{}}} applies but ${outputFilePath} is a special\n      variable from the \"Output File Path\" input above.\n\n      \\nExample\\n\n      -o \"${outputFilePath}\" \"{{{args.inputFileObj._id}}}\"\n      ",
        },
        {
            label: 'Output File Becomes Working File?',
            name: 'outputFileBecomesWorkingFile',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'doesCommandCreateOutputFile',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Toggle this on to make the output file become the working file for the next plugin.',
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
    var lib, userCli, useCustomCliPath, customCliPath, cliPath, outputFileBecomesWorkingFile, userOutputFilePath, cliArguments, cacheDir, fileName, cliArgs, availableCli, msg, cli, res, msg;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                userCli = String(args.inputs.userCli);
                useCustomCliPath = args.inputs.useCustomCliPath;
                customCliPath = String(args.inputs.customCliPath);
                cliPath = '';
                outputFileBecomesWorkingFile = args.inputs.outputFileBecomesWorkingFile;
                userOutputFilePath = String(args.inputs.userOutputFilePath);
                cliArguments = String(args.inputs.cliArguments);
                // eslint-disable-next-line no-template-curly-in-string
                if (cliArguments.includes('${outputFilePath}')) {
                    // eslint-disable-next-line no-template-curly-in-string
                    if (userOutputFilePath.includes('${cacheDir}')) {
                        cacheDir = (0, fileUtils_1.getPluginWorkDir)(args);
                        userOutputFilePath = userOutputFilePath.replace(/\${cacheDir}/g, cacheDir);
                    }
                    // eslint-disable-next-line no-template-curly-in-string
                    if (userOutputFilePath.includes('${fileName}')) {
                        fileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
                        userOutputFilePath = userOutputFilePath.replace(/\${fileName}/g, fileName);
                    }
                    cliArguments = cliArguments.replace(/\${outputFilePath}/g, userOutputFilePath);
                }
                cliArgs = __spreadArray([], args.deps.parseArgsStringToArgv(cliArguments, '', ''), true);
                availableCli = {
                    mkvpropedit: args.mkvpropeditPath,
                    mkvmerge: 'mkvmerge',
                };
                if (useCustomCliPath) {
                    cliPath = customCliPath;
                }
                else {
                    if (!availableCli[userCli]) {
                        msg = "CLI ".concat(userCli, " not available to run in this plugin");
                        args.jobLog(msg);
                        throw new Error(msg);
                    }
                    cliPath = availableCli[userCli];
                }
                cli = new cliUtils_1.CLI({
                    cli: cliPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: userOutputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    msg = "Running ".concat(cliPath, " failed");
                    args.jobLog(msg);
                    throw new Error(msg);
                }
                return [2 /*return*/, {
                        outputFileObj: outputFileBecomesWorkingFile ? {
                            _id: userOutputFilePath,
                        }
                            : args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
