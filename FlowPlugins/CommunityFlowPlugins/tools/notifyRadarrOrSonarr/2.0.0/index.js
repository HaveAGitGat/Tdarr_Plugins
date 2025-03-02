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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details = function () { return ({
    name: 'Notify Radarr or Sonarr',
    description: 'Notify Radarr or Sonarr to refresh after file change',
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
            tooltip: 'Input your arr host here.'
                + '\\nExample:\\n'
                + 'http://192.168.1.1:7878\\n'
                + 'http://192.168.1.1:8989\\n'
                + 'https://radarr.domain.com\\n'
                + 'https://sonarr.domain.com\\n',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Radarr or Sonarr notified',
        },
        {
            number: 2,
            tooltip: 'Radarr or Sonarr do not know this file',
        },
    ],
}); };
exports.details = details;
var getId = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var imdbId, id, _a, _b, _c, _d;
    var _e, _f, _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                imdbId = (_f = (_e = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)) === null || _e === void 0 ? void 0 : _e.at(0)) !== null && _f !== void 0 ? _f : '';
                if (!(imdbId !== '')) return [3 /*break*/, 2];
                _b = Number;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/").concat(arrApp.name === 'radarr' ? 'movie' : 'series', "/lookup?term=imdb:").concat(imdbId),
                        headers: arrApp.headers,
                    })];
            case 1:
                _a = _b.apply(void 0, [(_j = (_h = (_g = (_k.sent()).data) === null || _g === void 0 ? void 0 : _g.at(0)) === null || _h === void 0 ? void 0 : _h.id) !== null && _j !== void 0 ? _j : -1]);
                return [3 /*break*/, 3];
            case 2:
                _a = -1;
                _k.label = 3;
            case 3:
                id = _a;
                args.jobLog("".concat(arrApp.content, " ").concat(id !== -1 ? "'".concat(id, "' found") : 'not found', " for imdb '").concat(imdbId, "'"));
                if (!(id === -1)) return [3 /*break*/, 5];
                _d = (_c = arrApp.delegates).getIdFromParseResponse;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: arrApp.headers,
                    })];
            case 4:
                id = _d.apply(_c, [(_k.sent())]);
                args.jobLog("".concat(arrApp.content, " ").concat(id !== -1 ? "'".concat(id, "' found") : 'not found', " for '").concat((0, fileUtils_1.getFileName)(fileName), "'"));
                _k.label = 5;
            case 5: return [2 /*return*/, id];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, refreshed, arr, arr_host, arrHost, originalFileName, currentFileName, headers, arrApp, id;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                refreshed = false;
                arr = String(args.inputs.arr);
                arr_host = String(args.inputs.arr_host).trim();
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(args.inputs.arr_api_key),
                    Accept: 'application/json',
                };
                arrApp = arr === 'radarr'
                    ? {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Movie',
                        delegates: {
                            getIdFromParseResponse: function (parseResponse) { var _a, _b, _c; return Number((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1); },
                            buildRefreshResquestData: function (id) { return JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }); },
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Serie',
                        delegates: {
                            getIdFromParseResponse: function (parseResponse) { var _a, _b, _c; return Number((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1); },
                            buildRefreshResquestData: function (id) { return JSON.stringify({ name: 'RefreshSeries', seriesId: id }); },
                        },
                    };
                args.jobLog('Going to force scan');
                args.jobLog("Refreshing ".concat(arrApp.name, "..."));
                return [4 /*yield*/, getId(args, arrApp, originalFileName)];
            case 1:
                id = _e.sent();
                if (!(id === -1 && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getId(args, arrApp, currentFileName)];
            case 2:
                id = _e.sent();
                _e.label = 3;
            case 3:
                if (!(id !== -1)) return [3 /*break*/, 5];
                // Using command endpoint to queue a refresh task
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: "".concat(arrApp.host, "/api/v3/command"),
                        headers: headers,
                        data: arrApp.delegates.buildRefreshResquestData(id),
                    })];
            case 4:
                // Using command endpoint to queue a refresh task
                _e.sent();
                refreshed = true;
                args.jobLog("\u2714 ".concat(arrApp.content, " '").concat(id, "' refreshed in ").concat(arrApp.name, "."));
                _e.label = 5;
            case 5: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: refreshed ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
