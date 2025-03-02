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
exports.getScanTypes = exports.getPluginWorkDir = exports.moveFileAndValidate = exports.getFileSize = exports.getSubStem = exports.getFfType = exports.getFileAbosluteDir = exports.getFileName = exports.getContainer = exports.fileExists = void 0;
var fs_1 = require("fs");
var fileExists = function (path) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, fs_1.promises.stat(path).catch(function () { return false; })];
        case 1: return [2 /*return*/, !!(_a.sent())];
    }
}); }); };
exports.fileExists = fileExists;
var getContainer = function (filePath) {
    var parts = filePath.split('.');
    return parts[parts.length - 1];
};
exports.getContainer = getContainer;
var getFileName = function (filePath) {
    var parts = filePath.split('/');
    var fileNameAndContainer = parts[parts.length - 1];
    var parts2 = fileNameAndContainer.split('.');
    parts2.pop();
    return parts2.join('.');
};
exports.getFileName = getFileName;
var getFileAbosluteDir = function (filePath) {
    var parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
};
exports.getFileAbosluteDir = getFileAbosluteDir;
var getFfType = function (codecType) { return (codecType === 'video' ? 'v' : 'a'); };
exports.getFfType = getFfType;
var getSubStem = function (_a) {
    var inputPathStem = _a.inputPathStem, inputPath = _a.inputPath;
    var subStem = inputPath.substring(inputPathStem.length);
    var parts = subStem.split('/');
    parts.pop();
    return parts.join('/');
};
exports.getSubStem = getSubStem;
var getFileSize = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var stats, size;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.promises.stat(file)];
            case 1:
                stats = _a.sent();
                size = stats.size;
                return [2 /*return*/, size];
        }
    });
}); };
exports.getFileSize = getFileSize;
var moveFileAndValidate = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var inputSize, res1, outputSize, err_1, res2, errMessage;
    var inputPath = _b.inputPath, outputPath = _b.outputPath, args = _b.args;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, exports.getFileSize)(inputPath)];
            case 1:
                inputSize = _c.sent();
                args.jobLog("Attempt 1: Moving file from ".concat(inputPath, " to ").concat(outputPath));
                return [4 /*yield*/, new Promise(function (resolve) {
                        args.deps.gracefulfs.rename(inputPath, outputPath, function (err) {
                            if (err) {
                                args.jobLog("Failed to move file from ".concat(inputPath, " to ").concat(outputPath));
                                args.jobLog(JSON.stringify(err));
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    })];
            case 2:
                res1 = _c.sent();
                outputSize = 0;
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, exports.getFileSize)(outputPath)];
            case 4:
                outputSize = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                err_1 = _c.sent();
                args.jobLog(JSON.stringify(err_1));
                return [3 /*break*/, 6];
            case 6:
                if (!(!res1 || inputSize !== outputSize)) return [3 /*break*/, 9];
                if (inputSize !== outputSize) {
                    args.jobLog("File sizes do not match, input: ".concat(inputSize, " ")
                        + "does not equal  output: ".concat(outputSize));
                }
                args.jobLog("Attempt 1  failed: Moving file from ".concat(inputPath, " to ").concat(outputPath));
                args.jobLog("Attempt 2: Moving file from ".concat(inputPath, " to ").concat(outputPath));
                return [4 /*yield*/, new Promise(function (resolve) {
                        args.deps.mvdir(inputPath, outputPath, { overwrite: true })
                            .then(function () {
                            resolve(true);
                        }).catch(function (err) {
                            args.jobLog("Failed to move file from ".concat(inputPath, " to ").concat(outputPath));
                            args.jobLog(JSON.stringify(err));
                            resolve(false);
                        });
                    })];
            case 7:
                res2 = _c.sent();
                return [4 /*yield*/, (0, exports.getFileSize)(outputPath)];
            case 8:
                outputSize = _c.sent();
                if (!res2 || inputSize !== outputSize) {
                    if (inputSize !== outputSize) {
                        args.jobLog("File sizes do not match, input: ".concat(inputSize, " ")
                            + "does not equal  output: ".concat(outputSize));
                    }
                    errMessage = "Failed to move file from ".concat(inputPath, " to ").concat(outputPath, ", check errors above");
                    args.jobLog(errMessage);
                    throw new Error(errMessage);
                }
                _c.label = 9;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.moveFileAndValidate = moveFileAndValidate;
var getPluginWorkDir = function (args) {
    var pluginWorkDir = "".concat(args.workDir, "/").concat(new Date().getTime());
    args.deps.fsextra.ensureDirSync(pluginWorkDir);
    return pluginWorkDir;
};
exports.getPluginWorkDir = getPluginWorkDir;
var getScanTypes = function (pluginsTextRaw) {
    var scanTypes = {
        exifToolScan: true,
        mediaInfoScan: false,
        closedCaptionScan: false,
    };
    var scannerTypes = [
        // needed for frame and duration data for ffmpeg
        // {
        //   type: 'exifToolScan',
        //   terms: [
        //     'meta',
        //   ],
        // },
        {
            type: 'mediaInfoScan',
            terms: [
                'mediaInfo',
            ],
        },
        {
            type: 'closedCaptionScan',
            terms: [
                'hasClosedCaptions',
            ],
        },
    ];
    var text = pluginsTextRaw.join('');
    scannerTypes.forEach(function (scanner) {
        scanner.terms.forEach(function (term) {
            if (text.includes(term)) {
                scanTypes[scanner.type] = true;
            }
        });
    });
    return scanTypes;
};
exports.getScanTypes = getScanTypes;
