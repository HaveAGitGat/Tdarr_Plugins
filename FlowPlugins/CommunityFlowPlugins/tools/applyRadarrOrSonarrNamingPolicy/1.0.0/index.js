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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details = function () { return ({
    name: 'Apply Radarr or Sonarr naming policy',
    description: 'Apply Radarr or Sonarr naming policy to a file. This plugin should be called after the original file has been '
        + 'replaced and Radarr or Sonarr has been notified. Radarr or Sonarr should also be notified after this plugin.',
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
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Radarr or Sonnar notified',
        },
        {
            number: 2,
            tooltip: 'Radarr or Sonnar do not know this file',
        },
    ],
}); };
exports.details = details;
var getMovieId = function (args, arrHost, headers, fileName, getNewPathType) { return __awaiter(void 0, void 0, void 0, function () {
    var imdbId, id, _a, _b;
    var _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                imdbId = (_d = (_c = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)) === null || _c === void 0 ? void 0 : _c.at(0)) !== null && _d !== void 0 ? _d : '';
                if (!(imdbId !== '')) return [3 /*break*/, 2];
                _b = String;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrHost, "/api/v3/movie/lookup?term=imdb:").concat(imdbId),
                        headers: headers,
                    })];
            case 1:
                _a = _b.apply(void 0, [(_g = (_f = (_e = (_h.sent()).data) === null || _e === void 0 ? void 0 : _e.at(0)) === null || _f === void 0 ? void 0 : _f.id) !== null && _g !== void 0 ? _g : -1]);
                return [3 /*break*/, 3];
            case 2:
                _a = '-1';
                _h.label = 3;
            case 3:
                id = _a;
                args.jobLog("".concat(getNewPathType.content, " ").concat(id !== '-1' ? "".concat(id, " found") : 'not found', " for imdb '").concat(imdbId, "'"));
                return [2 /*return*/, id];
        }
    });
}); };
var getFileDetailsWrapper = function (args, arr, arrHost, headers, fileName, renameType) { return __awaiter(void 0, void 0, void 0, function () {
    var fdw, _a, _b;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _c = {};
                if (!(arr === 'radarr')) return [3 /*break*/, 2];
                return [4 /*yield*/, getMovieId(args, arrHost, headers, fileName, renameType)];
            case 1:
                _a = _d.sent();
                return [3 /*break*/, 3];
            case 2:
                _a = '-1';
                _d.label = 3;
            case 3:
                fdw = (_c.id = _a,
                    _c.fileDetails = undefined,
                    _c);
                if (!(fdw.id === '-1')) return [3 /*break*/, 5];
                _b = fdw;
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrHost, "/api/v3/parse?title=").concat(encodeURIComponent((0, fileUtils_1.getFileName)(fileName))),
                        headers: headers,
                    })];
            case 4:
                _b.fileDetails = _d.sent();
                fdw.id = renameType.delegates.getIdFromParseResponse(fdw);
                args.jobLog("".concat(renameType.content, " ").concat(fdw.id !== '-1' ? "".concat(fdw.id, " found") : 'not found', " for '")
                    + "".concat((0, fileUtils_1.getFileName)(fileName), "'"));
                _d.label = 5;
            case 5: return [2 /*return*/, fdw];
        }
    });
}); };
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, newPath, isSuccessful, arr, arr_host, arrHost, filePath, originalFileName, currentFileName, headers, episodeNumber, renameType, fileDetailsWrapper, previewRenameRequestResult, fileToRename;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                newPath = '';
                isSuccessful = false;
                arr = String(args.inputs.arr);
                arr_host = String(args.inputs.arr_host).trim();
                arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
                filePath = (_b = (_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '';
                originalFileName = (_d = (_c = args.originalLibraryFile) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : '';
                currentFileName = (_f = (_e = args.inputFileObj) === null || _e === void 0 ? void 0 : _e._id) !== null && _f !== void 0 ? _f : '';
                headers = {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(args.inputs.arr_api_key),
                    Accept: 'application/json',
                };
                episodeNumber = 0;
                renameType = arr === 'radarr'
                    ? {
                        appName: 'Radarr',
                        content: 'Movie',
                        delegates: {
                            getIdFromParseResponse: function (fileDetailsWrapper) { var _a, _b, _c, _d; return String((_d = (_c = (_b = (_a = fileDetailsWrapper.fileDetails) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.movie) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : -1); },
                            buildPreviewRenameResquestUrl: function (fileDetailsWrapper) { return "".concat(arrHost, "/api/v3/rename?movieId=").concat(fileDetailsWrapper.id); },
                            getFileToRenameFromPreviewRenameResponse: function (previewRenameResponse) { var _a; return (_a = previewRenameResponse.data) === null || _a === void 0 ? void 0 : _a.at(0); },
                        },
                    }
                    : {
                        appName: 'Sonarr',
                        content: 'Serie',
                        delegates: {
                            getIdFromParseResponse: function (fileDetailsWrapper) { var _a, _b, _c, _d; return String((_d = (_c = (_b = (_a = fileDetailsWrapper.fileDetails) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.series) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : -1); },
                            buildPreviewRenameResquestUrl: function (fileDetailsWrapper) {
                                var _a, _b, _c, _d, _e, _f;
                                episodeNumber = ((_c = (_b = (_a = fileDetailsWrapper.fileDetails) === null || _a === void 0 ? void 0 : _a.data.parsedEpisodeInfo) === null || _b === void 0 ? void 0 : _b.episodeNumbers) !== null && _c !== void 0 ? _c : [1])[0];
                                return "".concat(arrHost, "/api/v3/rename?seriesId=").concat(fileDetailsWrapper.id, "&seasonNumber=")
                                    + "".concat((_f = (_e = (_d = fileDetailsWrapper.fileDetails) === null || _d === void 0 ? void 0 : _d.data.parsedEpisodeInfo) === null || _e === void 0 ? void 0 : _e.seasonNumber) !== null && _f !== void 0 ? _f : 1);
                            },
                            getFileToRenameFromPreviewRenameResponse: function (previewRenameResponse) {
                                var _a;
                                return (_a = previewRenameResponse.data) === null || _a === void 0 ? void 0 : _a.find(function (episodeFile) { var _a; return ((_a = episodeFile.episodeNumbers) === null || _a === void 0 ? void 0 : _a.at(0)) === episodeNumber; });
                            },
                        },
                    };
                args.jobLog('Going to apply new name');
                args.jobLog("Renaming ".concat(renameType.appName, "..."));
                return [4 /*yield*/, getFileDetailsWrapper(args, arr, arrHost, headers, originalFileName, renameType)];
            case 1:
                fileDetailsWrapper = _g.sent();
                if (!(fileDetailsWrapper.id === '-1' && currentFileName !== originalFileName)) return [3 /*break*/, 3];
                return [4 /*yield*/, getFileDetailsWrapper(args, arr, arrHost, headers, currentFileName, renameType)];
            case 2:
                fileDetailsWrapper = _g.sent();
                _g.label = 3;
            case 3:
                if (!(fileDetailsWrapper.id !== '-1')) return [3 /*break*/, 7];
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: renameType.delegates.buildPreviewRenameResquestUrl(fileDetailsWrapper),
                        headers: headers,
                    })];
            case 4:
                previewRenameRequestResult = _g.sent();
                fileToRename = renameType.delegates
                    .getFileToRenameFromPreviewRenameResponse(previewRenameRequestResult);
                if (!(fileToRename !== undefined)) return [3 /*break*/, 6];
                newPath = "".concat((0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id), "/").concat((0, fileUtils_1.getFileName)(fileToRename.newPath), ".").concat((0, fileUtils_1.getContainer)(fileToRename.newPath));
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: args.inputFileObj._id,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 5:
                isSuccessful = _g.sent();
                args.jobLog("\u2714 ".concat(renameType.content, " ").concat(fileDetailsWrapper.id, " renamed : ")
                    + "'".concat(filePath, "' => '").concat(newPath, "'."));
                return [3 /*break*/, 7];
            case 6:
                isSuccessful = true;
                args.jobLog('✔ No rename necessary.');
                _g.label = 7;
            case 7: return [2 /*return*/, {
                    outputFileObj: isSuccessful && newPath !== ''
                        ? __assign(__assign({}, args.inputFileObj), { _id: newPath }) : args.inputFileObj,
                    outputNumber: isSuccessful ? 1 : 2,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
