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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Run Classic Filter Plugin',
    description: 'Run one of Tdarr\'s classic plugins that has Operation: Filter',
    style: {
        borderColor: 'orange',
    },
    tags: '',
    isStartPlugin: false,
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            name: 'pluginSourceId',
            type: 'string',
            defaultValue: 'Community:Tdarr_Plugin_00td_filter_by_codec',
            inputUI: {
                type: 'dropdown',
                options: [],
            },
            tooltip: 'Specify the classic plugin ID',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File met conditions, would traditionally continue to next plugin in plugin stack',
        },
        {
            number: 2,
            tooltip: 'File did not meet conditions, would traditionally break out of plugin stack',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var path, lib, pluginSourceId, parts, pluginSource, pluginId, relativePluginPath, absolutePath, classicPlugin, res, container, cacheFilePath, otherArguments, result, outputNumber;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                path = require('path');
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                pluginSourceId = String(args.inputs.pluginSourceId);
                parts = pluginSourceId.split(':');
                pluginSource = parts[0];
                pluginId = parts[1];
                relativePluginPath = "../../../../../".concat(pluginSource, "/").concat(pluginId, ".js");
                absolutePath = path.resolve(__dirname, relativePluginPath);
                if (!(pluginSource === 'Community')) return [3 /*break*/, 1];
                classicPlugin = args.deps.importFresh(relativePluginPath);
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, args.deps.axiosMiddleware('api/v2/read-plugin', {
                    plugin: {
                        id: pluginId,
                        source: pluginSource,
                    },
                })];
            case 2:
                res = _a.sent();
                classicPlugin = args.deps.requireFromString(res.pluginRaw, absolutePath);
                _a.label = 3;
            case 3:
                if (classicPlugin.details().Operation !== 'Filter') {
                    throw new Error("".concat('This plugin is meant for classic plugins that have '
                        + 'Operation: Filter. This classic plugin has Operation: ').concat(classicPlugin.details().Operation)
                        + 'Please use the Run Classic Transcode Flow Plugin plugin instead.');
                }
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                cacheFilePath = "".concat(args.workDir, "/tempFile_").concat(new Date().getTime(), ".").concat(container);
                otherArguments = {
                    handbrakePath: args.handbrakePath,
                    ffmpegPath: args.ffmpegPath,
                    mkvpropeditPath: args.mkvpropeditPath,
                    originalLibraryFile: args.originalLibraryFile,
                    nodeHardwareType: args.nodeHardwareType,
                    pluginCycle: 0,
                    workerType: args.workerType,
                    version: args.config.version,
                    platform_arch_isdocker: args.platform_arch_isdocker,
                    cacheFilePath: cacheFilePath,
                    job: args.job,
                };
                return [4 /*yield*/, classicPlugin.plugin(args.inputFileObj, args.librarySettings, args.inputs, otherArguments)];
            case 4:
                result = _a.sent();
                args.jobLog(JSON.stringify(result, null, 2));
                outputNumber = result.processFile ? 1 : 2;
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: outputNumber,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
