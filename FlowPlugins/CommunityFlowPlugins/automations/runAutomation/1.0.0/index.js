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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Run Automation',
    description: 'Triggers another automation by its config ID, optionally passing a JSON payload.',
    style: {
        borderColor: '#FF9800',
    },
    tags: 'automations,trigger,run',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faPlay',
    inputs: [
        {
            label: 'Automation Config ID',
            name: 'configId',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'The ID of the automation config to trigger.',
        },
        {
            label: 'Payload (JSON)',
            name: 'payload',
            type: 'string',
            defaultValue: '{}',
            inputUI: {
                type: 'textarea',
                style: {
                    height: '100px',
                },
            },
            tooltip: 'Optional JSON payload to pass to the automation.',
        },
        {
            label: 'Skip If Already Running',
            name: 'skipIfRunning',
            type: 'string',
            defaultValue: 'onThisNode',
            inputUI: {
                type: 'dropdown',
                options: ['disabled', 'onThisNode', 'onAnyNode'],
            },
            tooltip: 'Skip triggering if the automation is already running on this node or any node.',
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
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, configId, payloadStr, skipIfRunning, serverURL, apiKey, headers, confirmCount, pollDelayMs_1, notRunningCount, poll, nodesRes, nodes, myNodeID, nodeIdsToCheck, isRunning, i, node, workerIds, j, worker, payload, response;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                configId = String(args.inputs.configId).trim();
                payloadStr = String(args.inputs.payload).trim() || '{}';
                skipIfRunning = String(args.inputs.skipIfRunning);
                if (!configId) {
                    throw new Error('No automation config ID provided');
                }
                serverURL = ((_b = (_a = args.configVars) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.serverURL) || '';
                apiKey = ((_d = (_c = args.configVars) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.apiKey) || '';
                headers = {
                    'content-Type': 'application/json',
                    'x-api-key': apiKey,
                };
                if (!(skipIfRunning === 'onThisNode' || skipIfRunning === 'onAnyNode')) return [3 /*break*/, 7];
                confirmCount = 3;
                pollDelayMs_1 = 5000;
                notRunningCount = 0;
                poll = 0;
                _g.label = 1;
            case 1:
                if (!(poll < confirmCount)) return [3 /*break*/, 6];
                if (!(poll > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollDelayMs_1); })];
            case 2:
                _g.sent(); // eslint-disable-line no-await-in-loop
                _g.label = 3;
            case 3: return [4 /*yield*/, args.deps.axios.get("".concat(serverURL, "/api/v2/get-nodes"), {
                    timeout: 30000,
                    headers: headers,
                })];
            case 4:
                nodesRes = _g.sent();
                nodes = nodesRes.data || {};
                myNodeID = args.configVars.config.nodeID;
                nodeIdsToCheck = skipIfRunning === 'onThisNode'
                    ? [myNodeID]
                    : Object.keys(nodes);
                isRunning = false;
                for (i = 0; i < nodeIdsToCheck.length; i += 1) {
                    node = nodes[nodeIdsToCheck[i]];
                    if (!(node === null || node === void 0 ? void 0 : node.workers)) {
                        continue; // eslint-disable-line no-continue
                    }
                    workerIds = Object.keys(node.workers);
                    for (j = 0; j < workerIds.length; j += 1) {
                        worker = node.workers[workerIds[j]];
                        if (((_e = worker.job) === null || _e === void 0 ? void 0 : _e.footprintId) === configId && !worker.idle) {
                            isRunning = true;
                            break;
                        }
                    }
                    if (isRunning)
                        break;
                }
                if (isRunning) {
                    args.jobLog("Automation ".concat(configId, " is already running, skipping"));
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                notRunningCount += 1;
                _g.label = 5;
            case 5:
                poll += 1;
                return [3 /*break*/, 1];
            case 6:
                args.jobLog("Automation ".concat(configId, " confirmed not running (").concat(notRunningCount, "/").concat(confirmCount, " checks)"));
                _g.label = 7;
            case 7:
                payload = JSON.parse(payloadStr);
                return [4 /*yield*/, args.deps.axios.post("".concat(serverURL, "/api/v2/run-automation"), {
                        data: {
                            configId: configId,
                            payload: payload,
                        },
                    }, {
                        timeout: 30000,
                        headers: {
                            'content-Type': 'application/json',
                            'x-api-key': apiKey,
                        },
                    })];
            case 8:
                response = _g.sent();
                if (response.status !== 200) {
                    throw new Error("Automation trigger failed with status ".concat(response.status));
                }
                if ((_f = response.data) === null || _f === void 0 ? void 0 : _f.error) {
                    throw new Error("Automation trigger failed: ".concat(response.data.error));
                }
                args.jobLog("Automation ".concat(configId, " triggered"));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
