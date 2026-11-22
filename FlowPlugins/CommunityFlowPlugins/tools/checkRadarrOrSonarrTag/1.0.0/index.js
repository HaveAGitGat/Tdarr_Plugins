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
var details = function () { return ({
    name: 'Check Radarr or Sonarr Tag',
    description: 'Check if a specific tag is present on a movie or series in Radarr or Sonarr',
    style: {
        borderColor: '#6efefc',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faTag',
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
            label: 'Tag Name',
            name: 'tag_name',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'The tag name to check for (case-insensitive)',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Tag is present',
        },
        {
            number: 2,
            tooltip: 'Tag is not present or file not found in Radarr/Sonarr',
        },
    ],
}); };
exports.details = details;
var getId = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var imdbIdMatch, imdbId, result, lookupResponse, item, error_1, parseResponse, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                imdbIdMatch = /\btt\d{7,10}\b/i.exec(fileName);
                imdbId = imdbIdMatch ? imdbIdMatch[0] : '';
                result = { id: -1, tags: [] };
                if (!(imdbId !== '')) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/").concat(arrApp.name === 'radarr' ? 'movie' : 'series', "/lookup?term=imdb:").concat(imdbId),
                        headers: arrApp.headers,
                    })];
            case 2:
                lookupResponse = _a.sent();
                item = lookupResponse.data && lookupResponse.data[0];
                if (item && item.id) {
                    result = { id: item.id, tags: item.tags || [] };
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                args.jobLog("Failed to lookup by IMDB ID: ".concat(error_1));
                return [3 /*break*/, 4];
            case 4:
                args.jobLog("".concat(arrApp.content, " ").concat(result.id !== -1 ? "'".concat(result.id, "' found") : 'not found', " for imdb '").concat(imdbId, "'"));
                if (!(result.id === -1)) return [3 /*break*/, 8];
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: arrApp.headers,
                    })];
            case 6:
                parseResponse = _a.sent();
                result = arrApp.getIdAndTags(parseResponse);
                args.jobLog("".concat(arrApp.content, " ").concat(result.id !== -1 ? "'".concat(result.id, "' found") : 'not found', " for '").concat((0, fileUtils_1.getFileName)(fileName), "'"));
                return [3 /*break*/, 8];
            case 7:
                error_2 = _a.sent();
                args.jobLog("Failed to parse filename: ".concat(error_2));
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/, result];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, tagFound, arr, arr_host, arrHost, tagName, originalFileName, currentFileName, headers, arrApp, result, tagsResponse, tags, targetTag, i, hasTag, i, error_3;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                tagFound = false;
                arr = String(args.inputs.arr);
                arr_host = String(args.inputs.arr_host).trim();
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                tagName = String(args.inputs.tag_name).trim().toLowerCase();
                originalFileName = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                currentFileName = (_d = (_c = args.inputFileObj) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                if (!tagName) {
                    args.jobLog('⚠ No tag name specified');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
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
                        getIdAndTags: function (parseResponse) {
                            var _a, _b, _c, _d, _e;
                            return ({
                                id: Number((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                tags: ((_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.movie) === null || _e === void 0 ? void 0 : _e.tags) || [],
                            });
                        },
                    }
                    : {
                        name: arr,
                        host: arrHost,
                        headers: headers,
                        content: 'Series',
                        getIdAndTags: function (parseResponse) {
                            var _a, _b, _c, _d, _e;
                            return ({
                                id: Number((_c = (_b = (_a = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : -1),
                                tags: ((_e = (_d = parseResponse === null || parseResponse === void 0 ? void 0 : parseResponse.data) === null || _d === void 0 ? void 0 : _d.series) === null || _e === void 0 ? void 0 : _e.tags) || [],
                            });
                        },
                    };
                args.jobLog("Checking for tag '".concat(tagName, "' in ").concat(arrApp.name, "..."));
                return [4 /*yield*/, getId(args, arrApp, originalFileName)];
            case 1:
                result = _e.sent();
                if (!(result.id === -1 && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getId(args, arrApp, currentFileName)];
            case 2:
                result = _e.sent();
                _e.label = 3;
            case 3:
                if (!(result.id !== -1)) return [3 /*break*/, 8];
                args.jobLog("".concat(arrApp.content, " '").concat(result.id, "' found with tag IDs: [").concat(result.tags.join(', '), "]"));
                _e.label = 4;
            case 4:
                _e.trys.push([4, 6, , 7]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/tag"),
                        headers: headers,
                    })];
            case 5:
                tagsResponse = _e.sent();
                tags = tagsResponse.data || [];
                args.jobLog("Found ".concat(tags.length, " tags in ").concat(arrApp.name));
                targetTag = void 0;
                for (i = 0; i < tags.length; i += 1) {
                    if (tags[i].label.toLowerCase() === tagName) {
                        targetTag = tags[i];
                        break;
                    }
                }
                if (targetTag) {
                    args.jobLog("Tag '".concat(tagName, "' has ID ").concat(targetTag.id));
                    hasTag = false;
                    for (i = 0; i < result.tags.length; i += 1) {
                        if (result.tags[i] === targetTag.id) {
                            hasTag = true;
                            break;
                        }
                    }
                    if (hasTag) {
                        tagFound = true;
                        args.jobLog("Tag '".concat(tagName, "' is present on ").concat(arrApp.content, " '").concat(result.id, "'"));
                    }
                    else {
                        args.jobLog("Tag '".concat(tagName, "' is NOT present on ").concat(arrApp.content, " '").concat(result.id, "'"));
                    }
                }
                else {
                    args.jobLog("Tag '".concat(tagName, "' does not exist in ").concat(arrApp.name));
                }
                return [3 /*break*/, 7];
            case 6:
                error_3 = _e.sent();
                args.jobLog("Failed to fetch tags: ".concat(error_3));
                return [3 /*break*/, 7];
            case 7: return [3 /*break*/, 9];
            case 8:
                args.jobLog("".concat(arrApp.content, " not found in ").concat(arrApp.name));
                _e.label = 9;
            case 9: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: tagFound ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
