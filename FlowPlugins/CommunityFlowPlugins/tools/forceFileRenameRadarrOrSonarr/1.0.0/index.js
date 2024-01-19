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
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var details = function () { return ({
    name: 'Force File Rename Radarr or Sonarr',
    description: 'Force Radarr or Sonarr to rename a file according to the naming policy',
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
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, arr, arr_api_key, arr_host, fileName, arrHost, headers, rename, existingPath, newPath, episodeNumber_1, newFileId;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, arr = _a.arr, arr_api_key = _a.arr_api_key;
                arr_host = String(args.inputs.arr_host).trim();
                fileName = ((_c = (_b = args.originalLibraryFile) === null || _b === void 0 ? void 0 : _b.meta) === null || _c === void 0 ? void 0 : _c.FileName) || '';
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': arr_api_key,
                    Accept: 'application/json',
                };
                rename = function (getId, getPreviewRenameResquestUrl, getRenameResquestConfigData) { return __awaiter(void 0, void 0, void 0, function () {
                    var parseRequestConfig, parseRequestResult, id, previewRenameRequestConfig, previewRenameRequestResult, renameRequestConfig;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                args.jobLog('Going to force rename');
                                args.jobLog("Renaming ".concat(arr === 'radarr' ? 'Radarr' : 'Sonarr', "..."));
                                parseRequestConfig = {
                                    method: 'get',
                                    url: "".concat(arrHost, "/api/v3/parse?title=").concat(encodeURIComponent(fileName)),
                                    headers: headers,
                                };
                                return [4 /*yield*/, args.deps.axios(parseRequestConfig)];
                            case 1:
                                parseRequestResult = _a.sent();
                                id = getId(parseRequestResult);
                                previewRenameRequestConfig = {
                                    method: 'get',
                                    url: getPreviewRenameResquestUrl(id, parseRequestResult),
                                    headers: headers,
                                };
                                return [4 /*yield*/, args.deps.axios(previewRenameRequestConfig)];
                            case 2:
                                previewRenameRequestResult = _a.sent();
                                renameRequestConfig = {
                                    method: 'post',
                                    url: "".concat(arrHost, "/api/v3/command"),
                                    headers: headers,
                                    data: JSON.stringify(getRenameResquestConfigData(id, previewRenameRequestResult))
                                };
                                return [4 /*yield*/, args.deps.axios(renameRequestConfig)];
                            case 3:
                                _a.sent();
                                args.jobLog("\u2714 Renamed ".concat(arr === 'radarr' ? 'movie' : 'serie', " ").concat(id, " in ").concat(arr === 'radarr' ? 'Radarr' : 'Sonarr', "."));
                                return [2 /*return*/];
                        }
                    });
                }); };
                newPath = '';
                if (!(arr === 'radarr')) return [3 /*break*/, 2];
                return [4 /*yield*/, rename(function (parseRequestResult) { return parseRequestResult.data.movie.movieFile.movieId; }, function (id, parseRequestResult) { return "".concat(arrHost, "/api/v3/rename?movieId=").concat(id); }, function (id, previewRenameRequestResult) {
                        var movieFile = previewRenameRequestResult.data[0];
                        (existingPath = movieFile.existingPath, newPath = movieFile.newPath);
                        return {
                            name: 'RenameFiles',
                            movieId: id,
                            files: [movieFile.movieFileId]
                        };
                    })];
            case 1:
                _d.sent();
                return [3 /*break*/, 5];
            case 2:
                if (!(arr === 'sonarr')) return [3 /*break*/, 4];
                episodeNumber_1 = 0;
                return [4 /*yield*/, rename(function (parseRequestResult) { return parseRequestResult.data.series.id; }, function (id, parseRequestResult) {
                        episodeNumber_1 = parseRequestResult.data.parsedEpisodeInfo.episodeNumbers[0];
                        return "".concat(arrHost, "/api/v3/rename?seriesId=").concat(id, "&seasonNumber=").concat(parseRequestResult.data.parsedEpisodeInfo.seasonNumber);
                    }, function (id, previewRenameRequestResult) {
                        var episodeFile = previewRenameRequestResult.data.find(function (episFile) { return episFile.episodeNumbers[0] === episodeNumber_1; });
                        (existingPath = episodeFile.existingPath, newPath = episodeFile.newPath);
                        return {
                            name: 'RenameFiles',
                            seriesId: id,
                            files: [episodeFile.episodeFileId]
                        };
                    })];
            case 3:
                _d.sent();
                return [3 /*break*/, 5];
            case 4:
                args.jobLog('No arr specified in plugin inputs.');
                _d.label = 5;
            case 5:
                newFileId = args.inputFileObj.replace(existingPath, newPath);
                args.jobLog("New file id ".concat(newFileId));
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: newFileId
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
