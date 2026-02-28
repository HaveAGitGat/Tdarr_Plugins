"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var hardwareUtils_1 = require("../../../../FlowHelpers/1.0.0/hardwareUtils");
/* eslint-disable no-param-reassign */
var getHwaccelArgs = function (gpuAcceleration, isGpuWorker, args) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, hardwareType, result, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // CPU worker: never use GPU, regardless of selection
                if (!isGpuWorker) {
                    if (gpuAcceleration === 'none') {
                        args.jobLog('GPU acceleration: none selected, using CPU');
                    }
                    else if (gpuAcceleration === 'auto') {
                        args.jobLog('GPU acceleration: auto selected but worker is CPU, using CPU');
                    }
                    else {
                        args.jobLog("GPU acceleration: '".concat(gpuAcceleration, "' selected but worker is CPU")
                            + ' — GPU is only available on transcode GPU workers, using CPU');
                    }
                    return [2 /*return*/, []];
                }
                _a = gpuAcceleration;
                switch (_a) {
                    case 'none': return [3 /*break*/, 1];
                    case 'dxva2': return [3 /*break*/, 2];
                    case 'd3d11va': return [3 /*break*/, 3];
                    case 'auto': return [3 /*break*/, 4];
                }
                return [3 /*break*/, 4];
            case 1:
                args.jobLog('GPU acceleration: none selected, using CPU');
                return [2 /*return*/, []];
            case 2:
                args.jobLog('GPU acceleration: using DXVA2 (Windows hardware decoding)');
                return [2 /*return*/, ['-hwaccel', 'dxva2', '-hwaccel_output_format', 'dxva2_vld']];
            case 3:
                args.jobLog('GPU acceleration: using D3D11VA (Windows hardware decoding)');
                return [2 /*return*/, ['-hwaccel', 'd3d11va', '-hwaccel_output_format', 'd3d11']];
            case 4:
                hardwareType = gpuAcceleration === 'auto' ? 'auto' : gpuAcceleration;
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, (0, hardwareUtils_1.getEncoder)({
                        targetCodec: 'hevc',
                        hardwareEncoding: true,
                        hardwareType: hardwareType,
                        args: args,
                    })];
            case 6:
                result = _b.sent();
                if (result.isGpu && result.inputArgs.length > 0) {
                    args.jobLog("GPU acceleration: using ".concat(gpuAcceleration)
                        + " (hwaccel: ".concat(result.inputArgs.join(' '), ")"));
                    return [2 /*return*/, result.inputArgs];
                }
                if (gpuAcceleration === 'auto') {
                    args.jobLog('GPU acceleration: auto selected on GPU worker'
                        + ' but no compatible GPU detected, falling back to CPU');
                }
                else {
                    args.jobLog("GPU acceleration: '".concat(gpuAcceleration, "' selected")
                        + ' but detection returned no GPU, falling back to CPU');
                }
                return [3 /*break*/, 8];
            case 7:
                err_1 = _b.sent();
                args.jobLog("GPU acceleration error: ".concat(err_1, ". Falling back to CPU."));
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/, []];
        }
    });
}); };
var details = function () { return ({
    name: 'Run Health Check',
    description: 'Run a quick health check using HandBrake or a thorough health check using FFmpeg',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Type',
            name: 'type',
            type: 'string',
            defaultValue: 'quick',
            inputUI: {
                type: 'dropdown',
                options: [
                    'quick',
                    'thorough',
                ],
            },
            tooltip: 'Specify the container to use',
        },
        {
            label: 'GPU Acceleration',
            name: 'gpuAcceleration',
            type: 'string',
            defaultValue: 'auto',
            inputUI: {
                type: 'dropdown',
                options: [
                    'auto',
                    'none',
                    'nvenc',
                    'qsv',
                    'vaapi',
                    'videotoolbox',
                    'rkmpp',
                    'dxva2',
                    'd3d11va',
                ],
            },
            tooltip: 'Specify GPU acceleration for thorough health checks '
                + '(FFmpeg only). auto: detect available GPU | nvenc: NVIDIA '
                + '| qsv: Intel | vaapi: Linux | dxva2/d3d11va: Windows',
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
    var lib, type, gpuAcceleration, outputFilePath, cliPath, cliArgs, isGpuWorker, hwaccelArgs, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                type = String(args.inputs.type);
                gpuAcceleration = String(args.inputs.gpuAcceleration);
                args.jobLog("Running health check of type ".concat(type));
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id))
                    + ".".concat((0, fileUtils_1.getContainer)(args.inputFileObj._id));
                cliPath = args.handbrakePath;
                cliArgs = [
                    '-i',
                    args.inputFileObj._id,
                    '-o',
                    outputFilePath,
                    '--scan',
                ];
                if (!(type === 'thorough')) return [3 /*break*/, 2];
                cliPath = args.ffmpegPath;
                cliArgs = [
                    '-stats',
                    '-v',
                    'error',
                ];
                isGpuWorker = !!(args.workerType && args.workerType.includes('gpu'));
                return [4 /*yield*/, getHwaccelArgs(gpuAcceleration, isGpuWorker, args)];
            case 1:
                hwaccelArgs = _a.sent();
                cliArgs.push.apply(cliArgs, hwaccelArgs);
                cliArgs.push('-i', args.inputFileObj._id, '-f', 'null', '-max_muxing_queue_size', '9999', outputFilePath);
                _a.label = 2;
            case 2:
                cli = new cliUtils_1.CLI({
                    cli: cliPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 3:
                res = _a.sent();
                if (!(typeof args.updateStat !== 'undefined')) return [3 /*break*/, 5];
                return [4 /*yield*/, args.updateStat(args.originalLibraryFile.DB, 'totalHealthCheckCount', 1)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running CLI failed');
                    args.logOutcome('hErr');
                    throw new Error('Running CLI failed');
                }
                args.logOutcome('hSuc');
                // will cause item to go into the health check success table
                args.variables.healthCheck = 'Success';
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
