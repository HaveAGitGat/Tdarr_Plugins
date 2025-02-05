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
var fs_1 = require("fs");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Input File',
    description: 'Start the flow with an input file',
    style: {
        borderColor: 'pink',
    },
    tags: '',
    isStartPlugin: true,
    pType: 'start',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'File Access Checks',
            name: 'fileAccessChecks',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Will check if input file and cache are readable and writable',
        },
        {
            label: 'Pause Node If Access Checks Fail',
            name: 'pauseNodeIfAccessChecksFail',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'This will pause the node if the file access checks fail',
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
    var lib, orignalFolder, _a, fileAccessChecks, pauseNodeIfAccessChecksFail, nodeID, _b, serverIP, serverPort, url, pauseNode, checkReadWrite;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                orignalFolder = (0, fileUtils_1.getFileAbosluteDir)(args.originalLibraryFile._id);
                _a = args.inputs, fileAccessChecks = _a.fileAccessChecks, pauseNodeIfAccessChecksFail = _a.pauseNodeIfAccessChecksFail;
                nodeID = process.argv[8];
                _b = args.deps.configVars.config, serverIP = _b.serverIP, serverPort = _b.serverPort;
                url = "http://".concat(serverIP, ":").concat(serverPort, "/api/v2/update-node");
                pauseNode = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var requestConfig;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                args.jobLog('Pausing node');
                                requestConfig = {
                                    method: 'post',
                                    url: url,
                                    headers: {},
                                    data: {
                                        data: {
                                            nodeID: nodeID,
                                            nodeUpdates: {
                                                nodePaused: true,
                                            },
                                        },
                                    },
                                };
                                return [4 /*yield*/, args.deps.axios(requestConfig)];
                            case 1:
                                _a.sent();
                                args.jobLog('Node paused');
                                return [2 /*return*/];
                        }
                    });
                }); };
                checkReadWrite = function (location) { return __awaiter(void 0, void 0, void 0, function () {
                    var err_1, err_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 5]);
                                return [4 /*yield*/, fs_1.promises.access(location, fs_1.promises.constants.R_OK)];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 5];
                            case 2:
                                err_1 = _a.sent();
                                args.jobLog(JSON.stringify(err_1));
                                if (!pauseNodeIfAccessChecksFail) return [3 /*break*/, 4];
                                return [4 /*yield*/, pauseNode()];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: throw new Error("Location not readable:".concat(location));
                            case 5:
                                _a.trys.push([5, 7, , 10]);
                                return [4 /*yield*/, fs_1.promises.access(location, fs_1.promises.constants.W_OK)];
                            case 6:
                                _a.sent();
                                return [3 /*break*/, 10];
                            case 7:
                                err_2 = _a.sent();
                                args.jobLog(JSON.stringify(err_2));
                                if (!pauseNodeIfAccessChecksFail) return [3 /*break*/, 9];
                                return [4 /*yield*/, pauseNode()];
                            case 8:
                                _a.sent();
                                _a.label = 9;
                            case 9: throw new Error("Location not writeable:".concat(location));
                            case 10: return [2 /*return*/];
                        }
                    });
                }); };
                if (!fileAccessChecks) return [3 /*break*/, 3];
                args.jobLog('Checking file access');
                return [4 /*yield*/, checkReadWrite(orignalFolder)];
            case 1:
                _c.sent();
                return [4 /*yield*/, checkReadWrite(args.librarySettings.cache)];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                args.jobLog('Skipping file access checks');
                _c.label = 4;
            case 4: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
