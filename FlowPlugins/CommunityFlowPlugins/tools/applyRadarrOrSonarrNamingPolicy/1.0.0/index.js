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
var getFileInfoFromLookup = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var fInfo, imdbId, lookupResponse;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                fInfo = { id: '-1' };
                imdbId = (_b = (_a = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)) === null || _a === void 0 ? void 0 : _a.at(0)) !== null && _b !== void 0 ? _b : '';
                if (!(imdbId !== '')) return [3 /*break*/, 2];
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/").concat(arrApp.name === 'radarr' ? 'movie' : 'series', "/lookup?term=imdb:").concat(imdbId),
                        headers: arrApp.headers,
                    })];
            case 1:
                lookupResponse = _c.sent();
                fInfo = arrApp.delegates.getFileInfoFromLookupResponse(lookupResponse, fileName);
                args.jobLog("".concat(arrApp.content, " ").concat(fInfo.id !== '-1' ? "'".concat(fInfo.id, "' found") : 'not found')
                    + " for imdb '".concat(imdbId, "'"));
                _c.label = 2;
            case 2: return [2 /*return*/, fInfo];
        }
    });
}); };
var getFileInfoFromParse = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var fInfo, parseResponse;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fInfo = { id: '-1' };
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: arrApp.headers,
                    })];
            case 1:
                parseResponse = _a.sent();
                fInfo = arrApp.delegates.getFileInfoFromParseResponse(parseResponse);
                args.jobLog("".concat(arrApp.content, " ").concat(fInfo.id !== '-1' ? "'".concat(fInfo.id, "' found") : 'not found')
                    + " for '".concat((0, fileUtils_1.getFileName)(fileName), "'"));
                return [2 /*return*/, fInfo];
        }
    });
}); };
var getFileInfo = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var fInfo;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getFileInfoFromLookup(args, arrApp, fileName)];
            case 1:
                fInfo = _a.sent();
                return [2 /*return*/, (fInfo.id === '-1' || (arrApp.name === 'sonarr' && (fInfo.seasonNumber === -1 || fInfo.episodeNumber === -1)))
                        ? getFileInfoFromParse(args, arrApp, fileName)
                        : fInfo];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, newPath, isSuccessful, arr, arr_host, arrHost, originalFileName, currentFileName, headers, arrApp, fInfo, previewRenameRequestResult, fileToRename;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                newPath = '';
                isSuccessful = false;
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
                            getFileInfoFromLookupResponse: function (lookupResponse) { var _a, _b, _c; return ({ id: String((_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1) }); },
                            getFileInfoFromParseResponse: function (parseResponse) { var _a, _b, _c; return ({ id: String((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1) }); },
                            buildPreviewRenameResquestUrl: function (fInfo) { return "".concat(arrHost, "/api/v3/rename?movieId=").concat(fInfo.id); },
                            getFileToRenameFromPreviewRenameResponse: function (previewRenameResponse) { var _a; return (_a = previewRenameResponse.data) === null || _a === void 0 ? void 0 : _a.at(0); },
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Serie',
                        delegates: {
                            getFileInfoFromLookupResponse: function (lookupResponse, fileName) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                                var fInfo = { id: String((_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1) };
                                if (fInfo.id !== '-1') {
                                    var seasonEpisodenumber = (_e = (_d = /\bS\d{1,3}E\d{1,4}\b/i.exec(fileName)) === null || _d === void 0 ? void 0 : _d.at(0)) !== null && _e !== void 0 ? _e : '';
                                    var episodeNumber = (_g = (_f = /\d{1,4}$/i.exec(seasonEpisodenumber)) === null || _f === void 0 ? void 0 : _f.at(0)) !== null && _g !== void 0 ? _g : '';
                                    fInfo.seasonNumber = Number((_j = (_h = /\d{1,3}/i
                                        .exec(seasonEpisodenumber.slice(0, -episodeNumber.length))) === null || _h === void 0 ? void 0 : _h.at(0)) !== null && _j !== void 0 ? _j : '-1');
                                    fInfo.episodeNumber = Number(episodeNumber !== '' ? episodeNumber : -1);
                                }
                                return fInfo;
                            },
                            getFileInfoFromParseResponse: function (parseResponse) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                                return ({
                                    id: String((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                    seasonNumber: (_f = (_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.parsedEpisodeInfo) === null || _e === void 0 ? void 0 : _e.seasonNumber) !== null && _f !== void 0 ? _f : 1,
                                    episodeNumber: (_k = (_j = (_h = (_g = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _g === void 0 ? void 0 : _g.parsedEpisodeInfo) === null || _h === void 0 ? void 0 : _h.episodeNumbers) === null || _j === void 0 ? void 0 : _j.at(0)) !== null && _k !== void 0 ? _k : 1,
                                });
                            },
                            buildPreviewRenameResquestUrl: function (fInfo) { return "".concat(arrHost, "/api/v3/rename?seriesId=").concat(fInfo.id, "&seasonNumber=").concat(fInfo.seasonNumber); },
                            getFileToRenameFromPreviewRenameResponse: function (previewRenameResponse, fInfo) {
                                var _a;
                                return (_a = previewRenameResponse.data) === null || _a === void 0 ? void 0 : _a.find(function (episodeFile) { var _a; return ((_a = episodeFile.episodeNumbers) === null || _a === void 0 ? void 0 : _a.at(0)) === fInfo.episodeNumber; });
                            },
                        },
                    };
                args.jobLog('Going to apply new name');
                args.jobLog("Renaming ".concat(arrApp.name, "..."));
                return [4 /*yield*/, getFileInfo(args, arrApp, originalFileName)];
            case 1:
                fInfo = _e.sent();
                if (!(fInfo.id === '-1' && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getFileInfo(args, arrApp, currentFileName)];
            case 2:
                fInfo = _e.sent();
                _e.label = 3;
            case 3:
                if (!(fInfo.id !== '-1')) return [3 /*break*/, 7];
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: arrApp.delegates.buildPreviewRenameResquestUrl(fInfo),
                        headers: headers,
                    })];
            case 4:
                previewRenameRequestResult = _e.sent();
                fileToRename = arrApp.delegates
                    .getFileToRenameFromPreviewRenameResponse(previewRenameRequestResult, fInfo);
                if (!(fileToRename !== undefined)) return [3 /*break*/, 6];
                newPath = "".concat((0, fileUtils_1.getFileAbosluteDir)(currentFileName), "/").concat((0, fileUtils_1.getFileName)(fileToRename.newPath), ".").concat((0, fileUtils_1.getContainer)(fileToRename.newPath));
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: currentFileName,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 5:
                isSuccessful = _e.sent();
                return [3 /*break*/, 7];
            case 6:
                isSuccessful = true;
                args.jobLog('✔ No rename necessary.');
                _e.label = 7;
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
