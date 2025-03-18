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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Audio Remove Unwanted Languages',
    description: 'Audio Remove Unwanted Languages',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Keep Languages',
            name: 'langTags',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Choose the languages you want to keep.  Three letter format.'
                + 'Seperate additional tags with commas eng,jpn,kor  ',
        },
        {
            label: 'Keep Undefined',
            name: 'keepUndefined',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Keeps the Undefined Audio Streams',
        },
        {
            label: 'Keep Native, Requires API keys to check this if enabled.',
            name: 'keepNative',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Toggle whether to enable setting keep native. ',
        },
        {
            label: 'Priority, Check Radarr or Sonarr First',
            name: 'priority',
            type: 'string',
            defaultValue: 'Radarr',
            inputUI: {
                type: 'dropdown',
                options: [
                    'Radarr',
                    'Sonarr',
                ],
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify the audio bitrate for newly added channels',
        },
        {
            label: 'TMDB api key, It is recomended to add this under Tools Global Variables as api_key',
            name: 'api_key',
            type: 'string',
            defaultValue: '{{{args.userVariables.global.api_key}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Input your TMDB api (v3) key here. (https://www.themoviedb.org/), or use api_key as a global variable.',
        },
        {
            label: 'Radarr api key, It is recomended to add this under Tools Global Variables as radarr_api_key',
            name: 'radarr_api_key',
            type: 'string',
            defaultValue: '{{{args.userVariables.global.radarr_api_key}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Input your Radarr api key here, or use radarr_api_key as a global variable.',
        },
        {
            label: 'Radarr url, It is recomended to add this under Tools Global Variables as radarr_url',
            name: 'radarr_url',
            type: 'string',
            defaultValue: '{{{args.userVariables.global.radarr_url}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Input your Radarr url here. (With the http://), do include the port,'
                + 'or use radarr_url as a global variable.',
        },
        {
            label: 'Sonarr api key, It is recomended to add this under Tools Global Variables as sonarr_api_key',
            name: 'sonarr_api_key',
            type: 'string',
            defaultValue: '{{{args.userVariables.global.sonarr_api_key}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Input your Sonarr api key here, or use sonarr_api_key as a global variable.',
        },
        {
            label: 'Sonarr url, It is recomended to add this under Tools Global Variables as sonarr_url',
            name: 'sonarr_url',
            type: 'string',
            defaultValue: '{{{args.userVariables.global.sonarr_url}}}',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'keepNative',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Input your Sonarr url here. (With the http://), do include the port,'
                + 'or use sonarr_url as a global variable.',
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
var tmdbApi = function (filename, api_key, args) { return __awaiter(void 0, void 0, void 0, function () {
    var fileName, idRegex, fileMatch, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fileName = '';
                // If filename begins with tt, it's already an imdb id
                if (filename) {
                    if (filename.slice(0, 2) === 'tt') {
                        fileName = filename;
                    }
                    else {
                        idRegex = /(tt\d{7,8})/;
                        fileMatch = filename.match(idRegex);
                        // eslint-disable-next-line prefer-destructuring
                        if (fileMatch)
                            fileName = fileMatch[1];
                    }
                }
                if (!fileName) return [3 /*break*/, 2];
                return [4 /*yield*/, args.deps.axios
                        .get("https://api.themoviedb.org/3/find/".concat(fileName, "?api_key=")
                        + "".concat(api_key, "&language=en-US&external_source=imdb_id"))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .then(function (resp) { return (resp.data.movie_results.length > 0
                        ? resp.data.movie_results[0]
                        : resp.data.tv_results[0]); })];
            case 1:
                result = _a.sent();
                if (!result) {
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, result];
            case 2: return [2 /*return*/, null];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-explicit-any, consistent-return
var parseArrResponse = function (body, arr) {
    // eslint-disable-next-line default-case
    switch (arr) {
        case 'radarr':
            return body.movie;
        case 'sonarr':
            return body.series;
    }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var tmdbFetchResult = function (args, numberOfAudioStreams, languages) { return __awaiter(void 0, void 0, void 0, function () {
    var priority, api_key, radarr_api_key, radarr_url, sonarr_api_key, sonarr_url, tmdbResult, prio, radarrResult, sonarrResult, fileNameEncoded, _i, prio_1, arr, imdbId, _a, _b, _c;
    var _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                priority = String(args.inputs.priority);
                api_key = String(args.inputs.api_key);
                radarr_api_key = String(args.inputs.radarr_api_key);
                radarr_url = String(args.inputs.radarr_url);
                sonarr_api_key = String(args.inputs.sonarr_api_key);
                sonarr_url = String(args.inputs.sonarr_url);
                tmdbResult = null;
                if (numberOfAudioStreams === 1) {
                    args.jobLog('One audio stream detected, not checking TMDB');
                    return [2 /*return*/, null];
                }
                prio = ['radarr', 'sonarr'];
                if (priority === 'sonarr') {
                    prio = ['sonarr', 'radarr'];
                }
                radarrResult = null;
                sonarrResult = null;
                if (!((_d = args.inputFileObj.meta) === null || _d === void 0 ? void 0 : _d.FileName)) return [3 /*break*/, 12];
                fileNameEncoded = encodeURIComponent(args.inputFileObj.meta.FileName);
                _i = 0, prio_1 = prio;
                _f.label = 1;
            case 1:
                if (!(_i < prio_1.length)) return [3 /*break*/, 11];
                arr = prio_1[_i];
                imdbId = '';
                _a = arr;
                switch (_a) {
                    case 'radarr': return [3 /*break*/, 2];
                    case 'sonarr': return [3 /*break*/, 6];
                }
                return [3 /*break*/, 10];
            case 2:
                if (tmdbResult)
                    return [3 /*break*/, 10];
                if (!radarr_api_key) return [3 /*break*/, 5];
                _b = parseArrResponse;
                // eslint-disable-next-line no-await-in-loop
                return [4 /*yield*/, args.deps.axios
                        .get("".concat(radarr_url, "/api/v3/parse?apikey=").concat(radarr_api_key, "&title=").concat(fileNameEncoded))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .then(function (resp) { return resp.data; })];
            case 3: return [4 /*yield*/, _b.apply(void 0, [
                    // eslint-disable-next-line no-await-in-loop
                    _f.sent(), 'radarr'])];
            case 4:
                // eslint-disable-next-line no-await-in-loop
                radarrResult = _f.sent();
                if (radarrResult) {
                    imdbId = radarrResult.imdbId;
                    args.jobLog("Grabbed ID (".concat(imdbId, ") from Radarr "));
                    tmdbResult = { original_language: languages.getAlpha2Code((_e = radarrResult.originalLanguage) === null || _e === void 0 ? void 0 : _e.name, 'en') };
                }
                else {
                    imdbId = fileNameEncoded;
                }
                _f.label = 5;
            case 5: return [3 /*break*/, 10];
            case 6:
                if (tmdbResult)
                    return [3 /*break*/, 10];
                if (!sonarr_api_key) return [3 /*break*/, 10];
                _c = parseArrResponse;
                // eslint-disable-next-line no-await-in-loop
                return [4 /*yield*/, args.deps.axios.get("".concat(sonarr_url, "/api/v3/parse?apikey=").concat(sonarr_api_key, "&title=").concat(fileNameEncoded))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .then(function (resp) { return resp.data; })];
            case 7: return [4 /*yield*/, _c.apply(void 0, [
                    // eslint-disable-next-line no-await-in-loop
                    _f.sent(), 'sonarr'])];
            case 8:
                // eslint-disable-next-line no-await-in-loop
                sonarrResult = _f.sent();
                if (sonarrResult) {
                    imdbId = sonarrResult.imdbId;
                    args.jobLog("Grabbed ID (".concat(imdbId, ") from Sonarr "));
                }
                else {
                    imdbId = fileNameEncoded;
                }
                return [4 /*yield*/, tmdbApi(imdbId, api_key, args)];
            case 9:
                // eslint-disable-next-line no-await-in-loop
                tmdbResult = _f.sent();
                _f.label = 10;
            case 10:
                _i++;
                return [3 /*break*/, 1];
            case 11:
                if (tmdbResult) {
                    return [2 /*return*/, tmdbResult];
                }
                args.jobLog('Couldn\'t find the IMDB id of this file. I do not know what the native language is.');
                _f.label = 12;
            case 12: return [2 /*return*/, null];
        }
    });
}); };
var findNumberOfAudioStream = function (args) {
    if (args.inputFileObj.ffProbeData.streams) {
        var number = args.inputFileObj.ffProbeData.streams.filter(function (stream) { return stream.codec_type === 'audio'; }).length;
        return number;
    }
    return 0;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var refineLangTags = function (languages, langTags) {
    var master = langTags;
    langTags.forEach(function (element) {
        var lang = languages.alpha3BToAlpha2(element);
        master.push(lang);
    });
    return master;
};
var removeUnwanted = function (args, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
languages, numberOfAudioStreams, nativeLang, nativeLangBool) {
    var langTagsUnTrimmed = String(args.inputs.langTags).toLowerCase().split(',');
    var langTags = [];
    langTagsUnTrimmed.forEach(function (element) {
        var trimedElement = element.trim();
        langTags.push(trimedElement);
    });
    var keepUndefined = Boolean(args.inputs.keepUndefined);
    if (numberOfAudioStreams >= 2) {
        var langTagsMaster_1 = refineLangTags(languages, langTags);
        var audioStreamsRemoved_1 = 0;
        args.variables.ffmpegCommand.streams.forEach(function (stream) {
            var _a, _b;
            if (stream.codec_type !== 'audio') {
                return;
            }
            if (keepUndefined) {
                if ((!stream.tags || !stream.tags.language || stream.tags.language.toLowerCase().includes('und'))) {
                    return;
                }
            }
            if (stream.tags && stream.tags.language && langTagsMaster_1.includes(stream.tags.language.toLowerCase())) {
                return;
            }
            if (nativeLangBool) {
                if ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(nativeLang)) {
                    return;
                }
            }
            args.jobLog("Removing Stream ".concat(stream.index, " is unwanted"));
            // eslint-disable-next-line no-param-reassign
            stream.removed = true;
            audioStreamsRemoved_1 += 1;
        });
        if (audioStreamsRemoved_1 === numberOfAudioStreams) {
            throw new Error('All audio streams would be removed.');
        }
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, dependencies, languages, keepNative, nativeLang, nativeLangBool, numberOfAudioStreams, tmdbResult, langsTemp, originalLang;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                dependencies = ['@cospired/i18n-iso-languages'];
                return [4 /*yield*/, args.installClassicPluginDeps(dependencies)];
            case 1:
                _a.sent();
                languages = require('@cospired/i18n-iso-languages');
                keepNative = Boolean(args.inputs.keepNative);
                nativeLang = '';
                nativeLangBool = false;
                numberOfAudioStreams = Number(findNumberOfAudioStream(args));
                if (!keepNative) return [3 /*break*/, 3];
                if (!args.inputFileObj.ffProbeData.streams) return [3 /*break*/, 3];
                return [4 /*yield*/, tmdbFetchResult(args, numberOfAudioStreams, languages)];
            case 2:
                tmdbResult = _a.sent();
                if (tmdbResult) {
                    langsTemp = tmdbResult.original_language === 'cn' ? 'zh' : tmdbResult.original_language;
                    originalLang = (languages.alpha2ToAlpha3B(langsTemp));
                    nativeLang = originalLang;
                    nativeLangBool = true;
                    args.jobLog("Found ".concat(langsTemp, " using code ").concat(nativeLang));
                }
                _a.label = 3;
            case 3:
                removeUnwanted(args, languages, numberOfAudioStreams, nativeLang, nativeLangBool);
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
