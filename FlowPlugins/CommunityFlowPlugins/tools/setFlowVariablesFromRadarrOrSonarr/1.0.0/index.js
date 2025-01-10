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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Flow Variables From Radarr Or Sonarr',
    description: 'Set Flow Variables From Radarr or Sonarr. The variables set are : '
        + 'ArrId (internal id for Radarr or Sonarr), '
        + 'ArrOriginalLanguageCode (code of the orignal language (ISO 639-2) as know by Radarr or Sonarr), '
        + 'ArrSeasonNumber (the season number of the episode), '
        + 'ArrEpisodeNumber (the episode number).',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
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
            tooltip: 'Variables read from Radarr or Sonarr',
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
var getLanguageCode = function (args, languageName) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, languages;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                url = 'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/'
                    + 'iso-language-codes-639-1-and-639-2@public/'
                    + "records?select=alpha3_b&where=english%20%3D%20%22".concat(languageName, "%22&limit=1");
                return [4 /*yield*/, fetch(url)];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    args.jobLog('Failed to fetch language data');
                    return [2 /*return*/, null];
                }
                return [4 /*yield*/, response.json()];
            case 2:
                languages = _c.sent();
                if (languages.total_count !== 1) {
                    args.jobLog('Failed to fetch language data');
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, (_b = ((_a = languages.results[0]) === null || _a === void 0 ? void 0 : _a.alpha3_b)) !== null && _b !== void 0 ? _b : null];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, isSuccessful, arr, arr_host, arrHost, originalFileName, currentFileName, headers, arrApp, fInfo;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
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
                            getFileInfoFromLookupResponse: function (lookupResponse) {
                                var _a, _b, _c, _d, _e, _f, _g;
                                return ({
                                    id: String((_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                    languageName: (_g = (_f = (_e = (_d = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _d === void 0 ? void 0 : _d.at(0)) === null || _e === void 0 ? void 0 : _e.originalLanguage) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : '',
                                });
                            },
                            getFileInfoFromParseResponse: function (parseResponse) {
                                var _a, _b, _c, _d, _e, _f, _g;
                                return ({
                                    id: String((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                    languageName: (_g = (_f = (_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.movie) === null || _e === void 0 ? void 0 : _e.originalLanguage) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : '',
                                });
                            },
                            setFlowVariables: function (fInfo) { return __awaiter(void 0, void 0, void 0, function () {
                                var languageCode;
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrId = fInfo.id;
                                            args.jobLog("Setting variable ArrId to ".concat(fInfo.id));
                                            return [4 /*yield*/, getLanguageCode(args, (_a = fInfo.languageName) !== null && _a !== void 0 ? _a : '')];
                                        case 1:
                                            languageCode = (_b = (_c.sent())) !== null && _b !== void 0 ? _b : '';
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrOriginalLanguageCode = languageCode;
                                            args.jobLog("Setting variable ArrOriginalLanguageCode to ".concat(languageCode));
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Serie',
                        delegates: {
                            getFileInfoFromLookupResponse: function (lookupResponse, fileName) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                                var fInfo = {
                                    id: String((_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                    languageName: (_g = (_f = (_e = (_d = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _d === void 0 ? void 0 : _d.at(0)) === null || _e === void 0 ? void 0 : _e.originalLanguage) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : '',
                                };
                                if (fInfo.id !== '-1') {
                                    var seasonEpisodenumber = (_j = (_h = /\bS\d{1,3}E\d{1,4}\b/i.exec(fileName)) === null || _h === void 0 ? void 0 : _h.at(0)) !== null && _j !== void 0 ? _j : '';
                                    var episodeNumber = (_l = (_k = /\d{1,4}$/i.exec(seasonEpisodenumber)) === null || _k === void 0 ? void 0 : _k.at(0)) !== null && _l !== void 0 ? _l : '';
                                    fInfo.seasonNumber = Number((_o = (_m = /\d{1,3}/i
                                        .exec(seasonEpisodenumber.slice(0, -episodeNumber.length))) === null || _m === void 0 ? void 0 : _m.at(0)) !== null && _o !== void 0 ? _o : '-1');
                                    fInfo.episodeNumber = Number(episodeNumber !== '' ? episodeNumber : -1);
                                }
                                return fInfo;
                            },
                            getFileInfoFromParseResponse: function (parseResponse) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                                return ({
                                    id: String((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                    seasonNumber: (_f = (_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.parsedEpisodeInfo) === null || _e === void 0 ? void 0 : _e.seasonNumber) !== null && _f !== void 0 ? _f : 1,
                                    episodeNumber: (_k = (_j = (_h = (_g = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _g === void 0 ? void 0 : _g.parsedEpisodeInfo) === null || _h === void 0 ? void 0 : _h.episodeNumbers) === null || _j === void 0 ? void 0 : _j.at(0)) !== null && _k !== void 0 ? _k : 1,
                                    languageName: (_p = (_o = (_m = (_l = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _l === void 0 ? void 0 : _l.series) === null || _m === void 0 ? void 0 : _m.originalLanguage) === null || _o === void 0 ? void 0 : _o.name) !== null && _p !== void 0 ? _p : '',
                                });
                            },
                            setFlowVariables: function (fInfo) { return __awaiter(void 0, void 0, void 0, function () {
                                var languageCode;
                                var _a, _b, _c, _d, _e, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrId = fInfo.id;
                                            args.jobLog("Setting variable ArrId to ".concat(fInfo.id));
                                            return [4 /*yield*/, getLanguageCode(args, (_a = fInfo.languageName) !== null && _a !== void 0 ? _a : '')];
                                        case 1:
                                            languageCode = (_b = (_g.sent())) !== null && _b !== void 0 ? _b : '';
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrOriginalLanguageCode = languageCode;
                                            args.jobLog("Setting variable ArrOriginalLanguageCode to ".concat(languageCode));
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrSeasonNumber = String((_c = fInfo.seasonNumber) !== null && _c !== void 0 ? _c : 0);
                                            args.jobLog("Setting variable ArrSeasonNumber to ".concat(String((_d = fInfo.seasonNumber) !== null && _d !== void 0 ? _d : 0)));
                                            // eslint-disable-next-line no-param-reassign
                                            args.variables.user.ArrEpisodeNumber = String((_e = fInfo.episodeNumber) !== null && _e !== void 0 ? _e : 0);
                                            args.jobLog("Setting variable ArrEpisodeNumber to ".concat((_f = fInfo.episodeNumber) !== null && _f !== void 0 ? _f : 0));
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        },
                    };
                return [4 /*yield*/, getFileInfo(args, arrApp, originalFileName)];
            case 1:
                fInfo = _e.sent();
                if (!(fInfo.id === '-1' && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getFileInfo(args, arrApp, currentFileName)];
            case 2:
                fInfo = _e.sent();
                _e.label = 3;
            case 3:
                if (!(fInfo.id !== '-1')) return [3 /*break*/, 5];
                if (!args.variables.user) {
                    // eslint-disable-next-line no-param-reassign
                    args.variables.user = {};
                }
                return [4 /*yield*/, arrApp.delegates.setFlowVariables(fInfo)];
            case 4:
                _e.sent();
                isSuccessful = true;
                _e.label = 5;
            case 5: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: isSuccessful ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
