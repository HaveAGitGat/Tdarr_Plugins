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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = exports.getFFmpegVar = void 0;
var fs_1 = __importDefault(require("fs"));
var cliParsers_1 = require("./cliParsers");
var fileUtils_1 = require("./fileUtils");
var fancyTimeFormat = function (time) {
    // Hours, minutes and seconds
    // eslint-disable-next-line no-bitwise
    var hrs = ~~(time / 3600);
    // eslint-disable-next-line no-bitwise
    var mins = ~~((time % 3600) / 60);
    // eslint-disable-next-line no-bitwise
    var secs = ~~time % 60;
    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = '';
    //  if (hrs > 0) {
    ret += "".concat(hrs, ":").concat(mins < 10 ? '0' : '');
    // }
    ret += "".concat(mins, ":").concat(secs < 10 ? '0' : '');
    ret += "".concat(secs);
    return ret;
};
// frame=  889 fps=106 q=26.0 Lsize=   25526kB time=00:00:35.69 bitrate=5858.3kbits/s speed=4.25x
var getFFmpegVar = function (_a) {
    var str = _a.str, variable = _a.variable;
    if (typeof str !== 'string') {
        return '';
    }
    var idx = str.indexOf(variable);
    var out = '';
    var initSpacesEnded = false;
    if (idx >= 0) {
        var startIdx = idx + variable.length + 1;
        for (var i = startIdx; i < str.length; i += 1) {
            if (initSpacesEnded === true && str[i] === ' ') {
                break;
            }
            else if (initSpacesEnded === false && str[i] !== ' ') {
                initSpacesEnded = true;
            }
            if (initSpacesEnded === true && str[i] !== ' ') {
                out += str[i];
            }
        }
    }
    return out;
};
exports.getFFmpegVar = getFFmpegVar;
var CLI = /** @class */ (function () {
    function CLI(config) {
        var _this = this;
        // @ts-expect-error init
        this.config = {};
        this.progAVG = [];
        this.oldOutSize = 0;
        this.oldEstSize = 0;
        this.oldProgress = 0;
        this.lastProgCheck = 0;
        this.hbPass = 0;
        this.cancelled = false;
        this.startTime = new Date().getTime();
        this.updateETA = function (perc) { return __awaiter(_this, void 0, void 0, function () {
            var n, secsSinceLastCheck, eta, sum, avg, estSize, outputFileSizeInGbytes, singleFileSize, err_1, secondsSinceStart, _a, compareMethod, thresholdPerc_1, checkDelaySeconds, inputFileSize, inputFileSizeInGbytes_1, cancel, ratio, ratio;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(perc > 0)) return [3 /*break*/, 6];
                        if (!(this.lastProgCheck === 0)) return [3 /*break*/, 1];
                        this.lastProgCheck = new Date().getTime();
                        this.oldProgress = perc;
                        return [3 /*break*/, 6];
                    case 1:
                        if (!(perc !== this.oldProgress)) return [3 /*break*/, 6];
                        n = new Date().getTime();
                        secsSinceLastCheck = (n - this.lastProgCheck) / 1000;
                        if (!(secsSinceLastCheck > 1)) return [3 /*break*/, 6];
                        eta = Math.round((100 / (perc - this.oldProgress)) * secsSinceLastCheck);
                        // eta remaining
                        eta *= ((100 - perc) / 100);
                        this.progAVG.push(eta);
                        sum = this.progAVG.reduce(
                        // eslint-disable-next-line
                        function (previous, current) { return (current += previous); });
                        avg = sum / this.progAVG.length;
                        estSize = 0;
                        outputFileSizeInGbytes = void 0;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, fileUtils_1.fileExists)(this.config.outputFilePath)];
                    case 3:
                        if (_c.sent()) {
                            singleFileSize = fs_1.default.statSync(this.config.outputFilePath);
                            // @ts-expect-error type
                            singleFileSize = singleFileSize.size;
                            // @ts-expect-error type
                            outputFileSizeInGbytes = singleFileSize / (1024 * 1024 * 1024);
                            if (outputFileSizeInGbytes !== this.oldOutSize) {
                                this.oldOutSize = outputFileSizeInGbytes;
                                estSize = outputFileSizeInGbytes
                                    + ((100 - perc) / perc) * outputFileSizeInGbytes;
                                this.oldEstSize = estSize;
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _c.sent();
                        // eslint-disable-next-line no-console
                        console.log(err_1);
                        return [3 /*break*/, 5];
                    case 5:
                        this.config.updateWorker({
                            ETA: fancyTimeFormat(avg),
                            outputFileSizeInGbytes: outputFileSizeInGbytes === undefined ? 0 : outputFileSizeInGbytes,
                            estSize: this.oldEstSize === undefined ? 0 : this.oldEstSize,
                        });
                        if (this.progAVG.length > 30) {
                            this.progAVG.splice(0, 1);
                        }
                        this.lastProgCheck = n;
                        this.oldProgress = perc;
                        secondsSinceStart = (new Date().getTime() - this.startTime) / 1000;
                        // live size compare
                        if ((_b = this.config.args.variables.liveSizeCompare) === null || _b === void 0 ? void 0 : _b.enabled) {
                            _a = this.config.args.variables.liveSizeCompare, compareMethod = _a.compareMethod, thresholdPerc_1 = _a.thresholdPerc, checkDelaySeconds = _a.checkDelaySeconds;
                            if (secondsSinceStart > checkDelaySeconds) {
                                inputFileSize = this.config.inputFileObj.file_size;
                                inputFileSizeInGbytes_1 = inputFileSize / 1024;
                                cancel = function (ratio) {
                                    _this.config.jobLog("Input file size: ".concat(inputFileSizeInGbytes_1, "GB"));
                                    _this.config.jobLog("Ratio: ".concat(ratio, "%"));
                                    _this.config.jobLog("Ratio is greater than threshold: ".concat(thresholdPerc_1, "%, cancelling job"));
                                    _this.cancelled = true;
                                    // @ts-expect-error must exist to be here
                                    _this.config.args.variables.liveSizeCompare.error = true;
                                    _this.killThread();
                                };
                                if (compareMethod === 'estimatedFinalSize'
                                    && estSize !== undefined
                                    && estSize > 0) {
                                    ratio = (estSize / inputFileSizeInGbytes_1) * 100;
                                    if (ratio > thresholdPerc_1) {
                                        this.config.jobLog("Estimated final size: ".concat(estSize, "GB"));
                                        cancel(ratio);
                                    }
                                }
                                else if (compareMethod === 'currentSize'
                                    && outputFileSizeInGbytes !== undefined
                                    && outputFileSizeInGbytes > 0) {
                                    ratio = (outputFileSizeInGbytes / inputFileSizeInGbytes_1) * 100;
                                    if (ratio > thresholdPerc_1) {
                                        this.config.jobLog("Current output size: ".concat(outputFileSizeInGbytes, "GB"));
                                        cancel(ratio);
                                    }
                                }
                            }
                        }
                        _c.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.parseOutput = function (data) {
            var _a, _b, _c, _d, _e, _f, _g;
            var str = "".concat(data);
            //
            if (_this.config.logFullCliOutput === true) {
                _this.config.jobLog(str);
            }
            if (_this.config.cli.toLowerCase().includes('handbrake')) {
                if (str.includes('task 1 of 2')) {
                    _this.hbPass = 1;
                }
                else if (str.includes('task 2 of 2')) {
                    _this.hbPass = 2;
                }
                var percentage = (0, cliParsers_1.handbrakeParser)({
                    str: str,
                    hbPass: _this.hbPass,
                });
                if (percentage > 0) {
                    void _this.updateETA(percentage);
                    _this.config.updateWorker({
                        percentage: percentage,
                    });
                }
                var fps = (0, cliParsers_1.getHandBrakeFps)({
                    str: str,
                });
                if (fps > 0) {
                    _this.config.updateWorker({
                        fps: fps,
                    });
                }
            }
            else if (_this.config.cli.toLowerCase().includes('ffmpeg')) {
                var n = str.indexOf('fps');
                var shouldUpdate = str.length >= 6 && n >= 6;
                var fps = parseInt((0, exports.getFFmpegVar)({
                    str: str,
                    variable: 'fps',
                }), 10);
                var frameCount = 0;
                try {
                    // @ts-expect-error type
                    var frameCountTmp = (_a = _this.config.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.streams.filter(function (row) { return row.codec_type === 'video'; })[0].nb_frames;
                    if (frameCountTmp
                        // @ts-expect-error type
                        && !isNaN(frameCountTmp)) { // eslint-disable-line no-restricted-globals
                        // @ts-expect-error type
                        frameCount = frameCountTmp;
                    }
                }
                catch (err) {
                    // err
                }
                var percentage = (0, cliParsers_1.ffmpegParser)({
                    str: str,
                    frameCount: frameCount,
                    videoFrameRate: (_c = (_b = _this.config.inputFileObj) === null || _b === void 0 ? void 0 : _b.meta) === null || _c === void 0 ? void 0 : _c.VideoFrameRate,
                    ffprobeDuration: (_e = (_d = _this.config.inputFileObj.ffProbeData) === null || _d === void 0 ? void 0 : _d.format) === null || _e === void 0 ? void 0 : _e.duration,
                    metaDuration: (_g = (_f = _this.config.inputFileObj) === null || _f === void 0 ? void 0 : _f.meta) === null || _g === void 0 ? void 0 : _g.Duration,
                });
                if (shouldUpdate === true && fps > 0) {
                    _this.config.updateWorker({
                        fps: fps,
                    });
                }
                if (percentage > 0) {
                    void _this.updateETA(percentage);
                    _this.config.updateWorker({
                        percentage: percentage,
                    });
                }
            }
            else if (_this.config.cli.toLowerCase().includes('editready')) {
                var percentage = (0, cliParsers_1.editreadyParser)({
                    str: str,
                });
                if (percentage > 0) {
                    void _this.updateETA(percentage);
                    _this.config.updateWorker({
                        percentage: percentage,
                    });
                }
            }
        };
        this.killThread = function () {
            var killArray = [
                'SIGKILL',
                'SIGHUP',
                'SIGTERM',
                'SIGINT',
            ];
            try {
                _this.thread.kill();
            }
            catch (err) {
                // err
            }
            killArray.forEach(function (com) {
                try {
                    _this.thread.kill(com);
                }
                catch (err) {
                    // err
                }
            });
        };
        this.runCli = function () { return __awaiter(_this, void 0, void 0, function () {
            var childProcess, errorLogFull, exitHandler, cliExitCode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        childProcess = require('child_process');
                        errorLogFull = [];
                        this.config.jobLog("Running ".concat(this.config.cli, " ").concat(this.config.spawnArgs.join(' ')));
                        exitHandler = function () {
                            if (_this.thread) {
                                try {
                                    // eslint-disable-next-line no-console
                                    console.log('Main thread exiting, cleaning up running CLI');
                                    _this.killThread();
                                }
                                catch (err) {
                                    // eslint-disable-next-line no-console
                                    console.log('Error running cliUtils on Exit function');
                                    // eslint-disable-next-line no-console
                                    console.log(err);
                                }
                            }
                        };
                        process.on('exit', exitHandler);
                        return [4 /*yield*/, new Promise(function (resolve) {
                                try {
                                    var opts = _this.config.spawnOpts || {};
                                    var spawnArgs = _this.config.spawnArgs.map(function (row) { return row.trim(); }).filter(function (row) { return row !== ''; });
                                    _this.thread = childProcess.spawn(_this.config.cli, spawnArgs, opts);
                                    _this.thread.stdout.on('data', function (data) {
                                        errorLogFull.push(data.toString());
                                        _this.parseOutput(data);
                                    });
                                    _this.thread.stderr.on('data', function (data) {
                                        // eslint-disable-next-line no-console
                                        errorLogFull.push(data.toString());
                                        _this.parseOutput(data);
                                    });
                                    _this.thread.on('error', function () {
                                        // catches execution error (bad file)
                                        // eslint-disable-next-line no-console
                                        console.log("Error executing binary: ".concat(_this.config.cli));
                                        _this.config.jobLog("Error executing binary: ".concat(_this.config.cli));
                                        resolve(1);
                                    });
                                    // thread.stdout.pipe(process.stdout);
                                    // thread.stderr.pipe(process.stderr);
                                    _this.thread.on('close', function (code) {
                                        if (code !== 0) {
                                            // eslint-disable-next-line no-console
                                            console.log("CLI error code: ".concat(code));
                                            _this.config.jobLog("CLI error code: ".concat(code));
                                        }
                                        resolve(code);
                                    });
                                }
                                catch (err) {
                                    // catches execution error (no file)
                                    // eslint-disable-next-line no-console
                                    console.log("Error executing binary: ".concat(_this.config.cli, ": ").concat(err));
                                    _this.config.jobLog("Error executing binary: ".concat(_this.config.cli, ": ").concat(err));
                                    resolve(1);
                                }
                            })];
                    case 1:
                        cliExitCode = _a.sent();
                        process.removeListener('exit', exitHandler);
                        this.thread = undefined;
                        if (!this.config.logFullCliOutput) {
                            this.config.jobLog(errorLogFull.slice(-1000).join(''));
                        }
                        if (this.cancelled) {
                            cliExitCode = 1;
                        }
                        this.config.jobLog("CLI ".concat(this.config.cli, " exited with code: ").concat(cliExitCode));
                        return [2 /*return*/, {
                                cliExitCode: cliExitCode,
                                errorLogFull: errorLogFull,
                            }];
                }
            });
        }); };
        this.config = config;
    }
    return CLI;
}());
exports.CLI = CLI;
