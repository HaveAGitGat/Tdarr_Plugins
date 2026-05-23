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
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var util_1 = require("util");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var customPermissionsDisplayConditions = {
    logic: 'AND',
    sets: [
        {
            logic: 'AND',
            inputs: [
                {
                    name: 'permissionSource',
                    value: 'custom',
                    condition: '===',
                },
            ],
        },
    ],
};
var customOwnerGroupDisplayConditions = {
    logic: 'AND',
    sets: [
        {
            logic: 'AND',
            inputs: [
                {
                    name: 'ownerGroupSource',
                    value: 'custom',
                    condition: '===',
                },
            ],
        },
    ],
};
var details = function () { return ({
    name: 'Set File Permissions',
    description: 'Set the working or original file permissions and owner/group.',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faFile',
    inputs: [
        {
            label: 'File To Update',
            name: 'fileToUpdate',
            type: 'string',
            defaultValue: 'workingFile',
            inputUI: {
                type: 'dropdown',
                options: [
                    'workingFile',
                    'originalFile',
                ],
            },
            tooltip: 'Specify the file to update.',
        },
        {
            label: 'Permissions Source',
            name: 'permissionSource',
            type: 'string',
            defaultValue: 'originalFile',
            inputUI: {
                type: 'dropdown',
                options: [
                    'originalFile',
                    'custom',
                    'workingFile',
                ],
            },
            tooltip: 'Choose how to set numeric file permissions. workingFile leaves the target file permissions unchanged.',
        },
        {
            label: 'Custom Permissions',
            name: 'customPermissions',
            type: 'string',
            defaultValue: '664',
            inputUI: {
                type: 'text',
                displayConditions: customPermissionsDisplayConditions,
            },
            tooltip: 'Specify custom permissions as an octal value such as 664, 775, or 1777.',
        },
        {
            label: 'Owner/Group Source',
            name: 'ownerGroupSource',
            type: 'string',
            defaultValue: 'originalFile',
            inputUI: {
                type: 'dropdown',
                options: [
                    'originalFile',
                    'custom',
                    'workingFile',
                ],
            },
            tooltip: 'Choose how to set the owner/group. workingFile leaves the target file owner/group unchanged.',
        },
        {
            label: 'Custom User',
            name: 'customUser',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
                displayConditions: customOwnerGroupDisplayConditions,
            },
            tooltip: 'Specify the user name or numeric uid. Leave blank to keep the current user.',
        },
        {
            label: 'Custom Group',
            name: 'customGroup',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
                displayConditions: customOwnerGroupDisplayConditions,
            },
            tooltip: 'Specify the group name or numeric gid. Leave blank to keep the current group.',
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
var execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
var fileTypeModeModulo = 4096;
var isInteger = function (value) { return (typeof value === 'number'
    && value !== Infinity
    && value !== -Infinity
    && !Number.isNaN(value)
    && Math.floor(value) === value); };
var formatMode = function (mode) { return mode.toString(8); };
var getOriginalStatValues = function (args) { return (args.originalLibraryFile.statSync || {}); };
var getOriginalMode = function (args) {
    var mode = getOriginalStatValues(args).mode;
    if (!isInteger(mode)) {
        throw new Error('Original file stat data does not include a valid mode.');
    }
    return mode % fileTypeModeModulo;
};
var getOriginalOwnership = function (args) {
    var _a = getOriginalStatValues(args), uid = _a.uid, gid = _a.gid;
    if (!isInteger(uid) || !isInteger(gid)) {
        throw new Error('Original file stat data does not include a valid uid/gid.');
    }
    return { uid: uid, gid: gid };
};
var parseCustomMode = function (customPermissions) {
    var normalizedPermissions = customPermissions.trim().replace(/^0o/i, '');
    if (!/^[0-7]{3,4}$/.test(normalizedPermissions)) {
        throw new Error('Custom permissions must be an octal value such as 664, 775, or 1777.');
    }
    return parseInt(normalizedPermissions, 8);
};
var validateOwnershipInput = function (value, label) {
    if (value.includes(':')) {
        throw new Error("".concat(label, " cannot contain ':'. Enter the user and group in separate inputs."));
    }
};
var getCustomOwnerSpec = function (customUser, customGroup) {
    var user = customUser.trim();
    var group = customGroup.trim();
    validateOwnershipInput(user, 'Custom user');
    validateOwnershipInput(group, 'Custom group');
    if (user && group) {
        return "".concat(user, ":").concat(group);
    }
    if (group) {
        return ":".concat(group);
    }
    return user;
};
var getFilePathToUpdate = function (args, fileToUpdate) {
    if (fileToUpdate === 'workingFile') {
        return args.inputFileObj._id;
    }
    if (fileToUpdate === 'originalFile') {
        return args.originalLibraryFile._id;
    }
    throw new Error("Invalid file to update: ".concat(fileToUpdate));
};
var parsePermissionSource = function (permissionSource) {
    if (permissionSource === 'originalFile'
        || permissionSource === 'custom'
        || permissionSource === 'workingFile') {
        return permissionSource;
    }
    throw new Error("Invalid permissions source: ".concat(permissionSource));
};
var parseOwnerGroupSource = function (ownerGroupSource) {
    if (ownerGroupSource === 'originalFile'
        || ownerGroupSource === 'custom'
        || ownerGroupSource === 'workingFile') {
        return ownerGroupSource;
    }
    throw new Error("Invalid owner/group source: ".concat(ownerGroupSource));
};
var applyCustomFilePermissions = function (args, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var customMode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                customMode = parseCustomMode(String(args.inputs.customPermissions));
                args.jobLog("Setting custom permissions: ".concat(formatMode(customMode)));
                return [4 /*yield*/, fs_1.promises.chmod(filePath, customMode)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var applyOriginalFilePermissions = function (args, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var originalMode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                originalMode = getOriginalMode(args);
                args.jobLog("Setting permissions to match original file: ".concat(formatMode(originalMode)));
                return [4 /*yield*/, fs_1.promises.chmod(filePath, originalMode)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var applyCustomOwnerGroup = function (args, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerSpec;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ownerSpec = getCustomOwnerSpec(String(args.inputs.customUser), String(args.inputs.customGroup));
                if (!ownerSpec) return [3 /*break*/, 2];
                args.jobLog("Setting custom owner/group: ".concat(ownerSpec));
                return [4 /*yield*/, execFileAsync('chown', [ownerSpec, filePath])];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                args.jobLog('Skipping custom owner/group because user and group are blank');
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var applyOriginalOwnerGroup = function (args, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, uid, gid;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = getOriginalOwnership(args), uid = _a.uid, gid = _a.gid;
                args.jobLog("Setting owner/group to match original file: ".concat(uid, ":").concat(gid));
                return [4 /*yield*/, fs_1.promises.chown(filePath, uid, gid)];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, fileToUpdate, filePath, permissionSource, ownerGroupSource;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                fileToUpdate = String(args.inputs.fileToUpdate);
                filePath = getFilePathToUpdate(args, fileToUpdate);
                permissionSource = parsePermissionSource(String(args.inputs.permissionSource));
                ownerGroupSource = parseOwnerGroupSource(String(args.inputs.ownerGroupSource));
                args.jobLog("Updating ".concat(fileToUpdate, ": ").concat(filePath));
                if (!(permissionSource === 'custom')) return [3 /*break*/, 2];
                return [4 /*yield*/, applyCustomFilePermissions(args, filePath)];
            case 1:
                _a.sent();
                return [3 /*break*/, 5];
            case 2:
                if (!(permissionSource === 'originalFile')) return [3 /*break*/, 4];
                return [4 /*yield*/, applyOriginalFilePermissions(args, filePath)];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                if (permissionSource === 'workingFile') {
                    args.jobLog('Leaving working file permissions unchanged');
                }
                _a.label = 5;
            case 5:
                if (!(ownerGroupSource === 'custom')) return [3 /*break*/, 7];
                return [4 /*yield*/, applyCustomOwnerGroup(args, filePath)];
            case 6:
                _a.sent();
                return [3 /*break*/, 10];
            case 7:
                if (!(ownerGroupSource === 'originalFile')) return [3 /*break*/, 9];
                return [4 /*yield*/, applyOriginalOwnerGroup(args, filePath)];
            case 8:
                _a.sent();
                return [3 /*break*/, 10];
            case 9:
                if (ownerGroupSource === 'workingFile') {
                    args.jobLog('Leaving working file owner/group unchanged');
                }
                _a.label = 10;
            case 10: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
