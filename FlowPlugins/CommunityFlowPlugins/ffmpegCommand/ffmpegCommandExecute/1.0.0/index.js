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
var utils_1 = require("../../../../FlowHelpers/1.0.0/utils");
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
            tooltip: 'File is 480p',
        },
        {
            number: 2,
            tooltip: 'File is 576p',
        },
    ],
}); };
exports.details = details;
var getEncoder = function (codec) {
    switch (codec) {
        case 'h264':
            return 'libx264';
        case 'hevc':
            return 'libx265';
        default:
            return codec;
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, cliArgs, shouldProcess, outputFilePath, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                cliArgs = [];
                cliArgs.push('-y');
                cliArgs.push('-i');
                cliArgs.push(args.inputFileObj._id);
                shouldProcess = false;
                // @ts-expect-error type
                args.variables.ffmpegCommand.streams.forEach(function (stream) {
                    if (!stream.removed) {
                        cliArgs.push('-map');
                        cliArgs.push("0:".concat(stream.index));
                        cliArgs.push("-c:".concat(stream.index));
                        args.jobLog(JSON.stringify({ stream: stream }));
                        if (args.inputs.forceProcess || stream.codec_name !== stream.targetCodec) {
                            shouldProcess = true;
                            cliArgs.push(getEncoder(stream.targetCodec));
                        }
                        else {
                            cliArgs.push('copy');
                        }
                    }
                });
                if (!shouldProcess) {
                    args.jobLog('No need to process file, already as required');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                outputFilePath = "".concat(args.workDir, "/tempFile.").concat(args.variables.ffmpegCommand.container);
                cliArgs.push(outputFilePath);
                // @ts-expect-error type
                args.deps.fsextra.ensureDirSync(args.workDir);
                args.jobLog('Processing file');
                args.jobLog(JSON.stringify({
                    cliArgs: cliArgs,
                    outputFilePath: outputFilePath,
                }));
                cli = new utils_1.CLI({
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
                res = _a.sent();
                if (!args.logFullCliOutput) {
                    args.jobLog(res.errorLogFull.slice(-1000).join(''));
                }
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
