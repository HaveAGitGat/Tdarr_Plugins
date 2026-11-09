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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = exports.plugin = exports.details = void 0;
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var path_1 = __importDefault(require("path"));
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Replace Original File',
    description: "\n  This plugin will replace the original file with the new file. It should be used in the last stages of the flow.\n  It is important to remember that the original file will be replaced and therefore will be lost.\n  ",
    style: { borderColor: 'green' },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faArrowRight',
    inputs: [],
    outputs: [{ number: 1, tooltip: 'Continue to next plugin' }],
}); };
exports.details = details;
var sha256 = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var hash = (0, crypto_1.createHash)('sha256');
                var input = (0, fs_1.createReadStream)(filePath);
                input.on('error', reject);
                input.on('data', function (chunk) { return hash.update(chunk); });
                input.on('end', function () { return resolve(hash.digest('hex')); });
            })];
    });
}); };
exports.sha256 = sha256;
var isMissing = function (error) { return (typeof error === 'object' && error !== null && error.code === 'ENOENT'); };
var errorCode = function (error) { return (typeof error === 'object' && error !== null ? error.code : undefined); };
var refuse = function (message) {
    throw new Error("RECOVERY_REQUIRED: ".concat(message));
};
var assertRegularFile = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var stat;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.promises.lstat(filePath)];
            case 1:
                stat = _a.sent();
                if (!stat.isFile() || stat.isSymbolicLink())
                    refuse("expected regular file at ".concat(filePath));
                return [2 /*return*/];
        }
    });
}); };
var assertAbsent = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.promises.lstat(filePath)];
            case 1:
                _a.sent();
                refuse("refusing occupied path ".concat(filePath));
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                if (!isMissing(error_1))
                    throw error_1;
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var assertJournalTarget = function (journalPath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.promises.lstat(journalPath)];
            case 1:
                _a.sent();
                refuse("plugin journal path already occupied at ".concat(journalPath));
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                if (!isMissing(error_2))
                    throw error_2;
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var copyExclusive = function (sourcePath, destinationPath) { return __awaiter(void 0, void 0, void 0, function () {
    var destination;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.promises.copyFile(sourcePath, destinationPath, fs_1.constants.COPYFILE_EXCL)];
            case 1:
                _a.sent();
                return [4 /*yield*/, fs_1.promises.open(destinationPath, 'r')];
            case 2:
                destination = _a.sent();
                _a.label = 3;
            case 3:
                _a.trys.push([3, , 5, 7]);
                return [4 /*yield*/, destination.sync()];
            case 4:
                _a.sent();
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, destination.close()];
            case 6:
                _a.sent();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
var stageExclusive = function (sourcePath, stagePath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 5]);
                return [4 /*yield*/, fs_1.promises.link(sourcePath, stagePath)];
            case 1:
                _a.sent();
                return [3 /*break*/, 5];
            case 2:
                error_3 = _a.sent();
                if (!(errorCode(error_3) === 'EXDEV')) return [3 /*break*/, 4];
                return [4 /*yield*/, copyExclusive(sourcePath, stagePath)];
            case 3:
                _a.sent();
                return [2 /*return*/];
            case 4: throw error_3;
            case 5: return [2 /*return*/];
        }
    });
}); };
var writeJournal = function (journalPath, journal) { return __awaiter(void 0, void 0, void 0, function () {
    var directory, temporary, file, parent, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                directory = path_1.default.dirname(journalPath);
                temporary = path_1.default.join(directory, ".".concat(path_1.default.basename(journalPath), ".").concat((0, crypto_1.randomBytes)(8).toString('hex')));
                return [4 /*yield*/, fs_1.promises.open(temporary, 'wx', 384)];
            case 1:
                file = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, , 5, 7]);
                return [4 /*yield*/, file.writeFile("".concat(JSON.stringify(journal), "\n"), 'utf8')];
            case 3:
                _b.sent();
                return [4 /*yield*/, file.sync()];
            case 4:
                _b.sent();
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, file.close()];
            case 6:
                _b.sent();
                return [7 /*endfinally*/];
            case 7: return [4 /*yield*/, fs_1.promises.rename(temporary, journalPath)];
            case 8:
                _b.sent();
                return [4 /*yield*/, fs_1.promises.open(directory, 'r')];
            case 9:
                parent = _b.sent();
                _b.label = 10;
            case 10:
                _b.trys.push([10, 12, 13, 15]);
                return [4 /*yield*/, parent.sync()];
            case 11:
                _b.sent();
                return [3 /*break*/, 15];
            case 12:
                error_4 = _b.sent();
                if (!['EINVAL', 'ENOTSUP'].includes((_a = errorCode(error_4)) !== null && _a !== void 0 ? _a : ''))
                    throw error_4;
                return [3 /*break*/, 15];
            case 13: return [4 /*yield*/, parent.close()];
            case 14:
                _b.sent();
                return [7 /*endfinally*/];
            case 15: return [2 /*return*/];
        }
    });
}); };
var appendJournal = function (journalPath, journal, action) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                journal.actions.push(__assign(__assign({}, action), { at: new Date().toISOString() }));
                return [4 /*yield*/, writeJournal(journalPath, journal)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var ownershipFrom = function (args) {
    var raw = args.variables.user.replaceOwnership;
    if (!raw)
        return undefined;
    var parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        refuse('replaceOwnership is not JSON');
    }
    var value = parsed;
    if (value.schema !== 'tdarr/file-replacement/v1'
        || typeof value.sourcePath !== 'string'
        || typeof value.sourceSha256 !== 'string'
        || typeof value.workingPath !== 'string'
        || typeof value.workingSha256 !== 'string'
        || typeof value.destinationPath !== 'string'
        || typeof value.scratchDir !== 'string'
        || typeof value.journalPath !== 'string'
        || value.retainOriginal !== true) {
        refuse('replaceOwnership is incomplete or unsafe');
    }
    return value;
};
var privateDirectory = function (sourcePath, ownership) { return __awaiter(void 0, void 0, void 0, function () {
    var parent, privatePath, error_5, stat;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                parent = path_1.default.dirname(sourcePath);
                privatePath = (_a = ownership === null || ownership === void 0 ? void 0 : ownership.scratchDir) !== null && _a !== void 0 ? _a : path_1.default.join(parent, ".mmh-".concat((0, crypto_1.randomBytes)(16).toString('hex'), ".partial"));
                if (path_1.default.dirname(privatePath) !== parent || !/^\.mmh-[A-Za-z0-9_-]+\.partial$/.test(path_1.default.basename(privatePath))) {
                    refuse("unsafe private directory ".concat(privatePath));
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs_1.promises.mkdir(privatePath, { mode: 448 })];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                if (errorCode(error_5) === 'EEXIST')
                    refuse("private directory already occupied at ".concat(privatePath));
                throw error_5;
            case 4: return [4 /*yield*/, fs_1.promises.lstat(privatePath)];
            case 5:
                stat = _b.sent();
                if (!stat.isDirectory() || stat.isSymbolicLink()
                    || (process.platform !== 'win32' && (stat.mode & 63) !== 0)) {
                    refuse("unsafe private directory ".concat(privatePath));
                }
                return [2 /*return*/, privatePath];
        }
    });
}); };
var restoreNoClobber = function (asidePath, sourcePath, sourceHash, journalPath, journal, operation) { return __awaiter(void 0, void 0, void 0, function () {
    var error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, appendJournal(journalPath, journal, {
                    operation: operation,
                    sourcePath: asidePath, destinationPath: sourcePath, expectedHash: sourceHash, state: 'intent',
                })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 6]);
                return [4 /*yield*/, fs_1.promises.link(asidePath, sourcePath)];
            case 3:
                _a.sent();
                return [3 /*break*/, 6];
            case 4:
                error_6 = _a.sent();
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: operation,
                        destinationPath: sourcePath, state: errorCode(error_6) === 'EEXIST' ? 'occupied' : 'failed', error: String(error_6),
                    })];
            case 5:
                _a.sent();
                return [2 /*return*/, false];
            case 6: return [4 /*yield*/, sha256(sourcePath)];
            case 7:
                if (!((_a.sent()) !== sourceHash)) return [3 /*break*/, 9];
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: operation, destinationPath: sourcePath, state: 'hash-mismatch' })];
            case 8:
                _a.sent();
                return [2 /*return*/, false];
            case 9: return [4 /*yield*/, fs_1.promises.unlink(asidePath)];
            case 10:
                _a.sent();
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: operation, destinationPath: sourcePath, state: 'complete' })];
            case 11:
                _a.sent();
                return [2 /*return*/, true];
        }
    });
}); };
var safeReplace = function (args, ownership) { return __awaiter(void 0, void 0, void 0, function () {
    var sourcePath, workingPath, extension, destinationPath, originalExists, sourceHash, _a, _b, workingHash, _c, _d, _e, privatePath, stagePath, asidePath, journalPath, journal, movedHash, restored, error_7, restored, _f;
    var _g, _h, _j, _k, _l, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                sourcePath = (_g = ownership === null || ownership === void 0 ? void 0 : ownership.sourcePath) !== null && _g !== void 0 ? _g : args.originalLibraryFile._id;
                workingPath = (_h = ownership === null || ownership === void 0 ? void 0 : ownership.workingPath) !== null && _h !== void 0 ? _h : args.inputFileObj._id;
                extension = path_1.default.extname(args.inputFileObj._id);
                destinationPath = (_j = ownership === null || ownership === void 0 ? void 0 : ownership.destinationPath) !== null && _j !== void 0 ? _j : path_1.default.join(path_1.default.dirname(sourcePath), "".concat(path_1.default.basename(args.inputFileObj._id, extension)).concat(extension));
                return [4 /*yield*/, fs_1.promises.lstat(sourcePath).then(function () { return true; }).catch(function (error) {
                        if (isMissing(error))
                            return false;
                        throw error;
                    })];
            case 1:
                originalExists = _o.sent();
                if (path_1.default.dirname(destinationPath) !== path_1.default.dirname(sourcePath))
                    refuse('destination must be a sibling of the original');
                if (ownership && !originalExists)
                    refuse("guarded original is missing at ".concat(sourcePath));
                if (!originalExists) return [3 /*break*/, 3];
                return [4 /*yield*/, assertRegularFile(sourcePath)];
            case 2:
                _o.sent();
                _o.label = 3;
            case 3: return [4 /*yield*/, assertRegularFile(workingPath)];
            case 4:
                _o.sent();
                if (!originalExists) return [3 /*break*/, 8];
                if (!((_k = ownership === null || ownership === void 0 ? void 0 : ownership.sourceSha256) !== null && _k !== void 0)) return [3 /*break*/, 5];
                _b = _k;
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, sha256(sourcePath)];
            case 6:
                _b = _o.sent();
                _o.label = 7;
            case 7:
                _a = (_b);
                return [3 /*break*/, 9];
            case 8:
                _a = undefined;
                _o.label = 9;
            case 9:
                sourceHash = _a;
                if (!((_l = ownership === null || ownership === void 0 ? void 0 : ownership.workingSha256) !== null && _l !== void 0)) return [3 /*break*/, 10];
                _c = _l;
                return [3 /*break*/, 12];
            case 10: return [4 /*yield*/, sha256(workingPath)];
            case 11:
                _c = _o.sent();
                _o.label = 12;
            case 12:
                workingHash = _c;
                _e = sourceHash;
                if (!_e) return [3 /*break*/, 14];
                return [4 /*yield*/, sha256(sourcePath)];
            case 13:
                _e = (_o.sent()) !== sourceHash;
                _o.label = 14;
            case 14:
                _d = (_e);
                if (_d) return [3 /*break*/, 16];
                return [4 /*yield*/, sha256(workingPath)];
            case 15:
                _d = (_o.sent()) !== workingHash;
                _o.label = 16;
            case 16:
                if (_d) {
                    refuse('source or working file drifted before staging');
                }
                if (!(destinationPath !== sourcePath)) return [3 /*break*/, 18];
                return [4 /*yield*/, assertAbsent(destinationPath)];
            case 17:
                _o.sent();
                _o.label = 18;
            case 18:
                if (!ownership) return [3 /*break*/, 20];
                return [4 /*yield*/, assertJournalTarget(ownership.journalPath)];
            case 19:
                _o.sent();
                _o.label = 20;
            case 20: return [4 /*yield*/, privateDirectory(sourcePath, ownership)];
            case 21:
                privatePath = _o.sent();
                stagePath = path_1.default.join(privatePath, 'stage');
                asidePath = path_1.default.join(privatePath, 'original');
                journalPath = (_m = ownership === null || ownership === void 0 ? void 0 : ownership.journalPath) !== null && _m !== void 0 ? _m : path_1.default.join(privatePath, 'replacement.json');
                journal = { schema: 'tdarr/file-replacement-journal/v1', actions: [] };
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: 'stage', sourcePath: workingPath, destinationPath: stagePath, expectedHash: workingHash, state: 'intent',
                    })];
            case 22:
                _o.sent();
                return [4 /*yield*/, stageExclusive(workingPath, stagePath)];
            case 23:
                _o.sent();
                return [4 /*yield*/, sha256(stagePath)];
            case 24:
                if ((_o.sent()) !== workingHash)
                    refuse('staged output hash mismatch');
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: 'stage', destinationPath: stagePath, state: 'complete' })];
            case 25:
                _o.sent();
                if (!sourceHash) return [3 /*break*/, 33];
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: 'aside',
                        sourcePath: sourcePath,
                        destinationPath: asidePath, expectedHash: sourceHash, state: 'intent',
                    })];
            case 26:
                _o.sent();
                return [4 /*yield*/, fs_1.promises.rename(sourcePath, asidePath)];
            case 27:
                _o.sent();
                return [4 /*yield*/, sha256(asidePath)];
            case 28:
                movedHash = _o.sent();
                if (!(movedHash !== sourceHash)) return [3 /*break*/, 31];
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: 'aside', destinationPath: asidePath, actualHash: movedHash, state: 'unexpected',
                    })];
            case 29:
                _o.sent();
                return [4 /*yield*/, restoreNoClobber(asidePath, sourcePath, movedHash, journalPath, journal, 'restore')];
            case 30:
                restored = _o.sent();
                if (!restored)
                    args.jobLog("RECOVERY_REQUIRED: unexpected bytes preserved at ".concat(asidePath));
                refuse("unexpected bytes moved aside to ".concat(asidePath));
                _o.label = 31;
            case 31: return [4 /*yield*/, appendJournal(journalPath, journal, { operation: 'aside', destinationPath: asidePath, state: 'complete' })];
            case 32:
                _o.sent();
                _o.label = 33;
            case 33: return [4 /*yield*/, appendJournal(journalPath, journal, {
                    operation: 'publish', sourcePath: stagePath,
                    destinationPath: destinationPath,
                    expectedHash: workingHash, state: 'intent',
                })];
            case 34:
                _o.sent();
                _o.label = 35;
            case 35:
                _o.trys.push([35, 37, , 42]);
                return [4 /*yield*/, fs_1.promises.link(stagePath, destinationPath)];
            case 36:
                _o.sent();
                return [3 /*break*/, 42];
            case 37:
                error_7 = _o.sent();
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: 'publish',
                        destinationPath: destinationPath,
                        state: errorCode(error_7) === 'EEXIST' ? 'occupied' : 'failed', error: String(error_7),
                    })];
            case 38:
                _o.sent();
                if (!sourceHash) return [3 /*break*/, 41];
                return [4 /*yield*/, restoreNoClobber(asidePath, sourcePath, sourceHash, journalPath, journal, 'rollback')];
            case 39:
                restored = _o.sent();
                if (!!restored) return [3 /*break*/, 41];
                return [4 /*yield*/, appendJournal(journalPath, journal, {
                        operation: 'recovery-required',
                        sourcePath: sourcePath,
                        destinationPath: destinationPath,
                        asidePath: asidePath,
                        state: 'preserved-both-occupants',
                    })];
            case 40:
                _o.sent();
                args.jobLog("RECOVERY_REQUIRED: publish occupant at ".concat(destinationPath, "; original occupant at ").concat(sourcePath, "; aside preserved at ").concat(asidePath));
                refuse("publish and rollback occupants preserved at ".concat(destinationPath, ", ").concat(sourcePath, ", and ").concat(asidePath));
                _o.label = 41;
            case 41: throw error_7;
            case 42: return [4 /*yield*/, sha256(destinationPath)];
            case 43:
                if ((_o.sent()) !== workingHash)
                    refuse("published output hash mismatch at ".concat(destinationPath));
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: 'publish', destinationPath: destinationPath, state: 'complete' })];
            case 44:
                _o.sent();
                if (!ownership) return [3 /*break*/, 46];
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: 'retain', destinationPath: asidePath, state: 'complete' })];
            case 45:
                _o.sent();
                return [3 /*break*/, 56];
            case 46:
                _f = sourceHash;
                if (!_f) return [3 /*break*/, 48];
                return [4 /*yield*/, sha256(asidePath)];
            case 47:
                _f = (_o.sent()) !== sourceHash;
                _o.label = 48;
            case 48:
                if (_f)
                    refuse("standalone aside drifted at ".concat(asidePath));
                if (!sourceHash) return [3 /*break*/, 50];
                return [4 /*yield*/, fs_1.promises.unlink(asidePath)];
            case 49:
                _o.sent();
                _o.label = 50;
            case 50: return [4 /*yield*/, sha256(stagePath)];
            case 51:
                if ((_o.sent()) !== workingHash)
                    refuse("standalone stage drifted at ".concat(stagePath));
                return [4 /*yield*/, appendJournal(journalPath, journal, { operation: 'retire', destinationPath: privatePath, state: 'complete' })];
            case 52:
                _o.sent();
                return [4 /*yield*/, fs_1.promises.unlink(stagePath)];
            case 53:
                _o.sent();
                return [4 /*yield*/, fs_1.promises.unlink(journalPath)];
            case 54:
                _o.sent();
                return [4 /*yield*/, fs_1.promises.rmdir(privatePath)];
            case 55:
                _o.sent();
                _o.label = 56;
            case 56: return [2 /*return*/, destinationPath];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, destinationPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                if (args.inputFileObj._id === args.originalLibraryFile._id
                    && args.inputFileObj.file_size === args.originalLibraryFile.file_size) {
                    args.jobLog('File has not changed, no need to replace file');
                    return [2 /*return*/, { outputFileObj: args.inputFileObj, outputNumber: 1, variables: args.variables }];
                }
                return [4 /*yield*/, safeReplace(args, ownershipFrom(args))];
            case 1:
                destinationPath = _a.sent();
                return [2 /*return*/, { outputFileObj: { _id: destinationPath }, outputNumber: 1, variables: args.variables }];
        }
    });
}); };
exports.plugin = plugin;
