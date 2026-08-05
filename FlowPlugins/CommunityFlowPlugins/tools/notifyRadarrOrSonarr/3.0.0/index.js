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
var details = function () { return ({
    name: 'Notify Radarr or Sonarr',
    description: 'Notify Radarr or Sonarr to refresh after file change. '
        + 'Has to be used after the "Set Flow Variables From Radarr Or Sonarr" plugin.',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faBell',
    inputs: [
        {
            label: 'Arr',
            name: 'arr',
            type: 'string',
            defaultValue: 'radarr',
            inputUI: {
                type: 'dropdown',
                options: ['radarr', 'sonarr'],
            },
            tooltip: 'Specify which arr to use',
        },
        {
            label: 'Arr API Key',
            name: 'arr_api_key',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your arr api key here',
        },
        {
            label: 'Arr Host',
            name: 'arr_host',
            type: 'string',
            defaultValue: 'http://192.168.1.1:7878',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your arr host here.\nExample:\n'
                + 'http://192.168.1.1:7878\n'
                + 'http://192.168.1.1:8989\n'
                + 'https://radarr.domain.com\n'
                + 'https://sonarr.domain.com',
        },
    ],
    outputs: [
        { number: 1, tooltip: 'Radarr or Sonarr notified' },
        { number: 2, tooltip: 'Radarr or Sonarr do not know this file' },
    ],
}); };
exports.details = details;
var API_VERSION = 'v3';
var CONTENT_TYPE = 'application/json';
var arrConfigs = {
    radarr: {
        content: 'Movie',
        buildRefreshRequest: function (id) { return JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }); },
    },
    sonarr: {
        content: 'Serie',
        buildRefreshRequest: function (id) { return JSON.stringify({ name: 'RefreshSeries', seriesId: id }); },
    },
};
var normalizeHost = function (host) {
    var trimmedHost = host.trim();
    return trimmedHost.endsWith('/') ? trimmedHost.slice(0, -1) : trimmedHost;
};
var createArrApp = function (arrType, host, apiKey) {
    var headers = {
        'Content-Type': CONTENT_TYPE,
        'X-Api-Key': apiKey,
        Accept: CONTENT_TYPE,
    };
    var config = arrConfigs[arrType];
    return {
        name: arrType,
        host: normalizeHost(host),
        headers: headers,
        content: config.content,
        buildRefreshRequest: config.buildRefreshRequest,
    };
};
var refreshArr = function (arrApp, id, args) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (id === -1) {
                    args.jobLog('No valid ID found in variables');
                    return [2 /*return*/, false];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: "".concat(arrApp.host, "/api/").concat(API_VERSION, "/command"),
                        headers: arrApp.headers,
                        data: arrApp.buildRefreshRequest(id),
                    })];
            case 2:
                _a.sent();
                args.jobLog("\u2714 ".concat(arrApp.content, " '").concat(id, "' refreshed in ").concat(arrApp.name, "."));
                return [2 /*return*/, true];
            case 3:
                error_1 = _a.sent();
                args.jobLog("Error refreshing ".concat(arrApp.name, ": ").concat(error_1.message));
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, arr, arr_api_key, arr_host, arrApp, id, refreshed;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, arr = _a.arr, arr_api_key = _a.arr_api_key, arr_host = _a.arr_host;
                arrApp = createArrApp(arr, arr_host, arr_api_key);
                args.jobLog('Going to force scan');
                args.jobLog("Refreshing ".concat(arrApp.name, "..."));
                id = Number((_b = args.variables.user.ArrId) !== null && _b !== void 0 ? _b : -1);
                args.jobLog("ArrId ".concat(id, " read from flow variables"));
                return [4 /*yield*/, refreshArr(arrApp, id, args)];
            case 1:
                refreshed = _c.sent();
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: refreshed ? 1 : 2,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
