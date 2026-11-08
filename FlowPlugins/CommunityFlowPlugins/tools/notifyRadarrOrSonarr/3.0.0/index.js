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
    name: 'Notify Radarr or Sonarr',
    description: 'Notify Radarr or Sonarr to refresh after file change. '
        + 'Waits for the scan to complete before continuing. Optionally unmonitor the item afterwards.',
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
        {
            label: 'Unmonitor after refresh',
            name: 'unmonitor_after_refresh',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'If enabled: unmonitor the movie (Radarr) or the episodes in this file (Sonarr) '
                + 'after refreshing.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Radarr or Sonarr notified',
        },
        {
            number: 2,
            tooltip: 'Radarr or Sonarr do not know this file, or the request failed (see job log)',
        },
    ],
}); };
exports.details = details;
var POLL_INTERVAL_SECONDS = 5;
var TIMEOUT_SECONDS = 120;
var isArrRequestFailure = function (err) { return (typeof err === 'object' && err !== null && 'path' in err && 'method' in err && 'message' in err); };
var arrRequest = function (args, arrApp, req) { return __awaiter(void 0, void 0, void 0, function () {
    var err_1, e, failure;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios(__assign({ method: req.method, url: "".concat(arrApp.host).concat(req.path).concat((_a = req.query) !== null && _a !== void 0 ? _a : ''), headers: arrApp.headers }, (req.data !== undefined ? { data: req.data } : {})))];
            case 1: return [2 /*return*/, _c.sent()];
            case 2:
                err_1 = _c.sent();
                e = err_1;
                failure = {
                    method: req.method.toUpperCase(),
                    path: req.path,
                    status: (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.status,
                    message: (e === null || e === void 0 ? void 0 : e.message) || String(err_1),
                };
                throw failure;
            case 3: return [2 /*return*/];
        }
    });
}); };
var logFailure = function (args, arrApp, err) {
    var arrName = arrApp.name === 'radarr' ? 'Radarr' : 'Sonarr';
    if (isArrRequestFailure(err)) {
        var status_1 = err.status !== undefined ? "HTTP ".concat(err.status, " ") : '';
        args.jobLog("\u2716 ".concat(arrName, " request failed: ").concat(status_1, "on ").concat(err.method, " ").concat(err.path, ": ").concat(err.message));
        if (err.status === 401) {
            args.jobLog('Hint: check the API key and that the host points at the correct arr (Sonarr vs Radarr).');
        }
    }
    else {
        args.jobLog("\u2716 ".concat(arrName, " notify failed: ").concat((err === null || err === void 0 ? void 0 : err.message) || String(err)));
    }
    args.jobLog("".concat(arrName, " was not notified. Continuing on output 2; the file is unchanged."));
};
var waitForCommand = function (args, arrApp, commandId) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, timeoutMs, pollIntervalMs, elapsed, res, status_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                startTime = Date.now();
                timeoutMs = TIMEOUT_SECONDS * 1000;
                pollIntervalMs = POLL_INTERVAL_SECONDS * 1000;
                args.jobLog("Waiting for command ".concat(commandId, " to complete (timeout: ").concat(TIMEOUT_SECONDS, "s)..."));
                _a.label = 1;
            case 1:
                if (!true) return [3 /*break*/, 4];
                elapsed = Date.now() - startTime;
                if (elapsed >= timeoutMs) {
                    args.jobLog("Command ".concat(commandId, " timed out after ").concat(TIMEOUT_SECONDS, "s."));
                    return [2 /*return*/, false];
                }
                // eslint-disable-next-line no-await-in-loop
                return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, pollIntervalMs);
                    })];
            case 2:
                // eslint-disable-next-line no-await-in-loop
                _a.sent();
                return [4 /*yield*/, arrRequest(args, arrApp, {
                        method: 'get',
                        path: "/api/v3/command/".concat(commandId),
                    })];
            case 3:
                res = _a.sent();
                status_2 = res.data.status;
                args.jobLog("Command ".concat(commandId, " status: ").concat(status_2));
                if (status_2 === 'completed') {
                    return [2 /*return*/, true];
                }
                if (status_2 === 'failed' || status_2 === 'aborted' || status_2 === 'cancelled') {
                    args.jobLog("Command ".concat(commandId, " ended with status: ").concat(status_2));
                    return [2 /*return*/, false];
                }
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Plex-style {tmdb-1234} (Radarr) / {tvdb-1234} (Sonarr) tag, else an imdb id anywhere in the path
// (which also covers {imdb-tt1234567}); '' means fall back to the parse API.
var getLookupTerm = function (arrName, fileName) {
    var _a, _b;
    var db = arrName === 'radarr' ? 'tmdb' : 'tvdb';
    var dbId = (_a = new RegExp("\\{".concat(db, "-(\\d+)\\}"), 'i').exec(fileName)) === null || _a === void 0 ? void 0 : _a[1];
    if (dbId) {
        return "".concat(db, ":").concat(dbId);
    }
    var imdbId = (_b = /\b(?:tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)) === null || _b === void 0 ? void 0 : _b[0];
    return imdbId ? "imdb:".concat(imdbId) : '';
};
var getId = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var term, id, _a, _b, _c;
    var _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                term = getLookupTerm(arrApp.name, fileName);
                id = -1;
                if (!(term !== '')) return [3 /*break*/, 2];
                _a = Number;
                return [4 /*yield*/, arrRequest(args, arrApp, {
                        method: 'get',
                        path: "/api/v3/".concat(arrApp.name === 'radarr' ? 'movie' : 'series', "/lookup"),
                        query: "?term=".concat(term),
                    })];
            case 1:
                id = _a.apply(void 0, [(_f = (_e = (_d = (_g.sent()).data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : -1]);
                args.jobLog("".concat(arrApp.content, " ").concat(id !== -1 ? "'".concat(id, "' found") : 'not found', " for '").concat(term, "'"));
                return [3 /*break*/, 3];
            case 2:
                args.jobLog('No tvdb/tmdb/imdb tag in path, using parse API');
                _g.label = 3;
            case 3:
                if (!(id === -1)) return [3 /*break*/, 5];
                _c = (_b = arrApp.delegates).getIdFromParseResponse;
                return [4 /*yield*/, arrRequest(args, arrApp, {
                        method: 'get',
                        path: '/api/v3/parse',
                        query: "?title=".concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                    })];
            case 4:
                id = _c.apply(_b, [(_g.sent())]);
                args.jobLog("".concat(arrApp.content, " ").concat(id !== -1 ? "'".concat(id, "' found") : 'not found', " for '").concat((0, fileUtils_1.getFileName)(fileName), "'"));
                _g.label = 5;
            case 5: return [2 /*return*/, id];
        }
    });
}); };
var unmonitorRadarr = function (args, arrApp, movieId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Editor endpoint only changes the monitored flag, avoiding a full-object PUT
            return [4 /*yield*/, args.deps.axios({
                    method: 'put',
                    url: "".concat(arrApp.host, "/api/v3/movie/editor"),
                    headers: arrApp.headers,
                    data: JSON.stringify({ movieIds: [movieId], monitored: false }),
                })];
            case 1:
                // Editor endpoint only changes the monitored flag, avoiding a full-object PUT
                _a.sent();
                args.jobLog("\u2714 Radarr: movie id=".concat(movieId, " unmonitored"));
                return [2 /*return*/];
        }
    });
}); };
// Sonarr's parse API knows the episodes in a file, including multi-episode, daily and anime
// absolute names; only episodes of the series we refreshed are kept.
var getEpisodesFromParse = function (args, arrApp, seriesId, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var res, episodes, err_2, reason;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, arrRequest(args, arrApp, {
                        method: 'get',
                        path: '/api/v3/parse',
                        query: "?title=".concat(encodeURIComponent((0, fileUtils_1.getFileName)(filePath))),
                    })];
            case 1:
                res = _b.sent();
                episodes = Array.isArray((_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.episodes)
                    ? res.data.episodes
                    : [];
                return [2 /*return*/, episodes.filter(function (e) { return Number.isInteger(e === null || e === void 0 ? void 0 : e.id)
                        && (e.seriesId === undefined || e.seriesId === seriesId); })];
            case 2:
                err_2 = _b.sent();
                reason = isArrRequestFailure(err_2)
                    ? "".concat(err_2.status !== undefined ? "HTTP ".concat(err_2.status, " ") : '').concat(err_2.message)
                    : String(err_2);
                args.jobLog("Sonarr: parse failed (".concat(reason, "), falling back to SxxEyy in the file name"));
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Fallback when parse matches nothing: SxxEyy from the file name, including S01E01E02 and S01E01-E02
var getEpisodesFromFileName = function (args, arrApp, seriesId, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var sxe, season, episodeNumbers, episodes, matches, wanted;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                sxe = /S(\d{1,2})((?:[-_ ]?E\d{1,3})+)/i.exec((0, fileUtils_1.getFileName)(filePath));
                if (!sxe) {
                    args.jobLog("Sonarr: cannot unmonitor \u2013 SxxEyy not detected in \"".concat((0, fileUtils_1.getFileName)(filePath), "\""));
                    return [2 /*return*/, null];
                }
                season = Number(sxe[1]);
                episodeNumbers = ((_a = sxe[2].match(/\d{1,3}/g)) !== null && _a !== void 0 ? _a : []).map(Number);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/episode"),
                        headers: arrApp.headers,
                        params: { seriesId: seriesId },
                    })];
            case 1:
                episodes = (_b.sent()).data;
                matches = (Array.isArray(episodes) ? episodes : []).filter(function (e) { return e.seasonNumber === season
                    && episodeNumbers.includes(e.episodeNumber); });
                if (matches.length === 0) {
                    wanted = episodeNumbers.map(function (n) { return "S".concat(season, "E").concat(n); }).join(', ');
                    args.jobLog("Sonarr: episode ".concat(wanted, " not found in seriesId ").concat(seriesId));
                }
                return [2 /*return*/, matches];
        }
    });
}); };
var unmonitorSonarrEpisode = function (args, arrApp, seriesId, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var episodes, episodeIds, names, ids;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getEpisodesFromParse(args, arrApp, seriesId, filePath)];
            case 1:
                episodes = _b.sent();
                if (!(episodes.length === 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, getEpisodesFromFileName(args, arrApp, seriesId, filePath)];
            case 2:
                episodes = (_a = _b.sent()) !== null && _a !== void 0 ? _a : [];
                _b.label = 3;
            case 3:
                if (episodes.length === 0) {
                    return [2 /*return*/];
                }
                episodeIds = episodes.map(function (e) { return e.id; });
                return [4 /*yield*/, args.deps.axios({
                        method: 'put',
                        url: "".concat(arrApp.host, "/api/v3/episode/monitor"),
                        headers: arrApp.headers,
                        data: JSON.stringify({ monitored: false, episodeIds: episodeIds }),
                    })];
            case 4:
                _b.sent();
                names = episodes.map(function (e) { return "S".concat(e.seasonNumber, "E").concat(e.episodeNumber); }).join(', ');
                ids = episodeIds.length === 1
                    ? "episodeId=".concat(episodeIds[0])
                    : "episodeIds=".concat(episodeIds.join(', '));
                args.jobLog("\u2714 Sonarr: unmonitored ".concat(names, " (").concat(ids, ")"));
                return [2 /*return*/];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, refreshed, arr, arr_host, arrHost, unmonitorAfterRefresh, originalFileName, currentFileName, headers, arrApp, id, commandResponse, commandId, err_3, e_1;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                refreshed = false;
                arr = String(args.inputs.arr);
                arr_host = String(args.inputs.arr_host);
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                unmonitorAfterRefresh = Boolean(args.inputs.unmonitor_after_refresh);
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
                            buildRefreshRequestData: function (id) { return JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }); },
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Series',
                        delegates: {
                            getIdFromParseResponse: function (parseResponse) { var _a, _b, _c; return Number((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1); },
                            buildRefreshRequestData: function (id) { return JSON.stringify({ name: 'RefreshSeries', seriesId: id }); },
                        },
                    };
                args.jobLog('Going to force scan');
                args.jobLog("Refreshing ".concat(arrApp.name, "..."));
                id = -1;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 8, , 9]);
                return [4 /*yield*/, getId(args, arrApp, originalFileName)];
            case 2:
                id = _e.sent();
                if (!(id === -1 && currentFileName !== originalFileName)) return [3 /*break*/, 4];
                return [4 /*yield*/, getId(args, arrApp, currentFileName)];
            case 3:
                id = _e.sent();
                _e.label = 4;
            case 4:
                if (!(id !== -1)) return [3 /*break*/, 7];
                return [4 /*yield*/, arrRequest(args, arrApp, {
                        method: 'post',
                        path: '/api/v3/command',
                        data: arrApp.delegates.buildRefreshRequestData(id),
                    })];
            case 5:
                commandResponse = _e.sent();
                commandId = commandResponse.data.id;
                args.jobLog("".concat(arrApp.content, " '").concat(id, "' refresh queued in ").concat(arrApp.name, " (command ").concat(commandId, ")."));
                return [4 /*yield*/, waitForCommand(args, arrApp, commandId)];
            case 6:
                refreshed = _e.sent();
                _e.label = 7;
            case 7: return [3 /*break*/, 9];
            case 8:
                err_3 = _e.sent();
                logFailure(args, arrApp, err_3);
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 9:
                if (!(id !== -1)) return [3 /*break*/, 17];
                if (!!refreshed) return [3 /*break*/, 10];
                args.jobLog("\u26A0 ".concat(arrApp.content, " '").concat(id, "' scan did not complete within timeout."));
                return [3 /*break*/, 17];
            case 10:
                args.jobLog("\u2714 ".concat(arrApp.content, " '").concat(id, "' scan completed in ").concat(arrApp.name, "."));
                if (!unmonitorAfterRefresh) return [3 /*break*/, 17];
                _e.label = 11;
            case 11:
                _e.trys.push([11, 16, , 17]);
                if (!(arr === 'radarr')) return [3 /*break*/, 13];
                return [4 /*yield*/, unmonitorRadarr(args, arrApp, id)];
            case 12:
                _e.sent();
                return [3 /*break*/, 15];
            case 13: return [4 /*yield*/, unmonitorSonarrEpisode(args, arrApp, id, originalFileName || currentFileName)];
            case 14:
                _e.sent();
                _e.label = 15;
            case 15: return [3 /*break*/, 17];
            case 16:
                e_1 = _e.sent();
                args.jobLog("Unmonitor error (non-fatal): ".concat((e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || String(e_1)));
                return [3 /*break*/, 17];
            case 17: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: refreshed ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
