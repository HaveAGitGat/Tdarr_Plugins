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
// ===== CONSTANTS =====
var NOT_FOUND_ID = '-1';
var DEFAULT_SEASON = 1;
var DEFAULT_EPISODE = 1;
var DEFAULT_EPISODE_ID = '1';
var DEFAULT_LANGUAGE_CODE = 'und';
var LANGUAGE_API_TIMEOUT = 5000;
var ARR_API_TIMEOUT = 10000;
var API_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};
// eslint-disable-next-line max-len
var LANGUAGE_API_BASE_URL = 'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/iso-language-codes-639-1-and-639-2@public/records';
var details = function () { return ({
    name: 'Set Flow Variables From Radarr Or Sonarr',
    description: 'Set Flow Variables From Radarr or Sonarr. The variables set are : '
        + 'ArrId (internal id for Radarr or Sonarr), '
        + 'ArrOriginalLanguageCode (code of the orignal language (ISO 639-2) as know by Radarr or Sonarr), '
        + 'ArrProfileLanguageCode (code of the orignal language (ISO 639-2) as know by Radarr or Sonarr), '
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
// ===== HELPER FUNCTIONS =====
var createHeaders = function (apiKey) { return (__assign(__assign({}, API_HEADERS), { 'X-Api-Key': apiKey })); };
/**
 * Builds a search term from filename by extracting TVDB, TMDB, or IMDB IDs
 * Supports formats: tvdb-123, tvdbid-123, tmdb-456, tmdbid-456, imdb-tt123456, imdbid-tt123456
 * @param filePath - The file path to extract ID from
 * @returns Formatted search term or null if no ID found
 */
var buildTerm = function (filePath) {
    // Match tvdb or tvdbid followed by numbers
    var tvdbMatch = filePath.match(/tvdb(?:id)?-(\d+)/i);
    if (tvdbMatch === null || tvdbMatch === void 0 ? void 0 : tvdbMatch[1])
        return "tvdb:".concat(tvdbMatch[1]);
    // Match tmdb or tmdbid followed by numbers
    var tmdbMatch = filePath.match(/tmdb(?:id)?-(\d+)/i);
    if (tmdbMatch === null || tmdbMatch === void 0 ? void 0 : tmdbMatch[1])
        return "tmdb:".concat(tmdbMatch[1]);
    // Match imdb or imdbid followed by IMDB ID format (tt, nm, co, ev, ch, ni + numbers)
    var imdbMatch = filePath.match(/imdb(?:id)?-((?:tt|nm|co|ev|ch|ni)\d+)/i);
    if (imdbMatch === null || imdbMatch === void 0 ? void 0 : imdbMatch[1])
        return "imdb:".concat(imdbMatch[1]);
    return null;
};
/**
 * Extracts season and episode numbers from filename
 * Supports format: S01E01, S1E1, s01e01, etc.
 * @param fileName - The filename to parse
 * @returns Object with seasonNumber and episodeNumber
 */
var extractSeasonEpisodeInfo = function (fileName) {
    var seasonEpisodeMatch = /\bS(\d{1,3})E(\d{1,4})\b/i.exec(fileName);
    return ((seasonEpisodeMatch === null || seasonEpisodeMatch === void 0 ? void 0 : seasonEpisodeMatch[1]) && (seasonEpisodeMatch === null || seasonEpisodeMatch === void 0 ? void 0 : seasonEpisodeMatch[2]))
        ? {
            seasonNumber: Number(seasonEpisodeMatch[1]),
            episodeNumber: Number(seasonEpisodeMatch[2]),
        }
        : {
            seasonNumber: -1,
            episodeNumber: -1,
        };
};
// ===== API INTERACTION FUNCTIONS =====
/**
 * Retrieves the language name from a quality profile
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param qualityProfileId - The quality profile ID to query
 * @returns Language name or undefined if not found or on error
 */
var retrieveQualityProfileLanguageName = function (args, config, qualityProfileId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_1, errorMessage;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/qualityProfile/").concat(qualityProfileId),
                        headers: createHeaders(config.apiKey),
                        timeout: ARR_API_TIMEOUT,
                    })];
            case 1:
                response = _b.sent();
                data = response.data;
                return [2 /*return*/, (_a = data === null || data === void 0 ? void 0 : data.language) === null || _a === void 0 ? void 0 : _a.name];
            case 2:
                error_1 = _b.sent();
                errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                args.jobLog("Retrieve profile language name failed for profile ".concat(qualityProfileId, ": ").concat(errorMessage));
                return [2 /*return*/, undefined];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * Fills in episode details for a Sonarr series
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param seriesId - The series ID
 * @param seasonNumber - The season number
 * @param episodeNumber - The episode number
 * @returns Episode ID or default value on error
 */
var retrieveEpisodeId = function (args, config, seriesId, seasonNumber, episodeNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var response, episodesArray, episodeItem, error_2, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/episode?seriesId=").concat(seriesId, "&seasonNumber=").concat(seasonNumber),
                        headers: createHeaders(config.apiKey),
                        timeout: ARR_API_TIMEOUT,
                    })];
            case 1:
                response = _a.sent();
                episodesArray = response.data;
                if (!episodesArray || episodesArray.length === 0) {
                    throw new Error("No episodes found for series ".concat(seriesId, " season ").concat(seasonNumber));
                }
                episodeItem = episodesArray.find(function (episode) { return episode.episodeNumber === episodeNumber; });
                if (!episodeItem) {
                    throw new Error("Episode ".concat(episodeNumber, " not found in series ").concat(seriesId, " season ").concat(seasonNumber, ". ")
                        + "Available episodes: ".concat(episodesArray.map(function (e) { return e.episodeNumber; }).join(', ')));
                }
                return [2 /*return*/, String(episodeItem.id)];
            case 2:
                error_2 = _a.sent();
                errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                args.jobLog("Fill episode info failed: ".concat(errorMessage));
                return [2 /*return*/, DEFAULT_EPISODE_ID];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * Looks up content in Radarr/Sonarr by external ID (TVDB, TMDB, IMDB)
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param fileName - The filename to extract ID from
 * @returns File information or not found indicator
 */
var lookupContent = function (args, config, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var term, contentType, response, contentArray, content, baseInfo, _a, seasonNumber, episodeNumber, episodeId, profileLanguageName, error_3, errorMessage;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                term = buildTerm(fileName);
                if (!term) {
                    return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
                }
                args.jobLog("Found ".concat(term, " in the file path"));
                _d.label = 1;
            case 1:
                _d.trys.push([1, 7, , 8]);
                contentType = config.name === 'radarr' ? 'movie' : 'series';
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/").concat(contentType, "/lookup?term=").concat(encodeURIComponent(term)),
                        headers: createHeaders(config.apiKey),
                        timeout: ARR_API_TIMEOUT,
                    })];
            case 2:
                response = _d.sent();
                contentArray = response.data;
                content = contentArray === null || contentArray === void 0 ? void 0 : contentArray[0];
                if (!content) {
                    args.jobLog("No content found for ".concat(term));
                    return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
                }
                baseInfo = {
                    id: String(content.id),
                    originalLanguageName: (_c = (_b = content.originalLanguage) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : '',
                };
                if (!(config.name === 'sonarr')) return [3 /*break*/, 4];
                _a = extractSeasonEpisodeInfo(fileName), seasonNumber = _a.seasonNumber, episodeNumber = _a.episodeNumber;
                if (seasonNumber === -1 || episodeNumber === -1) {
                    args.jobLog("Could not extract season/episode info from filename: ".concat(fileName));
                    return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
                }
                return [4 /*yield*/, retrieveEpisodeId(args, config, baseInfo.id, seasonNumber, episodeNumber)];
            case 3:
                episodeId = _d.sent();
                return [2 /*return*/, __assign(__assign({ type: 'sonarr' }, baseInfo), { seasonNumber: seasonNumber, episodeNumber: episodeNumber, episodeId: episodeId })];
            case 4:
                if (!(config.name === 'radarr')) return [3 /*break*/, 6];
                return [4 /*yield*/, retrieveQualityProfileLanguageName(args, config, content.qualityProfileId)];
            case 5:
                profileLanguageName = _d.sent();
                return [2 /*return*/, __assign(__assign({ type: 'radarr' }, baseInfo), { profileLanguageName: profileLanguageName })];
            case 6: return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
            case 7:
                error_3 = _d.sent();
                errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
                args.jobLog("Lookup failed for ".concat(term, ": ").concat(errorMessage));
                return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
            case 8: return [2 /*return*/];
        }
    });
}); };
/**
 * Parses filename to find content in Radarr/Sonarr
 * @param args - Plugin input arguments
 * @param config - Arr configuration
 * @param fileName - The filename to parse
 * @returns File information or not found indicator
 */
var parseContent = function (args, config, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var data, content, baseInfo, profileLanguageName, error_4, errorMessage;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                _l.trys.push([0, 4, , 5]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(config.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: createHeaders(config.apiKey),
                        timeout: ARR_API_TIMEOUT,
                    })];
            case 1:
                data = (_l.sent()).data;
                content = config.name === 'radarr' ? data.movie : data.series;
                if (!content) {
                    args.jobLog("Parse did not return any ".concat(config.name === 'radarr' ? 'movie' : 'series', " data"));
                    return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
                }
                baseInfo = {
                    id: String(content.id),
                    originalLanguageName: (_b = (_a = content.originalLanguage) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                };
                if (config.name === 'sonarr') {
                    return [2 /*return*/, __assign(__assign({ type: 'sonarr' }, baseInfo), { seasonNumber: (_d = (_c = data.parsedEpisodeInfo) === null || _c === void 0 ? void 0 : _c.seasonNumber) !== null && _d !== void 0 ? _d : DEFAULT_SEASON, episodeNumber: (_g = (_f = (_e = data.parsedEpisodeInfo) === null || _e === void 0 ? void 0 : _e.episodeNumbers) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : DEFAULT_EPISODE, episodeId: String((_k = (_j = (_h = data.episodes) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.id) !== null && _k !== void 0 ? _k : DEFAULT_EPISODE_ID) })];
                }
                if (!(config.name === 'radarr')) return [3 /*break*/, 3];
                return [4 /*yield*/, retrieveQualityProfileLanguageName(args, config, content.qualityProfileId)];
            case 2:
                profileLanguageName = _l.sent();
                return [2 /*return*/, __assign(__assign({ type: 'radarr' }, baseInfo), { profileLanguageName: profileLanguageName })];
            case 3: return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
            case 4:
                error_4 = _l.sent();
                errorMessage = error_4 instanceof Error ? error_4.message : String(error_4);
                args.jobLog("Parse failed for ".concat(fileName, ": ").concat(errorMessage));
                return [2 /*return*/, { type: 'unknown', id: NOT_FOUND_ID }];
            case 5: return [2 /*return*/];
        }
    });
}); };
var languageCodeCache = new Map();
/**
 * Fetches ISO 639-2 language code from language name using external API
 * Implements caching to avoid redundant API calls
 * @param args - Plugin input arguments
 * @param languageName - The language name to look up
 * @returns ISO 639-2 (alpha3_b) language code or DEFAULT_LANGUAGE_CODE
 */
var fetchLanguageCode = function (args, languageName) { return __awaiter(void 0, void 0, void 0, function () {
    var normalizedName, cachedValue, url, data, languageCode, error_5, errorMessage;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!languageName || languageName.trim() === '') {
                    return [2 /*return*/, ''];
                }
                normalizedName = languageName.trim().toLowerCase();
                cachedValue = languageCodeCache.get(normalizedName);
                if (cachedValue !== undefined) {
                    return [2 /*return*/, cachedValue];
                }
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                url = "".concat(LANGUAGE_API_BASE_URL, "?select=alpha3_b&where=english%20%3D%20%22").concat(encodeURIComponent(languageName), "%22&limit=1");
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: url,
                        timeout: LANGUAGE_API_TIMEOUT,
                    })];
            case 2:
                data = (_d.sent()).data;
                languageCode = (_c = (_b = (_a = data.results) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.alpha3_b) !== null && _c !== void 0 ? _c : DEFAULT_LANGUAGE_CODE;
                // Cache the result
                languageCodeCache.set(normalizedName, languageCode);
                return [2 /*return*/, languageCode];
            case 3:
                error_5 = _d.sent();
                errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                args.jobLog("Failed to fetch language code for \"".concat(languageName, "\": ").concat(errorMessage));
                return [2 /*return*/, DEFAULT_LANGUAGE_CODE];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Sets flow variables based on file information from Radarr/Sonarr
 * Uses parallel language code fetching for better performance
 * @param args - Plugin input arguments
 * @param fileInfo - The file information to set variables from
 */
var setVariables = function (args, fileInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var originalLanguageCode, profileLanguageToFetch, profileLanguageCode, originalLanguageCode, _a;
    var _b;
    var _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                // eslint-disable-next-line no-param-reassign
                args.variables.user = args.variables.user || {};
                // Set common variables
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrId = fileInfo.id;
                args.jobLog("Setting variable ArrId to ".concat(args.variables.user.ArrId));
                if (!(fileInfo.type === 'sonarr')) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchLanguageCode(args, (_c = fileInfo.originalLanguageName) !== null && _c !== void 0 ? _c : '')];
            case 1:
                originalLanguageCode = _j.sent();
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrOriginalLanguageCode = originalLanguageCode;
                args.jobLog("Setting variable ArrOriginalLanguageCode to ".concat(args.variables.user.ArrOriginalLanguageCode));
                // Set Sonarr-specific variables
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrSeasonNumber = String(fileInfo.seasonNumber);
                args.jobLog("Setting variable ArrSeasonNumber to ".concat(args.variables.user.ArrSeasonNumber));
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrEpisodeNumber = String(fileInfo.episodeNumber);
                args.jobLog("Setting variable ArrEpisodeNumber to ".concat(args.variables.user.ArrEpisodeNumber));
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrEpisodeId = fileInfo.episodeId;
                args.jobLog("Setting variable ArrEpisodeId to ".concat(args.variables.user.ArrEpisodeId));
                return [3 /*break*/, 10];
            case 2:
                if (!(fileInfo.type === 'radarr')) return [3 /*break*/, 10];
                profileLanguageToFetch = ((_d = fileInfo.profileLanguageName) !== null && _d !== void 0 ? _d : '').toLowerCase();
                profileLanguageCode = '';
                originalLanguageCode = '';
                _a = profileLanguageToFetch;
                switch (_a) {
                    case 'original': return [3 /*break*/, 3];
                    case 'any': return [3 /*break*/, 5];
                }
                return [3 /*break*/, 7];
            case 3:
                args.jobLog('Profile language is "Original", using original language');
                return [4 /*yield*/, fetchLanguageCode(args, (_e = fileInfo.originalLanguageName) !== null && _e !== void 0 ? _e : '')];
            case 4:
                originalLanguageCode = _j.sent();
                profileLanguageCode = originalLanguageCode;
                return [3 /*break*/, 9];
            case 5:
                args.jobLog('Profile language is "Any", setting to "und" (undetermined)');
                return [4 /*yield*/, fetchLanguageCode(args, (_f = fileInfo.originalLanguageName) !== null && _f !== void 0 ? _f : '')];
            case 6:
                originalLanguageCode = _j.sent();
                profileLanguageCode = 'und';
                return [3 /*break*/, 9];
            case 7: return [4 /*yield*/, Promise.all([
                    fetchLanguageCode(args, (_g = fileInfo.originalLanguageName) !== null && _g !== void 0 ? _g : ''),
                    fetchLanguageCode(args, (_h = fileInfo.profileLanguageName) !== null && _h !== void 0 ? _h : ''),
                ])];
            case 8:
                _b = _j.sent(), originalLanguageCode = _b[0], profileLanguageCode = _b[1];
                return [3 /*break*/, 9];
            case 9:
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrOriginalLanguageCode = originalLanguageCode;
                args.jobLog("Setting variable ArrOriginalLanguageCode to ".concat(originalLanguageCode));
                // eslint-disable-next-line no-param-reassign
                args.variables.user.ArrProfileLanguageCode = profileLanguageCode;
                args.jobLog("Setting variable ArrProfileLanguageCode to ".concat(profileLanguageCode));
                _j.label = 10;
            case 10: return [2 /*return*/];
        }
    });
}); };
// ===== MAIN PLUGIN FUNCTION =====
/**
 * Main plugin function that orchestrates the workflow
 * 1. Attempts to lookup content by external ID
 * 2. Falls back to parsing filename if lookup fails
 * 3. Tries both original and current filenames
 * 4. Sets flow variables if content is found
 */
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, config, originalFileName, currentFileName, fileInfo, error_6, errorMessage;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _e.label = 1;
            case 1:
                _e.trys.push([1, 10, , 11]);
                config = {
                    name: args.inputs.arr,
                    host: String(args.inputs.arr_host).trim().replace(/\/$/, ''),
                    apiKey: String(args.inputs.arr_api_key).trim(),
                };
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                if (!originalFileName && !currentFileName) {
                    args.jobLog('No filename available to process');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                args.jobLog("Processing file: ".concat(originalFileName || currentFileName));
                args.jobLog("Using ".concat(config.name, " at ").concat(config.host));
                return [4 /*yield*/, lookupContent(args, config, originalFileName)];
            case 2:
                fileInfo = _e.sent();
                if (!(fileInfo.id === NOT_FOUND_ID && currentFileName !== originalFileName && currentFileName)) return [3 /*break*/, 4];
                args.jobLog('Lookup failed for original filename, trying current filename');
                return [4 /*yield*/, lookupContent(args, config, currentFileName)];
            case 3:
                fileInfo = _e.sent();
                _e.label = 4;
            case 4:
                if (!(fileInfo.id === NOT_FOUND_ID)) return [3 /*break*/, 7];
                args.jobLog('Lookup failed, attempting to parse filename');
                return [4 /*yield*/, parseContent(args, config, originalFileName)];
            case 5:
                fileInfo = _e.sent();
                if (!(fileInfo.id === NOT_FOUND_ID && currentFileName !== originalFileName && currentFileName)) return [3 /*break*/, 7];
                args.jobLog('Parse failed for original filename, trying current filename');
                return [4 /*yield*/, parseContent(args, config, currentFileName)];
            case 6:
                fileInfo = _e.sent();
                _e.label = 7;
            case 7:
                if (!(fileInfo.id !== NOT_FOUND_ID && fileInfo.type !== 'unknown')) return [3 /*break*/, 9];
                args.jobLog("Successfully found content with ID: ".concat(fileInfo.id));
                return [4 /*yield*/, setVariables(args, fileInfo)];
            case 8:
                _e.sent();
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 9:
                args.jobLog("".concat(config.name, " does not know this file"));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 10:
                error_6 = _e.sent();
                errorMessage = error_6 instanceof Error ? error_6.message : String(error_6);
                args.jobLog("Plugin execution failed: ".concat(errorMessage));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.plugin = plugin;
