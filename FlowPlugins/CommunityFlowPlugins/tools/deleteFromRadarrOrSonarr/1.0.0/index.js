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
    name: 'Delete from Radarr or Sonarr',
    description: 'Delete file from Radarr or Sonarr, block release, and search for new release',
    style: {
        borderColor: 'red',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faTrash',
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
            label: 'Delete Files',
            name: 'deleteFiles',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Delete files from disk when removing from Radarr/Sonarr',
        },
        {
            label: 'Add to Blocklist',
            name: 'addToBlocklist',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Add release to blocklist to prevent re-downloading',
        },
        {
            label: 'Search for Replacement',
            name: 'searchForReplacement',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Automatically search for a new release after deletion',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Radarr or Sonarr actions completed',
        },
        {
            number: 2,
            tooltip: 'Radarr or Sonarr do not know this file',
        },
    ],
}); };
exports.details = details;
var normalizeFilePath = function (path) { return path.toLowerCase().replace(/\\/g, '/').trim(); };
var findMatchingFile = function (files, targetPath, args) {
    var _a;
    var normalizedTarget = normalizeFilePath(targetPath);
    var matchingFile = files.find(function (file) {
        var normalizedFilePath = normalizeFilePath(file.path);
        return normalizedFilePath === normalizedTarget || normalizedFilePath.endsWith(normalizedTarget);
    });
    if (matchingFile) {
        args.jobLog("\u2714 Found matching file: ".concat(matchingFile.path));
        return matchingFile;
    }
    var targetFileName = ((_a = targetPath.split(/[/\\]/).pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
    var fileWithMatchingName = files.find(function (file) {
        var _a;
        var fileName = ((_a = file.path.split(/[/\\]/).pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        return fileName === targetFileName;
    });
    if (fileWithMatchingName) {
        args.jobLog("\u26A0 Found file with matching name but different path: ".concat(fileWithMatchingName.path));
        return fileWithMatchingName;
    }
    return null;
};
var getId = function (args, arrApp, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var imdbId, response, id_1, parseResponse, id, error_1;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 4, , 5]);
                imdbId = ((_a = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)) === null || _a === void 0 ? void 0 : _a[0]) || '';
                if (!imdbId) return [3 /*break*/, 2];
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrApp.host, "/api/v3/").concat(arrApp.name === 'radarr' ? 'movie' : 'series', "/lookup?term=imdb:").concat(imdbId),
                        headers: arrApp.headers,
                    })];
            case 1:
                response = _d.sent();
                id_1 = Number(((_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) || -1);
                args.jobLog("".concat(arrApp.content, " ").concat(id_1 !== -1 ? "'".concat(id_1, "' found") : 'not found', " for IMDB ID '").concat(imdbId, "'"));
                if (id_1 !== -1)
                    return [2 /*return*/, id_1];
                _d.label = 2;
            case 2: return [4 /*yield*/, args.deps.axios({
                    method: 'get',
                    url: "".concat(arrApp.host, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                    headers: arrApp.headers,
                })];
            case 3:
                parseResponse = _d.sent();
                id = arrApp.delegates.getIdFromParseResponse(parseResponse);
                args.jobLog("".concat(arrApp.content, " ").concat(id !== -1 ? "'".concat(id, "' found") : 'not found', " for title '").concat((0, fileUtils_1.getFileName)(fileName), "'"));
                return [2 /*return*/, id];
            case 4:
                error_1 = _d.sent();
                args.jobLog("\u2716 Error finding ".concat(arrApp.content, ": ").concat(error_1));
                return [2 /*return*/, -1];
            case 5: return [2 /*return*/];
        }
    });
}); };
var getFileInfo = function (args, arrApp, id, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var response, files, matchingFile, fileId, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: arrApp.delegates.getFileEndpoint(id),
                        headers: arrApp.headers,
                    })];
            case 1:
                response = _b.sent();
                files = Array.isArray(response.data) ? response.data : ((_a = response.data) === null || _a === void 0 ? void 0 : _a.data) || [];
                matchingFile = findMatchingFile(files, filePath, args);
                if (matchingFile) {
                    fileId = arrApp.delegates.extractFileId(matchingFile);
                    return [2 /*return*/, { file: matchingFile, fileId: fileId }];
                }
                args.jobLog("\u2716 No matching file found in ".concat(arrApp.name, " for path: ").concat(filePath));
                return [2 /*return*/, null];
            case 2:
                error_2 = _b.sent();
                args.jobLog("\u2716 Error retrieving file info: ".concat(error_2));
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
var getDownloadHistory = function (args, arrApp, id, fileId) { return __awaiter(void 0, void 0, void 0, function () {
    var historyResponse, records, downloadRecord, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: arrApp.delegates.getHistoryEndpoint(id, fileId),
                        headers: arrApp.headers,
                    })];
            case 1:
                historyResponse = _b.sent();
                records = ((_a = historyResponse.data) === null || _a === void 0 ? void 0 : _a.records) || [];
                downloadRecord = records.find(function (record) {
                    var _a, _b, _c;
                    return record.eventType === 1
                        && (((_a = record.data) === null || _a === void 0 ? void 0 : _a.guid) || ((_b = record.data) === null || _b === void 0 ? void 0 : _b.torrentInfoHash) || ((_c = record.data) === null || _c === void 0 ? void 0 : _c.downloadId))
                        && (fileId ? (record.movieFileId === fileId || record.episodeFileId === fileId) : true);
                });
                if (downloadRecord) {
                    args.jobLog("\u2714 Found download history for ".concat(arrApp.content, " '").concat(id, "'"));
                    return [2 /*return*/, downloadRecord];
                }
                args.jobLog("\u26A0 No download history found for ".concat(arrApp.content, " '").concat(id, "'"));
                return [2 /*return*/, null];
            case 2:
                error_3 = _b.sent();
                args.jobLog("\u26A0 Could not retrieve download history: ".concat(error_3));
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
var createArrApp = function (arr, arrHost, headers) {
    if (arr === 'radarr') {
        return {
            name: 'radarr',
            host: arrHost,
            headers: headers,
            content: 'Movie',
            delegates: {
                getIdFromParseResponse: function (response) { var _a, _b; return Number(((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.movie) === null || _b === void 0 ? void 0 : _b.id) || -1); },
                getFileEndpoint: function (id) { return "".concat(arrHost, "/api/v3/moviefile?movieId=").concat(id); },
                getHistoryEndpoint: function (id) { return "".concat(arrHost, "/api/v3/history?movieId=").concat(id, "&eventType=1&includeMovie=false"); },
                deleteFileEndpoint: function (fileId) { return "".concat(arrHost, "/api/v3/moviefile/").concat(fileId); },
                searchEndpoint: function () { return "".concat(arrHost, "/api/v3/command"); },
                blocklistEndpoint: function () { return "".concat(arrHost, "/api/v3/blocklist"); },
                buildSearchRequestData: function (id) { return ({ name: 'MoviesSearch', movieIds: [id] }); },
                buildBlocklistRequestData: function (item) { return ({
                    movieId: item.movieId,
                    sourceTitle: item.sourceTitle,
                    protocol: item.protocol,
                    indexer: item.indexer,
                    message: item.message || 'Blocked by Tdarr plugin',
                }); },
                extractFileId: function (file) { return file.id; },
            },
        };
    }
    return {
        name: 'sonarr',
        host: arrHost,
        headers: headers,
        content: 'Series',
        delegates: {
            getIdFromParseResponse: function (response) { var _a, _b; return Number(((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.id) || -1); },
            getFileEndpoint: function (id) { return "".concat(arrHost, "/api/v3/episodefile?seriesId=").concat(id); },
            getHistoryEndpoint: function (id) { return "".concat(arrHost, "/api/v3/history?seriesId=").concat(id, "&eventType=1&includeSeries=false"); },
            deleteFileEndpoint: function (fileId) { return "".concat(arrHost, "/api/v3/episodefile/").concat(fileId); },
            searchEndpoint: function () { return "".concat(arrHost, "/api/v3/command"); },
            blocklistEndpoint: function () { return "".concat(arrHost, "/api/v3/blocklist"); },
            buildSearchRequestData: function (id) { return ({ name: 'SeriesSearch', seriesId: id }); },
            buildBlocklistRequestData: function (item) { return ({
                seriesId: item.seriesId,
                sourceTitle: item.sourceTitle,
                protocol: item.protocol,
                indexer: item.indexer,
                message: item.message || 'Blocked by Tdarr plugin',
            }); },
            extractFileId: function (file) { return file.id; },
        },
    };
};
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, arr, arrHost, deleteFiles, addToBlocklist, searchForReplacement, originalFilePath, currentFilePath, headers, arrApp, id, fileInfo, historyRecord, blocklistItem, blocklistError_1, deleteError_1, searchError_1;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                arr = String(args.inputs.arr);
                arrHost = String(args.inputs.arr_host).trim().replace(/\/$/, '');
                deleteFiles = args.inputs.deleteFiles === true || args.inputs.deleteFiles === 'true';
                addToBlocklist = args.inputs.addToBlocklist === true || args.inputs.addToBlocklist === 'true';
                searchForReplacement = args.inputs.searchForReplacement === true || args.inputs.searchForReplacement === 'true';
                originalFilePath = ((_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) || '';
                currentFilePath = ((_b = args.inputFileObj) === null || _b === void 0 ? void 0 : _b._id) || '';
                if (!args.inputs.arr_api_key) {
                    throw new Error('API key is required');
                }
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(args.inputs.arr_api_key),
                    Accept: 'application/json',
                };
                arrApp = createArrApp(arr, arrHost, headers);
                args.jobLog("Starting deletion process for ".concat(arrApp.name, "..."));
                args.jobLog("Looking for file: ".concat(originalFilePath || currentFilePath));
                return [4 /*yield*/, getId(args, arrApp, originalFilePath)];
            case 1:
                id = _f.sent();
                if (!(id === -1 && currentFilePath !== originalFilePath)) return [3 /*break*/, 3];
                return [4 /*yield*/, getId(args, arrApp, currentFilePath)];
            case 2:
                id = _f.sent();
                _f.label = 3;
            case 3:
                if (id === -1) {
                    args.jobLog("\u2716 ".concat(arrApp.content, " not found in ").concat(arrApp.name));
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                args.jobLog("\u2714 ".concat(arrApp.content, " '").concat(id, "' found in ").concat(arrApp.name));
                return [4 /*yield*/, getFileInfo(args, arrApp, id, originalFilePath || currentFilePath)];
            case 4:
                fileInfo = _f.sent();
                if (!fileInfo) {
                    args.jobLog("\u2716 File not found in ".concat(arrApp.name, " library"));
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 2,
                            variables: args.variables,
                        }];
                }
                historyRecord = null;
                if (!addToBlocklist) return [3 /*break*/, 6];
                return [4 /*yield*/, getDownloadHistory(args, arrApp, id, fileInfo.fileId)];
            case 5:
                historyRecord = _f.sent();
                _f.label = 6;
            case 6:
                if (!(addToBlocklist && historyRecord)) return [3 /*break*/, 10];
                _f.label = 7;
            case 7:
                _f.trys.push([7, 9, , 10]);
                blocklistItem = __assign(__assign({}, (arrApp.name === 'radarr' ? { movieId: id } : { seriesId: id })), { sourceTitle: historyRecord.sourceTitle || 'Unknown', protocol: ((_d = (_c = historyRecord.data) === null || _c === void 0 ? void 0 : _c.downloadUrl) === null || _d === void 0 ? void 0 : _d.startsWith('magnet:')) ? 'torrent' : 'usenet', indexer: (_e = historyRecord.data) === null || _e === void 0 ? void 0 : _e.indexer, message: 'Blocked by Tdarr due to processing issues' });
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: arrApp.delegates.blocklistEndpoint(),
                        headers: headers,
                        data: arrApp.delegates.buildBlocklistRequestData(blocklistItem),
                    })];
            case 8:
                _f.sent();
                args.jobLog('✔ Release added to blocklist');
                return [3 /*break*/, 10];
            case 9:
                blocklistError_1 = _f.sent();
                args.jobLog("\u26A0 Failed to add to blocklist: ".concat(blocklistError_1));
                return [3 /*break*/, 10];
            case 10:
                if (!deleteFiles) return [3 /*break*/, 15];
                _f.label = 11;
            case 11:
                _f.trys.push([11, 13, , 14]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'delete',
                        url: arrApp.delegates.deleteFileEndpoint(fileInfo.fileId),
                        headers: headers,
                    })];
            case 12:
                _f.sent();
                args.jobLog("\u2714 File deleted from ".concat(arrApp.name));
                return [3 /*break*/, 14];
            case 13:
                deleteError_1 = _f.sent();
                args.jobLog("\u2716 Failed to delete file: ".concat(deleteError_1));
                throw deleteError_1;
            case 14: return [3 /*break*/, 16];
            case 15:
                args.jobLog('⚠ File deletion skipped (deleteFiles is false)');
                _f.label = 16;
            case 16:
                if (!searchForReplacement) return [3 /*break*/, 20];
                _f.label = 17;
            case 17:
                _f.trys.push([17, 19, , 20]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: arrApp.delegates.searchEndpoint(),
                        headers: headers,
                        data: arrApp.delegates.buildSearchRequestData(id),
                    })];
            case 18:
                _f.sent();
                args.jobLog('✔ Search for replacement initiated');
                return [3 /*break*/, 20];
            case 19:
                searchError_1 = _f.sent();
                args.jobLog("\u26A0 Failed to initiate search: ".concat(searchError_1));
                return [3 /*break*/, 20];
            case 20:
                args.jobLog('✔ All actions completed successfully');
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
