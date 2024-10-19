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
var fs_1 = require("fs");
var fileUtils_1 = require("./fileUtils");
var getSizeBytes = function (fPath) { return __awaiter(void 0, void 0, void 0, function () {
    var size, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                size = 0;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, fileUtils_1.getFileSize)(fPath)];
            case 2:
                size = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, size];
        }
    });
}); };
var compareOldNew = function (_a) {
    var sourceFileSize = _a.sourceFileSize, destinationSize = _a.destinationSize, args = _a.args;
    if (destinationSize !== sourceFileSize) {
        args.jobLog("After move/copy, destination file of size ".concat(destinationSize, " does not match")
            + " cache file of size ".concat(sourceFileSize));
    }
    else {
        args.jobLog("After move/copy, destination file of size ".concat(destinationSize, " does match")
            + " cache file of size ".concat(sourceFileSize));
    }
};
var tryMove = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var error, err_2, destinationSize;
    var sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, sourceFileSize = _b.sourceFileSize, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                args.jobLog("Attempting move from ".concat(sourcePath, " to ").concat(destinationPath, ", method 1"));
                error = false;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs_1.promises.rename(sourcePath, destinationPath)];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                err_2 = _c.sent();
                error = true;
                args.jobLog("File move error: ".concat(JSON.stringify(err_2)));
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, getSizeBytes(destinationPath)];
            case 5:
                destinationSize = _c.sent();
                compareOldNew({
                    sourceFileSize: sourceFileSize,
                    destinationSize: destinationSize,
                    args: args,
                });
                if (error || destinationSize !== sourceFileSize) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var tryMvdir = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var error, destinationSize;
    var sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, sourceFileSize = _b.sourceFileSize, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                args.jobLog("Attempting move from ".concat(sourcePath, " to ").concat(destinationPath, ", method 2"));
                error = false;
                return [4 /*yield*/, new Promise(function (resolve) {
                        // fs-extra and move-file don't work when destination is on windows root of drive
                        // mvdir will try to move else fall back to copy/unlink
                        // potential bug on unraid
                        args.deps.mvdir(sourcePath, destinationPath, { overwrite: true })
                            .then(function () {
                            resolve(true);
                        }).catch(function (err) {
                            error = true;
                            args.jobLog("File move error: ".concat(err));
                            resolve(err);
                        });
                    })];
            case 1:
                _c.sent();
                return [4 /*yield*/, getSizeBytes(destinationPath)];
            case 2:
                destinationSize = _c.sent();
                compareOldNew({
                    sourceFileSize: sourceFileSize,
                    destinationSize: destinationSize,
                    args: args,
                });
                if (error || destinationSize !== sourceFileSize) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
        }
    });
}); };
// Keep in e.g. https://github.com/HaveAGitGat/Tdarr/issues/858
var tyNcp = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var error_1, destinationSize;
    var sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, sourceFileSize = _b.sourceFileSize, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!args.deps.ncp) return [3 /*break*/, 3];
                args.jobLog("Attempting copy from ".concat(sourcePath, " to ").concat(destinationPath, " , method 1"));
                error_1 = false;
                return [4 /*yield*/, new Promise(function (resolve) {
                        args.deps.ncp(sourcePath, destinationPath, function (err) {
                            if (err) {
                                error_1 = true;
                                args.jobLog("File copy error: ".concat(err));
                                resolve(err);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    })];
            case 1:
                _c.sent();
                return [4 /*yield*/, getSizeBytes(destinationPath)];
            case 2:
                destinationSize = _c.sent();
                compareOldNew({
                    sourceFileSize: sourceFileSize,
                    destinationSize: destinationSize,
                    args: args,
                });
                if (error_1 || destinationSize !== sourceFileSize) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
            case 3: return [2 /*return*/, false];
        }
    });
}); };
var tryNormalCopy = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var error, err_3, destinationSize;
    var sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, sourceFileSize = _b.sourceFileSize, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                args.jobLog("Attempting copy from ".concat(sourcePath, " to ").concat(destinationPath, " , method 2"));
                error = false;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs_1.promises.copyFile(sourcePath, destinationPath)];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                err_3 = _c.sent();
                error = true;
                args.jobLog("File copy error: ".concat(JSON.stringify(err_3)));
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, getSizeBytes(destinationPath)];
            case 5:
                destinationSize = _c.sent();
                compareOldNew({
                    sourceFileSize: sourceFileSize,
                    destinationSize: destinationSize,
                    args: args,
                });
                if (error || destinationSize !== sourceFileSize) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
        }
    });
}); };
var cleanSourceFile = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var err_4;
    var args = _b.args, sourcePath = _b.sourcePath;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                args.jobLog("Deleting source file ".concat(sourcePath));
                return [4 /*yield*/, fs_1.promises.unlink(sourcePath)];
            case 1:
                _c.sent();
                return [3 /*break*/, 3];
            case 2:
                err_4 = _c.sent();
                args.jobLog("Failed to delete source file ".concat(sourcePath, ": ").concat(JSON.stringify(err_4)));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var fileMoveOrCopy = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var sourceFileSize, moved, ncpd, copied;
    var operation = _b.operation, sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                args.jobLog('Calculating cache file size in bytes');
                return [4 /*yield*/, getSizeBytes(sourcePath)];
            case 1:
                sourceFileSize = _c.sent();
                args.jobLog("".concat(sourceFileSize));
                if (!(operation === 'move')) return [3 /*break*/, 3];
                return [4 /*yield*/, tryMove({
                        sourcePath: sourcePath,
                        destinationPath: destinationPath,
                        args: args,
                        sourceFileSize: sourceFileSize,
                    })];
            case 2:
                moved = _c.sent();
                if (moved) {
                    return [2 /*return*/, true];
                }
                // disable: https://github.com/HaveAGitGat/Tdarr/issues/885
                // const mvdird = await tryMvdir({
                //   sourcePath,
                //   destinationPath,
                //   args,
                //   sourceFileSize,
                // });
                // if (mvdird) {
                //   return true;
                // }
                args.jobLog('Failed to move file, trying copy');
                _c.label = 3;
            case 3: return [4 /*yield*/, tyNcp({
                    sourcePath: sourcePath,
                    destinationPath: destinationPath,
                    args: args,
                    sourceFileSize: sourceFileSize,
                })];
            case 4:
                ncpd = _c.sent();
                if (!ncpd) return [3 /*break*/, 7];
                if (!(operation === 'move')) return [3 /*break*/, 6];
                return [4 /*yield*/, cleanSourceFile({
                        args: args,
                        sourcePath: sourcePath,
                    })];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6: return [2 /*return*/, true];
            case 7: return [4 /*yield*/, tryNormalCopy({
                    sourcePath: sourcePath,
                    destinationPath: destinationPath,
                    args: args,
                    sourceFileSize: sourceFileSize,
                })];
            case 8:
                copied = _c.sent();
                if (!copied) return [3 /*break*/, 11];
                if (!(operation === 'move')) return [3 /*break*/, 10];
                return [4 /*yield*/, cleanSourceFile({
                        args: args,
                        sourcePath: sourcePath,
                    })];
            case 9:
                _c.sent();
                _c.label = 10;
            case 10: return [2 /*return*/, true];
            case 11: throw new Error("Failed to ".concat(operation, " file"));
        }
    });
}); };
exports.default = fileMoveOrCopy;
