"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.getEncoder = exports.getBestNvencDevice = exports.hasEncoder = void 0;
var hasEncoder = function (_a) {
    var ffmpegPath = _a.ffmpegPath, encoder = _a.encoder, inputArgs = _a.inputArgs, filter = _a.filter, args = _a.args;
    return __awaiter(void 0, void 0, void 0, function () {
        var exec, isEnabled, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    exec = require('child_process').exec;
                    isEnabled = false;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var command = "".concat(ffmpegPath, " ").concat(inputArgs.join(' ') || '', " -f lavfi -i color=c=black:s=256x256:d=1:r=30")
                                + " ".concat(filter || '')
                                + " -c:v ".concat(encoder, " -f null /dev/null");
                            args.jobLog("Checking for encoder ".concat(encoder, " with command:"));
                            args.jobLog(command);
                            exec(command, function (
                            // eslint-disable-next-line
                            error) {
                                if (error) {
                                    resolve(false);
                                    return;
                                }
                                resolve(true);
                            });
                        })];
                case 2:
                    isEnabled = _b.sent();
                    args.jobLog("Encoder ".concat(encoder, " is ").concat(isEnabled ? 'enabled' : 'disabled'));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    // eslint-disable-next-line no-console
                    console.log(err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, isEnabled];
            }
        });
    });
};
exports.hasEncoder = hasEncoder;
// credit to UNCode101 for this
var getBestNvencDevice = function (_a) {
    var args = _a.args, nvencDevice = _a.nvencDevice;
    var execSync = require('child_process').execSync;
    var gpu_num = -1;
    var lowest_gpu_util = 100000;
    var result_util = 0;
    var gpu_count = -1;
    var gpu_names = '';
    var gpus_to_exclude = [];
    //  inputs.exclude_gpus === '' ? [] : inputs.exclude_gpus.split(',').map(Number);
    try {
        gpu_names = execSync('nvidia-smi --query-gpu=name --format=csv,noheader');
        gpu_names = gpu_names.toString().trim();
        var gpu_namesArr = gpu_names.split(/\r?\n/);
        /* When nvidia-smi returns an error it contains 'nvidia-smi' in the error
          Example: Linux: nvidia-smi: command not found
                   Windows: 'nvidia-smi' is not recognized as an internal or external command,
                       operable program or batch file. */
        if (!gpu_namesArr[0].includes('nvidia-smi')) {
            gpu_count = gpu_namesArr.length;
        }
    }
    catch (error) {
        args.jobLog('Error in reading nvidia-smi output! \n');
    }
    if (gpu_count > 0) {
        for (var gpui = 0; gpui < gpu_count; gpui += 1) {
            // Check if GPU # is in GPUs to exclude
            if (gpus_to_exclude.includes(String(gpui))) {
                args.jobLog("GPU ".concat(gpui, ": ").concat(gpu_names[gpui], " is in exclusion list, will not be used!\n"));
            }
            else {
                try {
                    var cmd_gpu = "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i ".concat(gpui);
                    result_util = parseInt(execSync(cmd_gpu), 10);
                    if (!Number.isNaN(result_util)) { // != "No devices were found") {
                        args.jobLog("GPU ".concat(gpui, " : Utilization ").concat(result_util, "%\n"));
                        if (result_util < lowest_gpu_util) {
                            gpu_num = gpui;
                            lowest_gpu_util = result_util;
                        }
                    }
                }
                catch (error) {
                    args.jobLog("Error in reading GPU ".concat(gpui, " Utilization\nError: ").concat(error, "\n"));
                }
            }
        }
    }
    if (gpu_num >= 0) {
        // eslint-disable-next-line no-param-reassign
        nvencDevice.inputArgs.push('-hwaccel_device', "".concat(gpu_num));
        // eslint-disable-next-line no-param-reassign
        nvencDevice.outputArgs.push('-gpu', "".concat(gpu_num));
    }
    return nvencDevice;
};
exports.getBestNvencDevice = getBestNvencDevice;
var encoderFilter = function (encoder, targetCodec) {
    if (targetCodec === 'hevc' && (encoder.includes('hevc') || encoder.includes('h265'))) {
        return true;
    }
    if (targetCodec === 'h264' && encoder.includes('h264')) {
        return true;
    }
    if (targetCodec === 'av1' && encoder.includes('av1')) {
        return true;
    }
    return false;
};
var getEncoder = function (_a) {
    var targetCodec = _a.targetCodec, hardwareEncoding = _a.hardwareEncoding, hardwareType = _a.hardwareType, args = _a.args;
    return __awaiter(void 0, void 0, void 0, function () {
        var gpuEncoders, filteredGpuEncoders, idx, _i, filteredGpuEncoders_1, gpuEncoder, _b, enabledDevices, res;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(args.workerType
                        && args.workerType.includes('gpu')
                        && hardwareEncoding && (['hevc', 'h264', 'av1'].includes(targetCodec)))) return [3 /*break*/, 5];
                    gpuEncoders = [
                        {
                            encoder: 'hevc_nvenc',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'cuda',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'hevc_amf',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'hevc_qsv',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'qsv',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'hevc_vaapi',
                            inputArgs: [
                                '-hwaccel',
                                'vaapi',
                                '-hwaccel_device',
                                '/dev/dri/renderD128',
                                '-hwaccel_output_format',
                                'vaapi',
                            ],
                            outputArgs: [],
                            enabled: false,
                            filter: '-vf format=nv12,hwupload',
                        },
                        {
                            encoder: 'hevc_videotoolbox',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'videotoolbox',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        // h264
                        {
                            encoder: 'h264_nvenc',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'cuda',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'h264_amf',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'h264_qsv',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'qsv',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'h264_videotoolbox',
                            enabled: false,
                            inputArgs: [
                                '-hwaccel',
                                'videotoolbox',
                            ],
                            outputArgs: [],
                            filter: '',
                        },
                        // av1
                        {
                            encoder: 'av1_nvenc',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'av1_amf',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'av1_qsv',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                        {
                            encoder: 'av1_vaapi',
                            enabled: false,
                            inputArgs: [],
                            outputArgs: [],
                            filter: '',
                        },
                    ];
                    filteredGpuEncoders = gpuEncoders.filter(function (device) { return encoderFilter(device.encoder, targetCodec); });
                    if (hardwareEncoding && hardwareType !== 'auto') {
                        idx = filteredGpuEncoders.findIndex(function (device) { return device.encoder.includes(hardwareType); });
                        if (idx === -1) {
                            throw new Error("Could not find encoder ".concat(targetCodec, " for hardware ").concat(hardwareType));
                        }
                        return [2 /*return*/, __assign(__assign({}, filteredGpuEncoders[idx]), { isGpu: true, enabledDevices: [] })];
                    }
                    args.jobLog(JSON.stringify({ filteredGpuEncoders: filteredGpuEncoders }));
                    _i = 0, filteredGpuEncoders_1 = filteredGpuEncoders;
                    _c.label = 1;
                case 1:
                    if (!(_i < filteredGpuEncoders_1.length)) return [3 /*break*/, 4];
                    gpuEncoder = filteredGpuEncoders_1[_i];
                    // eslint-disable-next-line no-await-in-loop
                    _b = gpuEncoder;
                    return [4 /*yield*/, (0, exports.hasEncoder)({
                            ffmpegPath: args.ffmpegPath,
                            encoder: gpuEncoder.encoder,
                            inputArgs: gpuEncoder.inputArgs,
                            filter: gpuEncoder.filter,
                            args: args,
                        })];
                case 2:
                    // eslint-disable-next-line no-await-in-loop
                    _b.enabled = _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    enabledDevices = filteredGpuEncoders.filter(function (device) { return device.enabled === true; });
                    args.jobLog(JSON.stringify({ enabledDevices: enabledDevices }));
                    if (enabledDevices.length > 0) {
                        if (enabledDevices[0].encoder.includes('nvenc')) {
                            res = (0, exports.getBestNvencDevice)({
                                args: args,
                                nvencDevice: enabledDevices[0],
                            });
                            return [2 /*return*/, __assign(__assign({}, res), { isGpu: true, enabledDevices: enabledDevices })];
                        }
                        return [2 /*return*/, {
                                encoder: enabledDevices[0].encoder,
                                inputArgs: enabledDevices[0].inputArgs,
                                outputArgs: enabledDevices[0].outputArgs,
                                isGpu: true,
                                enabledDevices: enabledDevices,
                            }];
                    }
                    _c.label = 5;
                case 5:
                    if (targetCodec === 'hevc') {
                        return [2 /*return*/, {
                                encoder: 'libx265',
                                inputArgs: [],
                                outputArgs: [],
                                isGpu: false,
                                enabledDevices: [],
                            }];
                    }
                    if (targetCodec === 'h264') {
                        return [2 /*return*/, {
                                encoder: 'libx264',
                                inputArgs: [],
                                outputArgs: [],
                                isGpu: false,
                                enabledDevices: [],
                            }];
                    }
                    if (targetCodec === 'av1') {
                        return [2 /*return*/, {
                                encoder: 'libsvtav1',
                                inputArgs: [],
                                outputArgs: [],
                                isGpu: false,
                                enabledDevices: [],
                            }];
                    }
                    return [2 /*return*/, {
                            encoder: targetCodec,
                            inputArgs: [],
                            outputArgs: [],
                            isGpu: false,
                            enabledDevices: [],
                        }];
            }
        });
    });
};
exports.getEncoder = getEncoder;
