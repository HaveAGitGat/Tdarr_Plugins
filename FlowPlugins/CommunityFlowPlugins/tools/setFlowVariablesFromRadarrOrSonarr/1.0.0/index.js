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
var API_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};
// eslint-disable-next-line max-len
var LANGUAGE_API_BASE_URL = 'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/iso-language-codes-639-1-and-639-2@public/records';
var createHeaders = function (apiKey) { return (__assign(__assign({}, API_HEADERS), { 'X-Api-Key': apiKey })); };
var buildTerm = function (filePath) {
    var tvdbMatch = filePath.match(/tvdb-(\d+)/);
    var tmdbMatch = filePath.match(/tmdb-(\d+)/);
    var imdbMatch = filePath.match(/imdb-(tt|nm|co|ev|ch|ni)(\d+)/);
    if (tvdbMatch)
        return "tvdb:".concat(tvdbMatch[1]);
    if (tmdbMatch)
        return "tmdb:".concat(tmdbMatch[1]);
    if (imdbMatch)
        return "imdb:".concat(imdbMatch[1]).concat(imdbMatch[2]);
    return null;
};
var extractSeasonEpisodeInfo = function (fileName) {
    var _a, _b;
    var seasonEpisodeMatch = /\bS(\d{1,3})E(\d{1,4})\b/i.exec(fileName);
    return {
        seasonNumber: Number((_a = seasonEpisodeMatch === null || seasonEpisodeMatch === void 0 ? void 0 : seasonEpisodeMatch[1]) !== null && _a !== void 0 ? _a : -1),
        episodeNumber: Number((_b = seasonEpisodeMatch === null || seasonEpisodeMatch === void 0 ? void 0 : seasonEpisodeMatch[2]) !== null && _b !== void 0 ? _b : -1),
    };
};
var lookupContent = function (args, config, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var term, contentType, response, content, baseInfo, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                term = buildTerm(fileName);
                if (!term)
                    return [2 /*return*/, { id: '-1' }];
                args.jobLog("Found ".concat(term, " in the file path"));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                contentType = config.name === 'radarr' ? 'movie' : 'series';
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/").concat(contentType, "/lookup?term=").concat(term),
                        headers: createHeaders(config.apiKey),
                    })];
            case 2:
                response = _c.sent();
                content = response.data[0];
                if (!content)
                    return [2 /*return*/, { id: '-1' }];
                baseInfo = {
                    id: String(content.id),
                    languageName: (_b = (_a = content.originalLanguage) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                };
                if (config.name === 'sonarr') {
                    return [2 /*return*/, __assign(__assign({}, baseInfo), extractSeasonEpisodeInfo(fileName))];
                }
                return [2 /*return*/, baseInfo];
            case 3:
                error_1 = _c.sent();
                args.jobLog("Lookup failed: ".concat(error_1.message));
                return [2 /*return*/, { id: '-1' }];
            case 4: return [2 /*return*/];
        }
    });
}); };
var parseContent = function (args, config, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, content, baseInfo, error_2;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: createHeaders(config.apiKey),
                    })];
            case 1:
                response = _h.sent();
                data = response.data;
                content = config.name === 'radarr' ? data.movie : data.series;
                if (!content)
                    return [2 /*return*/, { id: '-1' }];
                baseInfo = {
                    id: String(content.id),
                    languageName: (_b = (_a = content.originalLanguage) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                };
                if (config.name === 'sonarr') {
                    return [2 /*return*/, __assign(__assign({}, baseInfo), { seasonNumber: (_d = (_c = data.parsedEpisodeInfo) === null || _c === void 0 ? void 0 : _c.seasonNumber) !== null && _d !== void 0 ? _d : 1, episodeNumber: (_g = (_f = (_e = data.parsedEpisodeInfo) === null || _e === void 0 ? void 0 : _e.episodeNumbers) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : 1 })];
                }
                return [2 /*return*/, baseInfo];
            case 2:
                error_2 = _h.sent();
                args.jobLog("Parse failed: ".concat(error_2.message));
                return [2 /*return*/, { id: '-1' }];
            case 3: return [2 /*return*/];
        }
    });
}); };
var fetchLanguageCode = function (args, languageName) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, data, error_3;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!languageName)
                    return [2 /*return*/, ''];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                url = "".concat(LANGUAGE_API_BASE_URL, "?select=alpha3_b&where=english%20%3D%20%22").concat(languageName, "%22&limit=1");
                return [4 /*yield*/, fetch(url)];
            case 2:
                response = _c.sent();
                if (!response.ok)
                    throw new Error('Language API request failed');
                return [4 /*yield*/, response.json()];
            case 3:
                data = _c.sent();
                return [2 /*return*/, (_b = (_a = data.results[0]) === null || _a === void 0 ? void 0 : _a.alpha3_b) !== null && _b !== void 0 ? _b : ''];
            case 4:
                error_3 = _c.sent();
                args.jobLog("Failed to fetch language data: ".concat(error_3.message));
                return [2 /*return*/, ''];
            case 5: return [2 /*return*/];
        }
    });
}); };
var setVariables = function (args, fileInfo, config) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                // eslint-disable-next-line no-param-reassign
                args.variables.user = args.variables.user || {};
                // Set common variables
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrId = fileInfo.id;
                args.jobLog("Setting variable ArrId to ".concat(args.variables.user.ArrId));
                // eslint-disable-next-line no-param-reassign
                _a = args.variables.user;
                return [4 /*yield*/, fetchLanguageCode(args, (_b = fileInfo.languageName) !== null && _b !== void 0 ? _b : '')];
            case 1:
                // eslint-disable-next-line no-param-reassign
                _a.ArrOriginalLanguageCode = _e.sent();
                args.jobLog("Setting variable ArrOriginalLanguageCode to ".concat(args.variables.user.ArrOriginalLanguageCode));
                // Set Sonarr-specific variables
                if (config.name === 'sonarr') {
                    // eslint-disable-next-line no-param-reassign
                    args.variables.user.ArrSeasonNumber = String((_c = fileInfo.seasonNumber) !== null && _c !== void 0 ? _c : 0);
                    args.jobLog("Setting variable ArrSeasonNumber to ".concat(args.variables.user.ArrSeasonNumber));
                    // eslint-disable-next-line no-param-reassign
                    args.variables.user.ArrEpisodeNumber = String((_d = fileInfo.episodeNumber) !== null && _d !== void 0 ? _d : 0);
                    args.jobLog("Setting variable ArrEpisodeNumber to ".concat(args.variables.user.ArrEpisodeNumber));
                }
                return [2 /*return*/];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, config, originalFileName, currentFileName, fileInfo;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                config = {
                    name: args.inputs.arr,
                    host: String(args.inputs.arr_host).trim().replace(/\/$/, ''),
                    apiKey: String(args.inputs.arr_api_key),
                };
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                return [4 /*yield*/, lookupContent(args, config, originalFileName)];
            case 1:
                fileInfo = _e.sent();
                if (!(fileInfo.id === '-1' && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, lookupContent(args, config, currentFileName)];
            case 2:
                fileInfo = _e.sent();
                _e.label = 3;
            case 3:
                if (!(fileInfo.id === '-1')) return [3 /*break*/, 6];
                return [4 /*yield*/, parseContent(args, config, originalFileName)];
            case 4:
                fileInfo = _e.sent();
                if (!(fileInfo.id === '-1' && currentFileName !== originalFileName)) return [3 /*break*/, 6];
                return [4 /*yield*/, parseContent(args, config, currentFileName)];
            case 5:
                fileInfo = _e.sent();
                _e.label = 6;
            case 6:
                if (!(fileInfo.id !== '-1')) return [3 /*break*/, 8];
                return [4 /*yield*/, setVariables(args, fileInfo, config)];
            case 7:
                _e.sent();
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 8: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
