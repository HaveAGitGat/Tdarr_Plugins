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
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Replace Original File',
    description: "\n  Replace the original file with the 'working' file passed into this plugin.\n  If the file hasn't changed then no action is taken.\n  Note: The 'working' filename and container will replace the original filename and container.\n  ",
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faArrowRight',
    inputs: [
        {
            label: 'Atomic Swap',
            name: 'atomicSwap',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: "Off (default): the working file is staged next to the original as <name>.tmp, the\noriginal is renamed aside to .partial.old, and the new file is then moved into place.\nFor those few seconds the original path does not exist.\n\nOn: the working file is staged under a hidden name that is not derived from the\noriginal (.tdarr-replace-<jobId>.partial.tmp), then a single rename replaces the original.\nOn local Linux/macOS filesystems the original path always exists, and if anything fails\nthe original is untouched. A crash mid-copy can leave that hidden file behind.\n\nUse this when other software watches the library while Tdarr works, e.g. Sonarr/Radarr\nrescans, which have been seen to treat a briefly missing file as deleted and remove its\n\"extra\" files (subtitles, artwork, and the staged <name>.tmp).\n\nAs with the default, the new file keeps the working file's owner and permissions.\nOn Windows, rename cannot replace an existing file, so the default behaviour is used.",
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
var getFileId = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, dev, ino, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.promises.stat(filePath)];
            case 1:
                _a = _b.sent(), dev = _a.dev, ino = _a.ino;
                return [2 /*return*/, { dev: dev, ino: ino }];
            case 2:
                err_1 = _b.sent();
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Treat unknown (0) inode numbers as "same file" so we err on the side of not deleting.
var sameFile = function (a, b) { return a.dev === b.dev && (a.ino === b.ino || a.ino === 0 || b.ino === 0); };
var removeStaged = function (args, stagedPath) { return __awaiter(void 0, void 0, void 0, function () {
    var cleanupErr_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, fileUtils_1.fileExists)(stagedPath)];
            case 1:
                if (!_a.sent()) return [3 /*break*/, 5];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs_1.promises.unlink(stagedPath)];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                cleanupErr_1 = _a.sent();
                args.jobLog("Failed to clean up temporary file ".concat(stagedPath, ": ").concat(JSON.stringify(cleanupErr_1)));
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, currentPath, originalPath, orignalFolder, fileName, container, newPath, atomicSwap, jobSuffix, newPathTmp, originalPathOld, originalIdBefore, _a, err_2, originalFileExists, currentFileIsNotOriginal, shouldRenameOriginal, originalRenamed, staleErr_1, err_3, cleanupErr_2, err_4, originalIdAfter, newId, err_5, err_6, restoreErr_1, err_7;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                if (args.inputFileObj._id === args.originalLibraryFile._id
                    && args.inputFileObj.file_size === args.originalLibraryFile.file_size) {
                    args.jobLog('File has not changed, no need to replace file');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                args.jobLog('File has changed, replacing original file');
                currentPath = args.inputFileObj._id;
                originalPath = args.originalLibraryFile._id;
                orignalFolder = (0, fileUtils_1.getFileAbsoluteDir)(originalPath);
                fileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                newPath = "".concat(orignalFolder, "/").concat(fileName, ".").concat(container);
                atomicSwap = args.inputs.atomicSwap === true;
                if (atomicSwap && (args.platform || process.platform) === 'win32') {
                    args.jobLog('Atomic swap is not supported on Windows, using the default replace');
                    atomicSwap = false;
                }
                if (atomicSwap && (currentPath === newPath || currentPath === originalPath)) {
                    // Edited in place: staging it would take the only copy out of the library.
                    args.jobLog('Working file is already in place, nothing to swap');
                    return [2 /*return*/, {
                            outputFileObj: {
                                _id: newPath,
                            },
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                jobSuffix = ((_b = args.job) === null || _b === void 0 ? void 0 : _b.jobId) || "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8));
                newPathTmp = atomicSwap
                    ? "".concat(orignalFolder, "/.tdarr-replace-").concat(jobSuffix, ".partial.tmp")
                    : "".concat(newPath, ".tmp");
                originalPathOld = "".concat(originalPath, ".partial.old");
                args.jobLog(JSON.stringify({
                    currentPath: currentPath,
                    newPath: newPath,
                    newPathTmp: newPathTmp,
                    originalPathOld: originalPathOld,
                }));
                if (!(atomicSwap && newPath !== originalPath)) return [3 /*break*/, 2];
                return [4 /*yield*/, getFileId(originalPath)];
            case 1:
                _a = _c.sent();
                return [3 /*break*/, 3];
            case 2:
                _a = null;
                _c.label = 3;
            case 3:
                originalIdBefore = _a;
                if (!!atomicSwap) return [3 /*break*/, 5];
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
            case 4:
                _c.sent();
                _c.label = 5;
            case 5:
                _c.trys.push([5, 7, , 10]);
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: currentPath,
                        destinationPath: newPathTmp,
                        args: args,
                    })];
            case 6:
                _c.sent();
                return [3 /*break*/, 10];
            case 7:
                err_2 = _c.sent();
                if (!atomicSwap) return [3 /*break*/, 9];
                args.jobLog("Failed to stage ".concat(currentPath, " as ").concat(newPathTmp, ", original untouched"));
                return [4 /*yield*/, removeStaged(args, newPathTmp)];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9: throw err_2;
            case 10: return [4 /*yield*/, (0, fileUtils_1.fileExists)(originalPath)];
            case 11:
                originalFileExists = _c.sent();
                currentFileIsNotOriginal = originalPath !== currentPath;
                shouldRenameOriginal = !atomicSwap && originalFileExists && currentFileIsNotOriginal;
                args.jobLog(JSON.stringify({
                    originalFileExists: originalFileExists,
                    currentFileIsNotOriginal: currentFileIsNotOriginal,
                }));
                originalRenamed = false;
                if (!shouldRenameOriginal) return [3 /*break*/, 24];
                return [4 /*yield*/, (0, fileUtils_1.fileExists)(originalPathOld)];
            case 12:
                if (!_c.sent()) return [3 /*break*/, 16];
                args.jobLog("Removing stale file at ".concat(originalPathOld));
                _c.label = 13;
            case 13:
                _c.trys.push([13, 15, , 16]);
                return [4 /*yield*/, fs_1.promises.unlink(originalPathOld)];
            case 14:
                _c.sent();
                return [3 /*break*/, 16];
            case 15:
                staleErr_1 = _c.sent();
                args.jobLog("Failed to remove stale file ".concat(originalPathOld, ": ").concat(JSON.stringify(staleErr_1)));
                return [3 /*break*/, 16];
            case 16:
                args.jobLog("Renaming original file to: ".concat(originalPathOld));
                _c.label = 17;
            case 17:
                _c.trys.push([17, 19, , 24]);
                return [4 /*yield*/, fs_1.promises.rename(originalPath, originalPathOld)];
            case 18:
                _c.sent();
                originalRenamed = true;
                return [3 /*break*/, 24];
            case 19:
                err_3 = _c.sent();
                args.jobLog("Failed to rename original file aside: ".concat(JSON.stringify(err_3)));
                _c.label = 20;
            case 20:
                _c.trys.push([20, 22, , 23]);
                return [4 /*yield*/, fs_1.promises.unlink(newPathTmp)];
            case 21:
                _c.sent();
                return [3 /*break*/, 23];
            case 22:
                cleanupErr_2 = _c.sent();
                args.jobLog("Failed to clean up temporary file ".concat(newPathTmp, ": ").concat(JSON.stringify(cleanupErr_2)));
                return [3 /*break*/, 23];
            case 23: throw err_3;
            case 24:
                if (!atomicSwap) return [3 /*break*/, 38];
                _c.label = 25;
            case 25:
                _c.trys.push([25, 27, , 29]);
                return [4 /*yield*/, fs_1.promises.rename(newPathTmp, newPath)];
            case 26:
                _c.sent();
                return [3 /*break*/, 29];
            case 27:
                err_4 = _c.sent();
                args.jobLog("Failed to rename ".concat(newPathTmp, " to ").concat(newPath, ", original untouched: ").concat(JSON.stringify(err_4)));
                return [4 /*yield*/, removeStaged(args, newPathTmp)];
            case 28:
                _c.sent();
                throw err_4;
            case 29:
                args.jobLog("Atomically replaced ".concat(newPath));
                if (!originalIdBefore) return [3 /*break*/, 37];
                return [4 /*yield*/, getFileId(originalPath)];
            case 30:
                originalIdAfter = _c.sent();
                return [4 /*yield*/, getFileId(newPath)];
            case 31:
                newId = _c.sent();
                if (!(originalIdAfter
                    && newId
                    && sameFile(originalIdAfter, originalIdBefore)
                    && !sameFile(originalIdAfter, newId))) return [3 /*break*/, 36];
                args.jobLog("Deleting original file: ".concat(originalPath));
                _c.label = 32;
            case 32:
                _c.trys.push([32, 34, , 35]);
                return [4 /*yield*/, fs_1.promises.unlink(originalPath)];
            case 33:
                _c.sent();
                return [3 /*break*/, 35];
            case 34:
                err_5 = _c.sent();
                args.jobLog("Failed to delete original file ".concat(originalPath, ": ").concat(JSON.stringify(err_5)));
                return [3 /*break*/, 35];
            case 35: return [3 /*break*/, 37];
            case 36:
                if (originalIdAfter) {
                    args.jobLog("Not deleting ".concat(originalPath, ": it now resolves to the new file (case-insensitive filesystem?)"));
                }
                _c.label = 37;
            case 37: return [2 /*return*/, {
                    outputFileObj: {
                        _id: newPath,
                    },
                    outputNumber: 1,
                    variables: args.variables,
                }];
            case 38: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
            case 39:
                _c.sent();
                _c.label = 40;
            case 40:
                _c.trys.push([40, 42, , 47]);
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: newPathTmp,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 41:
                _c.sent();
                return [3 /*break*/, 47];
            case 42:
                err_6 = _c.sent();
                args.jobLog("Failed to move ".concat(newPathTmp, " to ").concat(newPath, ": ").concat(JSON.stringify(err_6)));
                if (!originalRenamed) return [3 /*break*/, 46];
                args.jobLog("Restoring original file from ".concat(originalPathOld));
                _c.label = 43;
            case 43:
                _c.trys.push([43, 45, , 46]);
                return [4 /*yield*/, fs_1.promises.rename(originalPathOld, originalPath)];
            case 44:
                _c.sent();
                return [3 /*break*/, 46];
            case 45:
                restoreErr_1 = _c.sent();
                args.jobLog("Failed to restore original file: ".concat(JSON.stringify(restoreErr_1)));
                return [3 /*break*/, 46];
            case 46: throw err_6;
            case 47:
                if (!originalRenamed) return [3 /*break*/, 51];
                args.jobLog("Deleting renamed original file: ".concat(originalPathOld));
                _c.label = 48;
            case 48:
                _c.trys.push([48, 50, , 51]);
                return [4 /*yield*/, fs_1.promises.unlink(originalPathOld)];
            case 49:
                _c.sent();
                return [3 /*break*/, 51];
            case 50:
                err_7 = _c.sent();
                args.jobLog("Failed to delete renamed original file ".concat(originalPathOld, ": ").concat(JSON.stringify(err_7)));
                return [3 /*break*/, 51];
            case 51: return [2 /*return*/, {
                    outputFileObj: {
                        _id: newPath,
                    },
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
