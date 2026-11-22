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
    name: 'Unmonitor in Radarr',
    description: 'Unmonitor movie in Radarr after successful transcode to prevent re-downloading',
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
            label: 'Radarr API Key',
            name: 'radarr_api_key',
            type: 'string',
            defaultValue: 'Your-API-Key-Here',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your Radarr API key here',
        },
        {
            label: 'Radarr Host',
            name: 'radarr_host',
            type: 'string',
            defaultValue: 'http://192.168.1.1:7878',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your Radarr host here.'
                + '\\nExample:\\n'
                + 'http://192.168.1.1:7878\\n'
                + 'https://radarr.domain.com\\n',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Movie unmonitored successfully',
        },
        {
            number: 2,
            tooltip: 'Movie not found or already unmonitored',
        },
    ],
}); };
exports.details = details;
var getMovieId = function (args, host, headers, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var imdbId, id, movie, lookupResponse, error_1, parseResponse, movieResponse, movieTitle, statusMessage, error_2, allMoviesResponse, movies, fileDir_1, error_3;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                imdbId = (_b = (_a = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)) === null || _a === void 0 ? void 0 : _a.at(0)) !== null && _b !== void 0 ? _b : '';
                id = -1;
                if (!(imdbId !== '')) return [3 /*break*/, 4];
                _j.label = 1;
            case 1:
                _j.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/movie/lookup?term=imdb:").concat(imdbId),
                        headers: headers,
                    })];
            case 2:
                lookupResponse = _j.sent();
                movie = (_c = lookupResponse.data) === null || _c === void 0 ? void 0 : _c.at(0);
                id = (_d = movie === null || movie === void 0 ? void 0 : movie.id) !== null && _d !== void 0 ? _d : -1;
                args.jobLog("Movie ".concat(id !== -1 ? "'".concat(movie === null || movie === void 0 ? void 0 : movie.title, "' (ID: ").concat(id, ") found") : 'not found', " for IMDB '").concat(imdbId, "'"));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _j.sent();
                args.jobLog("Error looking up IMDB ".concat(imdbId, ": ").concat(error_1));
                return [3 /*break*/, 4];
            case 4:
                if (!(id === -1)) return [3 /*break*/, 10];
                _j.label = 5;
            case 5:
                _j.trys.push([5, 9, , 10]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: headers,
                    })];
            case 6:
                parseResponse = _j.sent();
                id = (_g = (_f = (_e = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _e === void 0 ? void 0 : _e.movie) === null || _f === void 0 ? void 0 : _f.id) !== null && _g !== void 0 ? _g : -1;
                if (!(id !== -1)) return [3 /*break*/, 8];
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/movie/").concat(id),
                        headers: headers,
                    })];
            case 7:
                movieResponse = _j.sent();
                movie = movieResponse.data;
                _j.label = 8;
            case 8:
                movieTitle = (_h = movie === null || movie === void 0 ? void 0 : movie.title) !== null && _h !== void 0 ? _h : 'Unknown';
                statusMessage = id !== -1 ? "'".concat(movieTitle, "' (ID: ").concat(id, ") found") : 'not found';
                args.jobLog("Movie ".concat(statusMessage, " for '").concat((0, fileUtils_1.getFileName)(fileName), "'"));
                return [3 /*break*/, 10];
            case 9:
                error_2 = _j.sent();
                args.jobLog("Error parsing filename: ".concat(error_2));
                return [3 /*break*/, 10];
            case 10:
                if (!(id === -1)) return [3 /*break*/, 14];
                _j.label = 11;
            case 11:
                _j.trys.push([11, 13, , 14]);
                args.jobLog('Attempting to find movie by file path...');
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(host, "/api/v3/movie"),
                        headers: headers,
                    })];
            case 12:
                allMoviesResponse = _j.sent();
                movies = allMoviesResponse.data || [];
                fileDir_1 = fileName.substring(0, fileName.lastIndexOf('/'));
                // Find movie by exact file path or by directory
                movie = movies.find(function (m) {
                    var _a;
                    return (((_a = m.movieFile) === null || _a === void 0 ? void 0 : _a.path) === fileName)
                        || (m.path && (fileName.startsWith(m.path) || fileDir_1 === m.path));
                });
                if (movie) {
                    id = movie.id;
                    args.jobLog("Movie '".concat(movie.title, "' (ID: ").concat(id, ") found by file path"));
                }
                return [3 /*break*/, 14];
            case 13:
                error_3 = _j.sent();
                args.jobLog("Error searching by file path: ".concat(error_3));
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/, { id: id, movie: movie }];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, radarr_host, radarrHost, originalFileName, currentFileName, headers, movieData, updatedMovie, error_4;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                radarr_host = String(args.inputs.radarr_host).trim();
                radarrHost = radarr_host.endsWith('/') ? radarr_host.slice(0, -1) : radarr_host;
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(args.inputs.radarr_api_key),
                    Accept: 'application/json',
                };
                args.jobLog('Attempting to unmonitor movie in Radarr');
                args.jobLog("Checking file: ".concat(currentFileName));
                return [4 /*yield*/, getMovieId(args, radarrHost, headers, originalFileName)];
            case 1:
                movieData = _e.sent();
                if (!(movieData.id === -1 && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getMovieId(args, radarrHost, headers, currentFileName)];
            case 2:
                movieData = _e.sent();
                _e.label = 3;
            case 3:
                if (!(movieData.id !== -1 && movieData.movie)) return [3 /*break*/, 9];
                if (!movieData.movie.monitored) return [3 /*break*/, 8];
                _e.label = 4;
            case 4:
                _e.trys.push([4, 6, , 7]);
                updatedMovie = __assign(__assign({}, movieData.movie), { monitored: false });
                return [4 /*yield*/, args.deps.axios({
                        method: 'put',
                        url: "".concat(radarrHost, "/api/v3/movie/").concat(movieData.id),
                        headers: headers,
                        data: updatedMovie,
                    })];
            case 5:
                _e.sent();
                args.jobLog("\u2705 Movie '".concat(movieData.movie.title, "' (ID: ").concat(movieData.id, ") successfully unmonitored in Radarr"));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 6:
                error_4 = _e.sent();
                args.jobLog("\u274C Error unmonitoring movie: ".concat(error_4));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 7: return [3 /*break*/, 9];
            case 8:
                args.jobLog("Movie '".concat(movieData.movie.title, "' is already unmonitored"));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 9:
                args.jobLog('Movie not found in Radarr');
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
