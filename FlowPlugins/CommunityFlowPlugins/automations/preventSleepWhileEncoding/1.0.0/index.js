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
var details = function () { return ({
    name: 'Prevent Sleep While Encoding',
    description: 'Loops while other workers on this node are active, preventing the system from sleeping.'
        + ' Bumps worker percentage each iteration. Exits when no other workers are running'
        + ' (confirmed 3 times in a row).',
    style: {
        borderColor: '#FF9800',
    },
    tags: 'automations,sleep,encoding,prevent',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.64.01',
    sidebarPosition: -1,
    icon: 'faMoon',
    inputs: [
        {
            label: 'Poll Interval (seconds)',
            name: 'pollIntervalSeconds',
            type: 'number',
            defaultValue: '15',
            inputUI: {
                type: 'text',
            },
            tooltip: 'How often to check if other workers are still running.',
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
// Spawns a platform-specific process that prevents system sleep.
// Returns a cleanup function to stop it.
var startSleepPrevention = function (platform, childProcess, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jobLog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var proc = null;
    try {
        if (platform === 'win32') {
            // Spawn a long-running PowerShell process that calls SetThreadExecutionState
            // in a loop. The state is per-thread, so a one-shot execSync call loses it
            // when the PowerShell process exits. This keeps the thread alive and refreshes
            // the state every 30 seconds.
            // ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED = 0x80000003
            // ES_CONTINUOUS only (clear) = 0x80000000
            var psScript = 'Add-Type -MemberDefinition '
                + '\'[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);\' '
                + '-Name SleepUtil -Namespace Win32; '
                + 'while ($true) { [Win32.SleepUtil]::SetThreadExecutionState(2147483651) | Out-Null; '
                + 'Start-Sleep -Seconds 30 }';
            proc = childProcess.spawn('powershell', ['-NoProfile', '-Command', psScript], { stdio: 'ignore', windowsHide: true, detached: false });
            jobLog('Sleep prevention active (Windows SetThreadExecutionState, refreshing)');
            var winProc_1 = proc;
            return function () {
                try {
                    winProc_1.kill();
                }
                catch (err) {
                    // cleanup best-effort
                }
                // Reset execution state via a separate PowerShell call as best-effort
                try {
                    var clearCmd = 'powershell -NoProfile -Command "Add-Type -MemberDefinition '
                        + '\'[DllImport(\\"kernel32.dll\\")] public static extern uint SetThreadExecutionState(uint f);\' '
                        + '-Name SleepUtilClr -Namespace Win32; '
                        + '[Win32.SleepUtilClr]::SetThreadExecutionState(2147483648)"';
                    childProcess.execSync(clearCmd, { timeout: 10000, windowsHide: true });
                }
                catch (err) {
                    // cleanup best-effort
                }
            };
        }
        if (platform === 'darwin') {
            // caffeinate -i prevents idle sleep, runs until killed
            proc = childProcess.spawn('caffeinate', ['-i'], {
                stdio: 'ignore',
                detached: false,
            });
            jobLog('Sleep prevention active (caffeinate)');
            var cafProc_1 = proc;
            return function () {
                try {
                    cafProc_1.kill();
                }
                catch (err) {
                    // cleanup best-effort
                }
            };
        }
        // Linux: use systemd-inhibit if available
        proc = childProcess.spawn('systemd-inhibit', ['--what=idle:sleep', '--who=Tdarr', '--why=Encoding in progress', 'sleep', 'infinity'], { stdio: 'ignore', detached: false });
        // spawn errors are async — listen for them
        var inhibitFailed_1 = false;
        proc.on('error', function (err) {
            inhibitFailed_1 = true;
            jobLog("systemd-inhibit not available: ".concat(err.message));
        });
        jobLog('Sleep prevention active (systemd-inhibit)');
        var inhProc_1 = proc;
        return function () {
            if (!inhibitFailed_1) {
                try {
                    inhProc_1.kill();
                }
                catch (err) {
                    // cleanup best-effort
                }
            }
        };
    }
    catch (err) {
        jobLog("Could not start sleep prevention: ".concat(err));
    }
    // No-op cleanup if nothing was started
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return function () { };
};
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, childProcess, pollInterval, stopSleepPrevention, confirmCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                childProcess = require('child_process');
                pollInterval = Math.max(10, Number(args.inputs.pollIntervalSeconds) || 15) * 1000;
                args.jobLog('Starting sleep prevention loop');
                stopSleepPrevention = startSleepPrevention(args.platform, childProcess, args.jobLog);
                confirmCount = 3;
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, (0, automationUtils_1.pollUntilConfirmed)(args, pollInterval, confirmCount, function (firstCheck) { return __awaiter(void 0, void 0, void 0, function () {
                        var othersRunning;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, automationUtils_1.checkOtherWorkersRunning)(args, firstCheck)];
                                case 1:
                                    othersRunning = _a.sent();
                                    if (othersRunning === 'error')
                                        return [2 /*return*/, 'error'];
                                    return [2 /*return*/, !othersRunning];
                            }
                        });
                    }); }, "No other workers running (confirmed ".concat(confirmCount, " times), stopping sleep prevention"))];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                stopSleepPrevention();
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
