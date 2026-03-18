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
exports.pollUntilConfirmed = exports.checkOtherWorkersRunning = exports.isAutomationFile = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
// Same pattern used in be/srcts/commonModules/fileScanner/fileScannerUtils.ts
var automationDummyFilePattern = /\/.tdarr\/automation-.+-.+\.txt$/;
var isAutomationFile = function (filepath) { return automationDummyFilePattern.test(filepath); };
exports.isAutomationFile = isAutomationFile;
// Returns true if other non-automation workers are running on the node.
// Returns 'error' on server/network failure so callers can distinguish
// "no workers" from "couldn't check".
var checkOtherWorkersRunning = function (args, enableDebugLog) { return __awaiter(void 0, void 0, void 0, function () {
    var nodeID, serverURL, apiKey, nodesRes, node, nodeIds, myJobId, workerIds, otherWorkerCount, i, worker, err_1;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                nodeID = args.configVars.config.nodeID;
                if (!nodeID || !((_a = args.deps) === null || _a === void 0 ? void 0 : _a.axios)) {
                    if (enableDebugLog) {
                        args.jobLog("checkWorkers: no nodeID (".concat(nodeID, ") or no axios"));
                    }
                    return [2 /*return*/, false];
                }
                _j.label = 1;
            case 1:
                _j.trys.push([1, 3, , 4]);
                serverURL = ((_c = (_b = args.configVars) === null || _b === void 0 ? void 0 : _b.config) === null || _c === void 0 ? void 0 : _c.serverURL) || '';
                apiKey = ((_e = (_d = args.configVars) === null || _d === void 0 ? void 0 : _d.config) === null || _e === void 0 ? void 0 : _e.apiKey) || '';
                return [4 /*yield*/, args.deps.axios.get("".concat(serverURL, "/api/v2/get-nodes"), {
                        timeout: 30000,
                        headers: {
                            'content-Type': 'application/json',
                            'x-api-key': apiKey,
                        },
                    })];
            case 2:
                nodesRes = _j.sent();
                node = (_f = nodesRes.data) === null || _f === void 0 ? void 0 : _f[nodeID];
                if (!(node === null || node === void 0 ? void 0 : node.workers)) {
                    if (enableDebugLog) {
                        nodeIds = Object.keys(nodesRes.data || {});
                        args.jobLog("checkWorkers: node \"".concat(nodeID, "\" not found in response. Available: ").concat(nodeIds.join(', ')));
                    }
                    return [2 /*return*/, false];
                }
                myJobId = ((_g = args.job) === null || _g === void 0 ? void 0 : _g.jobId) || '';
                workerIds = Object.keys(node.workers);
                otherWorkerCount = 0;
                for (i = 0; i < workerIds.length; i += 1) {
                    worker = node.workers[workerIds[i]];
                    if (((_h = worker.job) === null || _h === void 0 ? void 0 : _h.jobId) === myJobId) {
                        continue; // eslint-disable-line no-continue
                    }
                    // Skip other automation workers
                    if (worker.file && (0, exports.isAutomationFile)(worker.file)) {
                        continue; // eslint-disable-line no-continue
                    }
                    otherWorkerCount += 1;
                }
                if (enableDebugLog) {
                    args.jobLog("checkWorkers: ".concat(workerIds.length, " total workers, ").concat(otherWorkerCount, " non-automation others"));
                }
                return [2 /*return*/, otherWorkerCount > 0];
            case 3:
                err_1 = _j.sent();
                if (enableDebugLog) {
                    args.jobLog("checkWorkers error: ".concat(err_1));
                }
                return [2 /*return*/, 'error'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkOtherWorkersRunning = checkOtherWorkersRunning;
// Runs a polling loop that bumps worker percentage each iteration.
// Calls `checkFn` each poll. When `checkFn` returns true for `confirmCount`
// consecutive times, the loop exits.
// If `checkFn` returns 'error', the confirmation counter is reset
// (treat errors as "uncertain, keep going").
// Returns when the exit condition is met.
var pollUntilConfirmed = function (args, pollIntervalMs, confirmCount, checkFn, exitMessage) { return __awaiter(void 0, void 0, void 0, function () {
    var percentage, confirmedCount, finished, firstCheck, conditionMet, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                percentage = 0;
                confirmedCount = 0;
                finished = false;
                firstCheck = true;
                _a.label = 1;
            case 1:
                if (!!finished) return [3 /*break*/, 7];
                args.updateWorker({ percentage: percentage });
                percentage = (percentage + 1) % 100;
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollIntervalMs); })];
            case 2:
                _a.sent(); // eslint-disable-line no-await-in-loop
                conditionMet = void 0;
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, checkFn(firstCheck)];
            case 4:
                conditionMet = _a.sent(); // eslint-disable-line no-await-in-loop
                return [3 /*break*/, 6];
            case 5:
                err_2 = _a.sent();
                // If checkFn throws, treat as error - reset confirmation counter
                args.jobLog("pollUntilConfirmed: checkFn threw, resetting confirmations: ".concat(err_2));
                conditionMet = 'error';
                return [3 /*break*/, 6];
            case 6:
                firstCheck = false;
                if (conditionMet === 'error') {
                    // Server/network error - don't count toward exit, reset counter
                    if (confirmedCount > 0) {
                        confirmedCount = 0;
                    }
                }
                else if (conditionMet) {
                    confirmedCount += 1;
                    if (confirmedCount >= confirmCount) {
                        args.jobLog(exitMessage);
                        finished = true;
                    }
                }
                else if (confirmedCount > 0) {
                    confirmedCount = 0;
                }
                return [3 /*break*/, 1];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.pollUntilConfirmed = pollUntilConfirmed;
