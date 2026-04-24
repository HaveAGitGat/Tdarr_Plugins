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
exports.runClassicPlugin = void 0;
var fs_1 = require("fs");
var fileUtils_1 = require("./fileUtils");
var runClassicPlugin = function (args, type) { return __awaiter(void 0, void 0, void 0, function () {
    var path, pluginSourceId, parts, pluginSource, pluginId, relativePluginPath, absolutePath, classicPlugin, pluginSrcStr, res, container, cacheFilePath, scanTypes, pluginInputFileObj, originalLibraryFile, inputFileScanArgs, originalLibraryFileScanArgs, otherArguments, result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                path = require('path');
                pluginSourceId = String(args.inputs.pluginSourceId);
                parts = pluginSourceId.split(':');
                pluginSource = parts[0];
                pluginId = parts[1];
                relativePluginPath = "../../../".concat(pluginSource, "/").concat(pluginId, ".js");
                absolutePath = path.resolve(__dirname, relativePluginPath);
                pluginSrcStr = '';
                if (!(pluginSource === 'Community')) return [3 /*break*/, 2];
                classicPlugin = args.deps.importFresh(relativePluginPath);
                return [4 /*yield*/, fs_1.promises.readFile(absolutePath, 'utf8')];
            case 1:
                pluginSrcStr = _b.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, args.deps.axiosMiddleware('api/v2/read-plugin', {
                    plugin: {
                        id: pluginId,
                        source: pluginSource,
                    },
                })];
            case 3:
                res = _b.sent();
                classicPlugin = args.deps.requireFromString(res.pluginRaw, absolutePath);
                pluginSrcStr = res.pluginRaw;
                _b.label = 4;
            case 4:
                if (type === 'filter' && classicPlugin.details().Operation !== 'Filter') {
                    throw new Error("".concat('This plugin is meant for classic plugins that have '
                        + 'Operation: Filter. This classic plugin has Operation: ').concat(classicPlugin.details().Operation)
                        + '. Please use the Run Classic Transcode Flow Plugin plugin instead.');
                }
                if (type !== 'filter' && classicPlugin.details().Operation === 'Filter') {
                    throw new Error("".concat('This plugin is meant for classic plugins that have '
                        + 'Operation: Transcode. This classic plugin has Operation: ').concat(classicPlugin.details().Operation)
                        + 'Please use the Run Classic Filter Flow Plugin plugin instead.');
                }
                if (!Array.isArray(classicPlugin.dependencies)) return [3 /*break*/, 8];
                if (!args.installClassicPluginDeps) return [3 /*break*/, 6];
                args.jobLog("Installing dependencies for ".concat(pluginSourceId));
                return [4 /*yield*/, args.installClassicPluginDeps(classicPlugin.dependencies)];
            case 5:
                _b.sent();
                return [3 /*break*/, 7];
            case 6:
                args.jobLog("Not installing dependencies for ".concat(pluginSourceId, ", please update Tdarr"));
                _b.label = 7;
            case 7: return [3 /*break*/, 9];
            case 8:
                args.jobLog("No depedencies to install for ".concat(pluginSourceId));
                _b.label = 9;
            case 9:
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                cacheFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(container);
                scanTypes = (0, fileUtils_1.getScanTypes)([pluginSrcStr]);
                inputFileScanArgs = {
                    _id: args.inputFileObj._id,
                    file: args.inputFileObj.file,
                    DB: args.inputFileObj.DB,
                    footprintId: args.inputFileObj.footprintId,
                };
                originalLibraryFileScanArgs = {
                    _id: args.originalLibraryFile._id,
                    file: args.originalLibraryFile.file,
                    DB: args.originalLibraryFile.DB,
                    footprintId: args.originalLibraryFile.footprintId,
                };
                if (!(typeof args.scanIndividualFile !== 'undefined')) return [3 /*break*/, 12];
                args.jobLog('Scanning files using Node');
                return [4 /*yield*/, args.scanIndividualFile(inputFileScanArgs, scanTypes)];
            case 10:
                pluginInputFileObj = _b.sent();
                return [4 /*yield*/, args.scanIndividualFile(originalLibraryFileScanArgs, scanTypes)];
            case 11:
                originalLibraryFile = _b.sent();
                return [3 /*break*/, 15];
            case 12:
                args.jobLog('Scanning files using Server API');
                return [4 /*yield*/, args.deps.axiosMiddleware('api/v2/scan-individual-file', {
                        file: inputFileScanArgs,
                        scanTypes: scanTypes,
                    })];
            case 13:
                pluginInputFileObj = _b.sent();
                return [4 /*yield*/, args.deps.axiosMiddleware('api/v2/scan-individual-file', {
                        file: originalLibraryFileScanArgs,
                        scanTypes: scanTypes,
                    })];
            case 14:
                originalLibraryFile = _b.sent();
                _b.label = 15;
            case 15:
                otherArguments = {
                    handbrakePath: args.handbrakePath,
                    ffmpegPath: args.ffmpegPath,
                    mkvpropeditPath: args.mkvpropeditPath,
                    originalLibraryFile: originalLibraryFile,
                    nodeHardwareType: args.nodeHardwareType,
                    pluginCycle: 0,
                    workerType: args.workerType,
                    version: args.config.version,
                    platform_arch_isdocker: args.platform_arch_isdocker,
                    cacheFilePath: cacheFilePath,
                    job: args.job,
                };
                return [4 /*yield*/, classicPlugin.plugin(pluginInputFileObj, args.librarySettings, args.inputs, otherArguments)];
            case 16:
                result = _b.sent();
                if (((_a = result === null || result === void 0 ? void 0 : result.file) === null || _a === void 0 ? void 0 : _a._id) && args.inputFileObj._id !== result.file._id) {
                    args.jobLog("File ID changed from ".concat(args.inputFileObj._id, " to ").concat(result.file._id));
                    // eslint-disable-next-line no-param-reassign
                    args.inputFileObj._id = result.file._id;
                    // eslint-disable-next-line no-param-reassign
                    args.inputFileObj.file = result.file.file;
                }
                return [2 /*return*/, {
                        result: result,
                        cacheFilePath: cacheFilePath,
                        absolutePath: absolutePath,
                    }];
        }
    });
}); };
exports.runClassicPlugin = runClassicPlugin;
