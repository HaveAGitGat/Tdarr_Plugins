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
var details = function () { return ({
    name: 'Unmonitor in Sonarr',
    description: 'Unmonitor episode in Sonarr after successful transcode to prevent re-downloading',
    style: {
        borderColor: 'red',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faEyeSlash',
    inputs: [
        {
            label: 'Sonarr API Key',
            name: 'sonarr_api_key',
            type: 'string',
            defaultValue: 'Your-API-Key-Here',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your Sonarr API key here',
        },
        {
            label: 'Sonarr Host',
            name: 'sonarr_host',
            type: 'string',
            defaultValue: 'http://192.168.1.1:8989',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your Sonarr host here.'
                + '\\nExample:\\n'
                + 'http://192.168.1.1:8989\\n'
                + 'https://sonarr.domain.com\\n',
        },
        {
            label: 'Unmonitor Series If No Episodes Remain',
            name: 'unmonitor_series',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Also unmonitor the series if no monitored episodes remain',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Episode unmonitored successfully',
        },
        {
            number: 2,
            tooltip: 'Episode not found or already unmonitored',
        },
    ],
}); };
exports.details = details;
var getEpisodeInfo = function (args, host, headers, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var info, imdbId, lookupResponse, series, seasonEpisodeMatch, error_1, parseResponse, seriesResponse, seriesTitle, episodeRef, error_2, allSeriesResponse, allSeries, fileDir_1, series, episodesResponse, episodes, episode, episodeRef, error_3, episodesResponse, episodes, error_4;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                info = { seriesId: -1, seasonNumber: -1, episodeNumber: -1 };
                imdbId = (_b = (_a = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)) === null || _a === void 0 ? void 0 : _a.at(0)) !== null && _b !== void 0 ? _b : '';
                if (!(imdbId !== '')) return [3 /*break*/, 4];
                _o.label = 1;
            case 1:
                _o.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/series/lookup?term=imdb:").concat(imdbId),
                        headers: headers,
                    })];
            case 2:
                lookupResponse = _o.sent();
                series = (_c = lookupResponse.data) === null || _c === void 0 ? void 0 : _c.at(0);
                if (series) {
                    info.seriesId = series.id;
                    info.series = series;
                    seasonEpisodeMatch = /\bS(\d{1,3})E(\d{1,4})\b/i.exec(fileName);
                    if (seasonEpisodeMatch) {
                        info.seasonNumber = parseInt(seasonEpisodeMatch[1], 10);
                        info.episodeNumber = parseInt(seasonEpisodeMatch[2], 10);
                    }
                    args.jobLog("Series '".concat(series.title, "' (ID: ").concat(series.id, ") found for IMDB '").concat(imdbId, "'"));
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _o.sent();
                args.jobLog("Error looking up IMDB ".concat(imdbId, ": ").concat(error_1));
                return [3 /*break*/, 4];
            case 4:
                if (!(info.seriesId === -1 || info.seasonNumber === -1 || info.episodeNumber === -1)) return [3 /*break*/, 10];
                _o.label = 5;
            case 5:
                _o.trys.push([5, 9, , 10]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: headers,
                    })];
            case 6:
                parseResponse = _o.sent();
                if (!((_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.series) === null || _e === void 0 ? void 0 : _e.id)) return [3 /*break*/, 8];
                info.seriesId = parseResponse.data.series.id;
                info.seasonNumber = (_g = (_f = parseResponse.data.parsedEpisodeInfo) === null || _f === void 0 ? void 0 : _f.seasonNumber) !== null && _g !== void 0 ? _g : 1;
                info.episodeNumber = (_k = (_j = (_h = parseResponse.data.parsedEpisodeInfo) === null || _h === void 0 ? void 0 : _h.episodeNumbers) === null || _j === void 0 ? void 0 : _j.at(0)) !== null && _k !== void 0 ? _k : 1;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/series/").concat(info.seriesId),
                        headers: headers,
                    })];
            case 7:
                seriesResponse = _o.sent();
                info.series = seriesResponse.data;
                seriesTitle = (_m = (_l = info.series) === null || _l === void 0 ? void 0 : _l.title) !== null && _m !== void 0 ? _m : 'Unknown';
                episodeRef = "S".concat(info.seasonNumber, "E").concat(info.episodeNumber);
                args.jobLog("Series '".concat(seriesTitle, "' found for '").concat((0, fileUtils_1.getFileName)(fileName), "' - ").concat(episodeRef));
                _o.label = 8;
            case 8: return [3 /*break*/, 10];
            case 9:
                error_2 = _o.sent();
                args.jobLog("Error parsing filename: ".concat(error_2));
                return [3 /*break*/, 10];
            case 10:
                if (!(info.seriesId === -1)) return [3 /*break*/, 16];
                _o.label = 11;
            case 11:
                _o.trys.push([11, 15, , 16]);
                args.jobLog('Attempting to find episode by file path...');
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/series"),
                        headers: headers,
                    })];
            case 12:
                allSeriesResponse = _o.sent();
                allSeries = allSeriesResponse.data || [];
                fileDir_1 = fileName.substring(0, fileName.lastIndexOf('/'));
                series = allSeries.find(function (s) {
                    if (!s.path)
                        return false;
                    return fileName.startsWith(s.path) || fileDir_1.startsWith(s.path);
                });
                if (!series) return [3 /*break*/, 14];
                info.seriesId = series.id;
                info.series = series;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/episode?seriesId=").concat(series.id),
                        headers: headers,
                    })];
            case 13:
                episodesResponse = _o.sent();
                episodes = episodesResponse.data || [];
                episode = episodes.find(function (e) { var _a; return e.hasFile && ((_a = e.episodeFile) === null || _a === void 0 ? void 0 : _a.path) === fileName; });
                if (episode) {
                    info.episode = episode;
                    info.seasonNumber = episode.seasonNumber;
                    info.episodeNumber = episode.episodeNumber;
                    episodeRef = "S".concat(episode.seasonNumber, "E").concat(episode.episodeNumber);
                    args.jobLog("Episode found: ".concat(series.title, " - ").concat(episodeRef, " - ").concat(episode.title));
                }
                _o.label = 14;
            case 14: return [3 /*break*/, 16];
            case 15:
                error_3 = _o.sent();
                args.jobLog("Error searching by file path: ".concat(error_3));
                return [3 /*break*/, 16];
            case 16:
                if (!(info.seriesId !== -1 && info.seasonNumber !== -1 && info.episodeNumber !== -1 && !info.episode)) return [3 /*break*/, 20];
                _o.label = 17;
            case 17:
                _o.trys.push([17, 19, , 20]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/episode?seriesId=").concat(info.seriesId, "&seasonNumber=").concat(info.seasonNumber),
                        headers: headers,
                    })];
            case 18:
                episodesResponse = _o.sent();
                episodes = episodesResponse.data || [];
                info.episode = episodes.find(function (e) { return e.episodeNumber === info.episodeNumber; });
                return [3 /*break*/, 20];
            case 19:
                error_4 = _o.sent();
                args.jobLog("Error fetching episode details: ".concat(error_4));
                return [3 /*break*/, 20];
            case 20: return [2 /*return*/, info];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, sonarr_host, sonarrHost, originalFileName, currentFileName, unmonitorSeries, headers, episodeInfo, updatedEpisode, episodeTitle, episodeRef, allEpisodesResponse, allEpisodes, currentEpisodeId_1, filteredEpisodes, remainingMonitored, updatedSeries, seriesTitle, message, error_5, error_6;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                sonarr_host = String(args.inputs.sonarr_host).trim();
                sonarrHost = sonarr_host.endsWith('/') ? sonarr_host.slice(0, -1) : sonarr_host;
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                unmonitorSeries = Boolean(args.inputs.unmonitor_series);
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(args.inputs.sonarr_api_key),
                    Accept: 'application/json',
                };
                args.jobLog('Attempting to unmonitor episode in Sonarr');
                args.jobLog("Checking file: ".concat(currentFileName));
                return [4 /*yield*/, getEpisodeInfo(args, sonarrHost, headers, originalFileName)];
            case 1:
                episodeInfo = _f.sent();
                if (!(episodeInfo.seriesId === -1 && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getEpisodeInfo(args, sonarrHost, headers, currentFileName)];
            case 2:
                episodeInfo = _f.sent();
                _f.label = 3;
            case 3:
                if (!(episodeInfo.episode && episodeInfo.episode.monitored)) return [3 /*break*/, 14];
                _f.label = 4;
            case 4:
                _f.trys.push([4, 12, , 13]);
                updatedEpisode = __assign(__assign({}, episodeInfo.episode), { monitored: false });
                return [4 /*yield*/, args.deps.axios({
                        method: 'put',
                        url: "".concat(sonarrHost, "/api/v3/episode/").concat(episodeInfo.episode.id),
                        headers: headers,
                        data: updatedEpisode,
                    })];
            case 5:
                _f.sent();
                episodeTitle = episodeInfo.episode.title;
                episodeRef = "S".concat(episodeInfo.seasonNumber, "E").concat(episodeInfo.episodeNumber);
                args.jobLog("\u2705 Episode '".concat(episodeTitle, "' (").concat(episodeRef, ") successfully unmonitored"));
                if (!(unmonitorSeries && episodeInfo.series)) return [3 /*break*/, 11];
                _f.label = 6;
            case 6:
                _f.trys.push([6, 10, , 11]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(sonarrHost, "/api/v3/episode?seriesId=").concat(episodeInfo.seriesId),
                        headers: headers,
                    })];
            case 7:
                allEpisodesResponse = _f.sent();
                allEpisodes = allEpisodesResponse.data || [];
                currentEpisodeId_1 = (_e = episodeInfo.episode) === null || _e === void 0 ? void 0 : _e.id;
                filteredEpisodes = allEpisodes.filter(function (e) {
                    var isDifferentEpisode = e.id !== currentEpisodeId_1;
                    return isDifferentEpisode && e.monitored && e.hasFile;
                });
                remainingMonitored = filteredEpisodes.length;
                if (!(remainingMonitored === 0 && episodeInfo.series.monitored)) return [3 /*break*/, 9];
                updatedSeries = __assign(__assign({}, episodeInfo.series), { monitored: false });
                return [4 /*yield*/, args.deps.axios({
                        method: 'put',
                        url: "".concat(sonarrHost, "/api/v3/series/").concat(episodeInfo.seriesId),
                        headers: headers,
                        data: updatedSeries,
                    })];
            case 8:
                _f.sent();
                seriesTitle = episodeInfo.series.title;
                message = "\u2705 Series '".concat(seriesTitle, "' also unmonitored (no monitored episodes with files remain)");
                args.jobLog(message);
                _f.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                error_5 = _f.sent();
                args.jobLog("Warning: Could not check/unmonitor series: ".concat(error_5));
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
            case 12:
                error_6 = _f.sent();
                args.jobLog("\u274C Error unmonitoring episode: ".concat(error_6));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 13: return [3 /*break*/, 15];
            case 14:
                if (episodeInfo.episode && !episodeInfo.episode.monitored) {
                    args.jobLog('Episode is already unmonitored');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                _f.label = 15;
            case 15:
                args.jobLog('Episode not found in Sonarr');
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
