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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fs_1 = require("fs");
var normJoinPath_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/normJoinPath"));
var helperText = "\n    jobCache: Clears all other files in this job's cache folder (which is a subfolder of the library cache).\n    libraryCache: Clears all other files in the library cache.\n  ";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Clear Cache',
    description: "\n    This plugin allows you to clear various cache folders, keeping only the current 'working' file.\n    ".concat(helperText, "\n\n  "),
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
            label: 'Cache To Clear',
            name: 'cacheToClear',
            type: 'string',
            defaultValue: 'jobCache',
            inputUI: {
                type: 'dropdown',
                options: [
                    'jobCache',
                    'libraryCache',
                ],
            },
            tooltip: "Specify which cache to clear \n      ".concat(helperText, "\n      "),
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, cacheToClear, currentFile, jobCacheDir, libraryCacheDir, folderToClear, traverseFolder;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                cacheToClear = args.inputs.cacheToClear;
                currentFile = args.inputFileObj._id;
                jobCacheDir = args.workDir;
                libraryCacheDir = args.librarySettings.cache;
                folderToClear = '';
                if (cacheToClear === 'jobCache') {
                    folderToClear = jobCacheDir;
                }
                else if (cacheToClear === 'libraryCache') {
                    folderToClear = libraryCacheDir;
                }
                args.jobLog("Clearing ".concat(cacheToClear, " folder: \"").concat(folderToClear, "\""));
                args.jobLog("Keeping current file: \"".concat(currentFile, "\""));
                traverseFolder = function (dir) { return __awaiter(void 0, void 0, void 0, function () {
                    var filesInDir, i, file, stat, err_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fs_1.promises.readdir(dir)];
                            case 1:
                                filesInDir = (_a.sent()).map(function (file) { return (0, normJoinPath_1.default)({
                                    upath: args.deps.upath,
                                    paths: [
                                        dir,
                                        file,
                                    ],
                                }); });
                                i = 0;
                                _a.label = 2;
                            case 2:
                                if (!(i < filesInDir.length)) return [3 /*break*/, 10];
                                file = filesInDir[i];
                                return [4 /*yield*/, fs_1.promises.stat(file)];
                            case 3:
                                stat = _a.sent();
                                if (!stat.isDirectory()) return [3 /*break*/, 5];
                                // eslint-disable-next-line no-await-in-loop
                                return [4 /*yield*/, traverseFolder(file)];
                            case 4:
                                // eslint-disable-next-line no-await-in-loop
                                _a.sent();
                                return [3 /*break*/, 9];
                            case 5:
                                if (!(file !== currentFile
                                    // prevent deleting non Tdarr cache files
                                    && file.includes('tdarr-workDir2'))) return [3 /*break*/, 9];
                                args.jobLog("Deleting \"".concat(file, "\""));
                                _a.label = 6;
                            case 6:
                                _a.trys.push([6, 8, , 9]);
                                // eslint-disable-next-line no-await-in-loop
                                return [4 /*yield*/, fs_1.promises.unlink(file)];
                            case 7:
                                // eslint-disable-next-line no-await-in-loop
                                _a.sent();
                                return [3 /*break*/, 9];
                            case 8:
                                err_1 = _a.sent();
                                args.jobLog("File delete error: ".concat(JSON.stringify(err_1)));
                                return [3 /*break*/, 9];
                            case 9:
                                i += 1;
                                return [3 /*break*/, 2];
                            case 10: return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, traverseFolder(folderToClear)];
            case 1:
                _a.sent();
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
