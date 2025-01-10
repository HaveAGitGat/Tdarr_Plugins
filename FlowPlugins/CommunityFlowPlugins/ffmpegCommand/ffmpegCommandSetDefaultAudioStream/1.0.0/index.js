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
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Default Audio Track',
    description: 'Sets the default audio track based on channels count and Radarr or SOnnar',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Use Radarr or Sonarr to get original language',
            name: 'useRadarrOrSonarr',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Should the language of the default audio track be read from Radarr or Sonarr ? If yes, the Arr, Arr API Key and Arr Host properties are mandatory and the Language property will be ignored. If no, please indicate the language to use in the Language property.',
        },
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
            label: 'Language',
            name: 'language',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify what language to use in the ISO 639-2 format.'
                + '\\nExample:\\n'
                + 'eng\\n'
                + 'fre\\n',
        },
        {
            label: 'Use the highest number of channels as default',
            name: 'useHightestNumberOfChannels',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set as the default audio stream ? If yes, the Channels property will be ignored. If no, please indicate the channels to use in the Channels property.',
        },
        {
            label: 'Channels ',
            name: 'channels',
            type: 'string',
            defaultValue: '5.1',
            inputUI: {
                type: 'dropdown',
                options: ['7.1', '5.1', '2.0'],
            },
            tooltip: 'Specify what number of channels should be used as the default channel.',
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
var getFileInfoFromLookup = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var fInfo, imdbId, lookupResponse;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                fInfo = { languageName: '' };
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
                args.jobLog("".concat(arrApp.content, " ").concat(fInfo.languageName !== '' ? "'".concat(fInfo.languageName, "' found") : 'not found')
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
                fInfo = { languageName: '' };
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: arrApp.headers,
                    })];
            case 1:
                parseResponse = _a.sent();
                fInfo = arrApp.delegates.getFileInfoFromParseResponse(parseResponse);
                args.jobLog("".concat(arrApp.content, " ").concat(fInfo.languageName !== '' ? "'".concat(fInfo.languageName, "' found") : 'not found')
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
                return [2 /*return*/, (fInfo.languageName === '')
                        ? getFileInfoFromParse(args, arrApp, fileName)
                        : fInfo];
        }
    });
}); };
var getLanguageCode = function (args, languageName) { return __awaiter(void 0, void 0, void 0, function () {
    var response, languages;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, fetch("https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/iso-language-codes-639-1-and-639-2@public/records?select=alpha3_b&where=english%20%3D%20%22".concat(languageName, "%22&limit=1"))];
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
    var lib, streams, isSuccessful, shouldProcess, defaultSet, languageCode, arr, arr_host, arrHost, originalFileName, headers, arrApp, _a, _b, channels;
    var _c, _d, _e, _f, _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                (0, flowUtils_1.checkFfmpegCommandInit)(args);
                streams = args.variables.ffmpegCommand.streams;
                isSuccessful = false;
                shouldProcess = false;
                defaultSet = false;
                languageCode = args.inputs.language;
                if (!args.inputs.useRadarrOrSonarr) return [3 /*break*/, 3];
                arr = String(args.inputs.arr);
                arr_host = String(args.inputs.arr_host).trim();
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                originalFileName = (_d = (_c = args.originalLibraryFile) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
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
                            getFileInfoFromLookupResponse: function (lookupResponse) { var _a, _b, _c, _d; return ({ languageName: String((_d = (_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.originalLanguage) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "") }); },
                            getFileInfoFromParseResponse: function (parseResponse) { var _a, _b, _c, _d; return ({ languageName: String((_d = (_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.originalLanguage) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "") }); },
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Serie',
                        delegates: {
                            getFileInfoFromLookupResponse: function (lookupResponse) { var _a, _b, _c, _d; return ({ languageName: String((_d = (_c = (_b = (_a = lookupResponse === null || lookupResponse === void 0 ? void 0 : lookupResponse.data) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.originalLanguage) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "") }); },
                            getFileInfoFromParseResponse: function (parseResponse) { var _a, _b, _c, _d; return ({ languageName: String((_d = (_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.originalLanguage) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "") }); },
                        },
                    };
                _a = getLanguageCode;
                _b = [args];
                return [4 /*yield*/, getFileInfo(args, arrApp, originalFileName)];
            case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_e = (_k.sent())) === null || _e === void 0 ? void 0 : _e.languageName]))];
            case 2:
                languageCode = _k.sent();
                _k.label = 3;
            case 3:
                channels = args.inputs.useHightestNumberOfChannels ?
                    (_j = (_h = (_g = (_f = streams
                        .filter(function (stream) { var _a, _b; return stream.codec_type === "audio" && ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '' === languageCode); })) === null || _f === void 0 ? void 0 : _f.sort(function (stream1, stream2) { var _a, _b; return ((_a = stream1.channels) !== null && _a !== void 0 ? _a : 0) > ((_b = stream2.channels) !== null && _b !== void 0 ? _b : 0) ? 1 : -1; })) === null || _g === void 0 ? void 0 : _g.at(0)) === null || _h === void 0 ? void 0 : _h.channels) !== null && _j !== void 0 ? _j : 0
                    : args.inputs.channels;
                streams.forEach(function (stream, index) {
                    var _a, _b, _c;
                    if (stream.codec_type === "audio") {
                        if (((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : '') === languageCode
                            && ((_c = stream.channels) !== null && _c !== void 0 ? _c : 0) == channels
                            && !defaultSet) {
                            stream.outputArgs.push("-disposition:".concat(index), 'default');
                            defaultSet = true;
                        }
                        else
                            stream.outputArgs.push("-disposition:".concat(index), '0F');
                    }
                });
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
