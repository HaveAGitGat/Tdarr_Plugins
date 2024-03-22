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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details = function () { return ({
    name: 'Apply Radarr or Sonarr naming policy',
    description: 'Apply Radarr or Sonarr naming policy to a file. This plugin should be called after the original file has been '
        + 'replaced and Radarr or Sonarr has been notified. Radarr or Sonarr should also be notified after this plugin.',
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
            tooltip: 'Radarr or Sonnar notified',
        },
        {
            number: 2,
            tooltip: 'Radarr or Sonnar do not know this file',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, arr, arr_api_key, arr_host, arrHost, filePath, fileNames, getNewPath, episodeNumber, getNewPathTypes, newPathOutput;
    var _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, arr = _a.arr, arr_api_key = _a.arr_api_key;
                arr_host = String(args.inputs.arr_host).trim();
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                filePath = (_c = (_b = args.originalLibraryFile) === null || _b === void 0 ? void 0 : _b._id) !== null && _c !== void 0 ? _c : '';
                fileNames = {
                    originalFileName: (0, fileUtils_1.getFileName)((_e = (_d = args.originalLibraryFile) === null || _d === void 0 ? void 0 : _d._id) !== null && _e !== void 0 ? _e : ''),
                    currentFileName: (0, fileUtils_1.getFileName)((_g = (_f = args.inputFileObj) === null || _f === void 0 ? void 0 : _f._id) !== null && _g !== void 0 ? _g : ''),
                };
                getNewPath = function (getNewPathType) { return __awaiter(void 0, void 0, void 0, function () {
                    var output, headers, getParseRequestResult, fileName, parseRequestResult, previewRenameRequestConfig, previewRenameRequestResult, fileToRename, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                output = {
                                    newPath: '',
                                    isSuccessful: false,
                                };
                                args.jobLog('Going to apply new name');
                                args.jobLog("Renaming ".concat(getNewPathType.appName, "..."));
                                headers = {
                                    'Content-Type': 'application/json',
                                    'X-Api-Key': arr_api_key,
                                    Accept: 'application/json',
                                };
                                getParseRequestResult = function (fileName) { return __awaiter(void 0, void 0, void 0, function () {
                                    var parseRequestConfig, parseRequestResult, id;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                parseRequestConfig = {
                                                    method: 'get',
                                                    url: "".concat(arrHost, "/api/v3/parse?title=").concat(encodeURIComponent(fileName)),
                                                    headers: headers,
                                                };
                                                return [4 /*yield*/, args.deps.axios(parseRequestConfig)];
                                            case 1:
                                                parseRequestResult = _a.sent();
                                                id = getNewPathType.delegates.getIdFromParseRequestResult(parseRequestResult);
                                                args.jobLog(id !== '-1'
                                                    ? "Found ".concat(getNewPathType.contentName, " ").concat(id, " with a file named '").concat(fileName, "'")
                                                    : "Didn't find ".concat(getNewPathType.contentName, " with a file named '").concat(fileName, "' in ").concat(arrHost, "."));
                                                return [2 /*return*/, { requestResult: parseRequestResult, id: id }];
                                        }
                                    });
                                }); };
                                fileName = fileNames.originalFileName;
                                return [4 /*yield*/, getParseRequestResult(fileName)];
                            case 1:
                                parseRequestResult = _b.sent();
                                if (!(parseRequestResult.id === '-1' && fileNames.currentFileName !== fileNames.originalFileName)) return [3 /*break*/, 3];
                                fileName = fileNames.currentFileName;
                                return [4 /*yield*/, getParseRequestResult(fileName)];
                            case 2:
                                parseRequestResult = _b.sent();
                                _b.label = 3;
                            case 3:
                                if (!(parseRequestResult.id !== '-1')) return [3 /*break*/, 7];
                                previewRenameRequestConfig = {
                                    method: 'get',
                                    url: getNewPathType.delegates.buildPreviewRenameResquestUrl(parseRequestResult),
                                    headers: headers,
                                };
                                return [4 /*yield*/, args.deps.axios(previewRenameRequestConfig)];
                            case 4:
                                previewRenameRequestResult = _b.sent();
                                fileToRename = getNewPathType.delegates
                                    .getFileToRenameFromPreviewRenameRequestResult(previewRenameRequestResult);
                                if (!(fileToRename !== undefined)) return [3 /*break*/, 6];
                                output.newPath = "".concat((0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id), "/").concat((0, fileUtils_1.getFileName)(fileToRename.newPath), ".").concat((0, fileUtils_1.getContainer)(fileToRename.newPath));
                                _a = output;
                                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                                        operation: 'move',
                                        sourcePath: args.inputFileObj._id,
                                        destinationPath: output.newPath,
                                        args: args,
                                    })];
                            case 5:
                                _a.isSuccessful = _b.sent();
                                args.jobLog("\u2714 Renamed ".concat(getNewPathType.contentName, " ").concat(parseRequestResult.id, " : ")
                                    + "'".concat(filePath, "' => '").concat(output.newPath, "'."));
                                return [3 /*break*/, 7];
                            case 6:
                                output.isSuccessful = true;
                                args.jobLog('✔ No rename necessary.');
                                _b.label = 7;
                            case 7: return [2 /*return*/, output];
                        }
                    });
                }); };
                episodeNumber = 0;
                getNewPathTypes = {
                    radarr: {
                        appName: 'Radarr',
                        contentName: 'movie',
                        delegates: {
                            getIdFromParseRequestResult: function (parseRequestResult) { var _a, _b, _c, _d; return String((_d = (_c = (_b = (_a = parseRequestResult.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.movieFile) === null || _c === void 0 ? void 0 : _c.movieId) !== null && _d !== void 0 ? _d : -1); },
                            buildPreviewRenameResquestUrl: function (parseRequestResult) { return "".concat(arrHost, "/api/v3/rename?movieId=").concat(parseRequestResult.id); },
                            getFileToRenameFromPreviewRenameRequestResult: function (previewRenameRequestResult) {
                                var _a, _b;
                                return ((((_b = (_a = previewRenameRequestResult.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0)
                                    ? previewRenameRequestResult.data[0]
                                    : undefined);
                            },
                        },
                    },
                    sonarr: {
                        appName: 'Sonarr',
                        contentName: 'serie',
                        delegates: {
                            getIdFromParseRequestResult: function (parseRequestResult) { var _a, _b, _c; return String((_c = (_b = (_a = parseRequestResult.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1); },
                            buildPreviewRenameResquestUrl: function (parseRequestResult) {
                                episodeNumber = parseRequestResult.requestResult.data.parsedEpisodeInfo.episodeNumbers[0];
                                return "".concat(arrHost, "/api/v3/rename?")
                                    + "seriesId=".concat(parseRequestResult.id)
                                    + "&seasonNumber=".concat(parseRequestResult.requestResult.data.parsedEpisodeInfo.seasonNumber);
                            },
                            getFileToRenameFromPreviewRenameRequestResult: function (previewRenameRequestResult) {
                                var _a, _b;
                                return ((((_b = (_a = previewRenameRequestResult.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0)
                                    ? previewRenameRequestResult.data.find(function (episodeFile) {
                                        var _a, _b;
                                        return ((((_b = (_a = episodeFile.episodeNumbers) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0)
                                            ? episodeFile.episodeNumbers[0] === episodeNumber
                                            : false);
                                    })
                                    : undefined);
                            },
                        },
                    },
                };
                return [4 /*yield*/, getNewPath(arr === 'radarr' ? getNewPathTypes.radarr : getNewPathTypes.sonarr)];
            case 1:
                newPathOutput = _h.sent();
                return [2 /*return*/, {
                        outputFileObj: newPathOutput.isSuccessful && newPathOutput.newPath !== ''
                            ? __assign(__assign({}, args.inputFileObj), { _id: newPathOutput.newPath }) : args.inputFileObj,
                        outputNumber: newPathOutput.isSuccessful ? 1 : 2,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
