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
var automationUtils_1 = require("../../../../FlowHelpers/1.0.0/automationUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
// Sets ffmpeg/HandBrake process priority (cross-platform).
var setTdarrProcessPriority = function (priority, platform, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
childProcess, jobLog) {
    try {
        var cmdFFmpeg = '';
        var cmdHandBrake = '';
        if (platform === 'win32') {
            var priorityClass = 'Normal';
            switch (priority) {
                case 'high':
                    priorityClass = 'High';
                    break;
                case 'above normal':
                    priorityClass = 'AboveNormal';
                    break;
                case 'normal':
                    priorityClass = 'Normal';
                    break;
                case 'below normal':
                    priorityClass = 'BelowNormal';
                    break;
                case 'low':
                    priorityClass = 'Idle';
                    break;
                default:
                    priorityClass = 'Normal';
                    break;
            }
            // eslint-disable-next-line max-len
            cmdFFmpeg = "powershell -Command \"if (Get-Process -Name 'ffmpeg' -ErrorAction SilentlyContinue) { Get-Process -Name 'ffmpeg' | ForEach-Object { $_.PriorityClass = '".concat(priorityClass, "' } }\"");
            // eslint-disable-next-line max-len
            cmdHandBrake = "powershell -Command \"if (Get-Process -Name 'HandBrakeCLI' -ErrorAction SilentlyContinue) { Get-Process -Name 'HandBrakeCLI' | ForEach-Object { $_.PriorityClass = '".concat(priorityClass, "' } }\"");
        }
        else {
            var niceVal = 0;
            switch (priority) {
                case 'high':
                    niceVal = -15;
                    break;
                case 'above normal':
                    niceVal = -10;
                    break;
                case 'normal':
                    niceVal = 0;
                    break;
                case 'below normal':
                    niceVal = 10;
                    break;
                case 'low':
                    niceVal = 19;
                    break;
                default:
                    niceVal = 0;
                    break;
            }
            cmdFFmpeg = "for p in $(pgrep ^ffmpeg$ || true); do renice -n ".concat(niceVal, " -p $p; done");
            cmdHandBrake = "for p in $(pgrep ^HandBrakeCLI$ || true); do renice -n ".concat(niceVal, " -p $p; done");
        }
        childProcess.exec(cmdFFmpeg, { windowsHide: true }, function (err) {
            if (err)
                jobLog("Error setting ffmpeg priority: ".concat(err));
        });
        childProcess.exec(cmdHandBrake, { windowsHide: true }, function (err) {
            if (err)
                jobLog("Error setting HandBrake priority: ".concat(err));
        });
    }
    catch (err) {
        jobLog("Error setting process priority: ".concat(err));
    }
};
var details = function () { return ({
    name: 'Set GPU Node to Low Priority When Non-Tdarr NVENC Detected',
    description: 'Polls nvidia-smi for non-Tdarr NVENC encoder processes.'
        + ' When detected, sets ffmpeg/HandBrake to low process priority.'
        + ' Restores priority when non-Tdarr NVENC processes stop.'
        + ' Exits when no other Tdarr workers are running (confirmed 3 times).',
    style: {
        borderColor: '#76B900',
    },
    tags: 'automations,gpu,nvenc,priority,nvidia',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.64.01',
    sidebarPosition: -1,
    icon: 'faMicrochip',
    inputs: [
        {
            label: 'Poll Interval (seconds)',
            name: 'pollIntervalSeconds',
            type: 'number',
            defaultValue: '15',
            inputUI: {
                type: 'text',
            },
            tooltip: 'How often to check for non-Tdarr NVENC processes.',
        },
        {
            label: 'Low Priority',
            name: 'lowPriority',
            type: 'string',
            defaultValue: 'low',
            inputUI: {
                type: 'dropdown',
                options: ['low', 'below normal'],
            },
            tooltip: 'Priority to set when non-Tdarr NVENC processes are detected.',
        },
        {
            label: 'Normal Priority',
            name: 'normalPriority',
            type: 'string',
            defaultValue: 'normal',
            inputUI: {
                type: 'dropdown',
                options: ['normal', 'above normal', 'high'],
            },
            tooltip: 'Priority to restore when non-Tdarr NVENC processes stop.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'No other workers running - safe to continue',
        },
    ],
}); };
exports.details = details;
// Returns PIDs of processes using the NVIDIA encoder (NVENC), excluding Tdarr's own
// ffmpeg/HandBrake processes.
var getNonTdarrNvencPids = function (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
childProcess, enableDebugLog, jobLog) {
    try {
        // nvidia-smi pmon shows per-process GPU usage including encoder utilization
        // Columns: gpu pid type sm mem enc dec jpg command
        var output = childProcess.execSync('nvidia-smi pmon -c 1 -s e', { timeout: 15000, windowsHide: true, encoding: 'utf8' });
        var lines = output.split(/\r?\n/);
        var tdarrProcessNames = ['ffmpeg', 'ffprobe', 'handbrakecli'];
        var nvencPids = [];
        var _loop_1 = function (i) {
            var line = lines[i].trim();
            // Skip header and comment lines
            if (!line || line.startsWith('#')) {
                return "continue";
            }
            var parts = line.split(/\s+/);
            // Expected: gpu pid type sm mem enc dec jpg command (or similar)
            // Minimum columns: gpu pid type sm mem enc dec command
            if (parts.length < 8) {
                return "continue";
            }
            var pid = parseInt(parts[1], 10);
            var enc = parseInt(parts[5], 10);
            // Last part is the command/process name
            var command = parts[parts.length - 1].toLowerCase();
            if (Number.isNaN(pid) || pid <= 0) {
                return "continue";
            }
            // Only care about processes actively using the encoder
            if (Number.isNaN(enc) || enc <= 0) {
                return "continue";
            }
            // Skip Tdarr's own processes
            var isTdarr = tdarrProcessNames.some(function (name) { return command.includes(name); });
            if (isTdarr) {
                return "continue";
            }
            nvencPids.push(pid);
        };
        for (var i = 0; i < lines.length; i += 1) {
            _loop_1(i);
        }
        if (enableDebugLog) {
            jobLog("nvidia-smi pmon: ".concat(nvencPids.length, " non-Tdarr NVENC process(es) found"));
        }
        return nvencPids;
    }
    catch (err) {
        if (enableDebugLog) {
            jobLog("nvidia-smi pmon error: ".concat(err));
        }
    }
    return [];
};
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, childProcess, pollInterval, lowPriority, normalPriority, isLowered, firstCheck, confirmCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                childProcess = require('child_process');
                pollInterval = Math.max(5, Number(args.inputs.pollIntervalSeconds) || 15) * 1000;
                lowPriority = (String(args.inputs.lowPriority) || 'low');
                normalPriority = (String(args.inputs.normalPriority) || 'normal');
                args.jobLog('Starting NVENC priority monitor');
                isLowered = false;
                firstCheck = true;
                confirmCount = 3;
                return [4 /*yield*/, (0, automationUtils_1.pollUntilConfirmed)(args, pollInterval, confirmCount, function (firstPoll) { return __awaiter(void 0, void 0, void 0, function () {
                        var nvencPids, hasNonTdarrNvenc, othersRunning;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    nvencPids = getNonTdarrNvencPids(childProcess, firstCheck || firstPoll, args.jobLog);
                                    hasNonTdarrNvenc = nvencPids.length > 0;
                                    if (hasNonTdarrNvenc && !isLowered) {
                                        args.jobLog("Non-Tdarr NVENC detected (PIDs: ".concat(nvencPids.join(', '), "), setting priority to ").concat(lowPriority));
                                        setTdarrProcessPriority(lowPriority, args.platform, childProcess, args.jobLog);
                                        isLowered = true;
                                    }
                                    else if (!hasNonTdarrNvenc && isLowered) {
                                        args.jobLog("No non-Tdarr NVENC processes, restoring priority to ".concat(normalPriority));
                                        setTdarrProcessPriority(normalPriority, args.platform, childProcess, args.jobLog);
                                        isLowered = false;
                                    }
                                    firstCheck = false;
                                    return [4 /*yield*/, (0, automationUtils_1.checkOtherWorkersRunning)(args, firstPoll)];
                                case 1:
                                    othersRunning = _a.sent();
                                    if (othersRunning === 'error')
                                        return [2 /*return*/, 'error'];
                                    return [2 /*return*/, !othersRunning];
                            }
                        });
                    }); }, "No other workers running (confirmed ".concat(confirmCount, " times), stopping NVENC priority monitor"))];
            case 1:
                _a.sent();
                // Restore priority on exit if it was lowered
                if (isLowered) {
                    args.jobLog("Restoring priority to ".concat(normalPriority, " on exit"));
                    setTdarrProcessPriority(normalPriority, args.platform, childProcess, args.jobLog);
                }
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
