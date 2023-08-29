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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Execute',
    description: 'Execute the created FFmpeg command',
    style: {
        borderColor: 'green',
    },
    tags: 'video',
    isStartPlugin: false,
    sidebarPosition: 2,
    icon: 'faPlay',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var getOuputStreamIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (!stream.removed) {
            index += 1;
        }
        if (streams[idx].index === stream.index) {
            break;
        }
    }
    return index;
};
var getOuputStreamTypeIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (!stream.removed && streams[idx].codec_type === stream.codec_type) {
            index += 1;
        }
        if (streams[idx].index === stream.index) {
            break;
        }
    }
    return index;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, cliArgs, inputArgs, _a, shouldProcess, streams, _loop_1, i, idx, outputFilePath, cli, res;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                cliArgs = [];
                cliArgs.push('-y');
                cliArgs.push('-i');
                cliArgs.push(args.inputFileObj._id);
                inputArgs = [];
                _a = args.variables.ffmpegCommand, shouldProcess = _a.shouldProcess, streams = _a.streams;
                streams = streams.filter(function (stream) {
                    if (stream.removed) {
                        shouldProcess = true;
                    }
                    return !stream.removed;
                });
                _loop_1 = function (i) {
                    var stream = streams[i];
                    stream.outputArgs = stream.outputArgs.map(function (arg) {
                        if (arg.includes('{outputIndex}')) {
                            // eslint-disable-next-line no-param-reassign
                            arg = arg.replace('{outputIndex}', String(getOuputStreamIndex(streams, stream)));
                        }
                        if (arg.includes('{outputTypeIndex}')) {
                            // eslint-disable-next-line no-param-reassign
                            arg = arg.replace('{outputTypeIndex}', String(getOuputStreamTypeIndex(streams, stream)));
                        }
                        return arg;
                    });
                    cliArgs.push.apply(cliArgs, stream.mapArgs);
                    if (stream.outputArgs.length === 0) {
                        cliArgs.push("-c:".concat(getOuputStreamIndex(streams, stream)), 'copy');
                    }
                    else {
                        cliArgs.push.apply(cliArgs, stream.outputArgs);
                    }
                    inputArgs.push.apply(inputArgs, stream.inputArgs);
                };
                for (i = 0; i < streams.length; i += 1) {
                    _loop_1(i);
                }
                if (!shouldProcess) {
                    args.jobLog('No need to process file, already as required');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                idx = cliArgs.indexOf('-i');
                cliArgs.splice.apply(cliArgs, __spreadArray([idx, 0], inputArgs, false));
                outputFilePath = "".concat(args.workDir, "/tempFile_").concat(new Date().getTime(), ".").concat(args.variables.ffmpegCommand.container);
                cliArgs.push(outputFilePath);
                args.jobLog('Processing file');
                args.jobLog(JSON.stringify({
                    cliArgs: cliArgs,
                    outputFilePath: outputFilePath,
                }));
                args.updateWorker({
                    CLIType: args.ffmpegPath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _b.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('FFmpeg failed');
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
