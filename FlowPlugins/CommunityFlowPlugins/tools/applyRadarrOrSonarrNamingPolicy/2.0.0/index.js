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
exports.plugin = exports.details = void 0;
var path_1 = __importDefault(require("path"));
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details = function () { return ({
    name: 'Apply Radarr or Sonarr naming policy',
    description: 'Apply Radarr or Sonarr naming policy to a file. Has to be used after the "Set Flow Variables From '
        + 'Radarr Or Sonarr" plugin and after the original file has been replaced and Radarr or Sonarr has '
        + 'been notified. Radarr or Sonarr should also be notified after this plugin.',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faPenToSquare',
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
        buildPreviewRenameUrl: function (fileInfo, host) { return "".concat(host, "/api/").concat(API_VERSION, "/rename?movieId=").concat(fileInfo.id); },
        getFileToRename: function (response) { var _a; return (_a = response.data) === null || _a === void 0 ? void 0 : _a.at(0); },
    },
    sonarr: {
        content: 'Serie',
        // eslint-disable-next-line max-len
        buildPreviewRenameUrl: function (fileInfo, host) { return "".concat(host, "/api/").concat(API_VERSION, "/rename?seriesId=").concat(fileInfo.id, "&seasonNumber=").concat(fileInfo.seasonNumber); },
        // eslint-disable-next-line max-len
        getFileToRename: function (response, fileInfo) { var _a; return (_a = response.data) === null || _a === void 0 ? void 0 : _a.find(function (file) { var _a; return ((_a = file.episodeNumbers) === null || _a === void 0 ? void 0 : _a.at(0)) === fileInfo.episodeNumber; }); },
    },
};
var normalizeHost = function (host) {
    var trimmedHost = host.trim();
    return trimmedHost.endsWith('/') ? trimmedHost.slice(0, -1) : trimmedHost;
};
var createHeaders = function (apiKey) { return ({
    'Content-Type': CONTENT_TYPE,
    'X-Api-Key': apiKey,
    Accept: CONTENT_TYPE,
}); };
var buildNewPath = function (currentFileName, fileToRename) {
    var directory = (0, fileUtils_1.getFileAbosluteDir)(currentFileName);
    var fileName = (0, fileUtils_1.getFileName)(fileToRename.newPath);
    var container = (0, fileUtils_1.getContainer)(fileToRename.newPath);
    return path_1.default.join(directory, "".concat(fileName, ".").concat(container));
};
var previewRename = function (args, host, headers, fileInfo, config) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: config.buildPreviewRenameUrl(fileInfo, host),
                        headers: headers,
                    })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, config.getFileToRename(response, fileInfo)];
            case 2:
                error_1 = _a.sent();
                throw new Error("Failed to preview rename: ".concat(error_1.message));
            case 3: return [2 /*return*/];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, arr, arr_api_key, arr_host, host, headers, config, currentFileName, newPath, isSuccessful, fileInfo, fileToRename, error_2;
    var _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, arr = _a.arr, arr_api_key = _a.arr_api_key, arr_host = _a.arr_host;
                host = normalizeHost(arr_host);
                headers = createHeaders(arr_api_key);
                config = arrConfigs[arr];
                currentFileName = (_c = (_b = args.inputFileObj) === null || _b === void 0 ? void 0 : _b._id) !== null && _c !== void 0 ? _c : '';
                args.jobLog('Going to apply new name');
                args.jobLog("Renaming ".concat(arr, "..."));
                newPath = '';
                isSuccessful = false;
                _g.label = 1;
            case 1:
                _g.trys.push([1, 6, , 7]);
                fileInfo = {
                    id: (_d = args.variables.user.ArrId) !== null && _d !== void 0 ? _d : '',
                    seasonNumber: Number((_e = args.variables.user.ArrSeasonNumber) !== null && _e !== void 0 ? _e : -1),
                    episodeNumber: Number((_f = args.variables.user.ArrEpisodeNumber) !== null && _f !== void 0 ? _f : -1),
                };
                args.jobLog("ArrId ".concat(fileInfo.id, " read from flow variables"));
                if (fileInfo.seasonNumber !== -1 || fileInfo.episodeNumber !== -1) {
                    args.jobLog("ArrSeasonNumber ".concat(fileInfo.seasonNumber, " read from flow variables"));
                    args.jobLog("ArrEpisodeNumber ".concat(fileInfo.episodeNumber, " read from flow variables"));
                }
                if (fileInfo.id === '-1') {
                    args.jobLog('❌ Invalid file ID');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                return [4 /*yield*/, previewRename(args, host, headers, fileInfo, config)];
            case 2:
                fileToRename = _g.sent();
                if (!!fileToRename) return [3 /*break*/, 3];
                args.jobLog('✔ No rename necessary.');
                isSuccessful = true;
                return [3 /*break*/, 5];
            case 3:
                newPath = buildNewPath(currentFileName, fileToRename);
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: currentFileName,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 4:
                isSuccessful = _g.sent();
                if (isSuccessful) {
                    args.jobLog("\u2714 File renamed to: ".concat(newPath));
                }
                _g.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_2 = _g.sent();
                args.jobLog("\u274C Error during rename: ".concat(error_2.message));
                isSuccessful = false;
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/, {
                    outputFileObj: isSuccessful && newPath !== ''
                        ? __assign(__assign({}, args.inputFileObj), { _id: newPath }) : args.inputFileObj,
                    outputNumber: isSuccessful ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
