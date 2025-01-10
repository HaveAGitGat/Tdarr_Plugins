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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var normJoinPath_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/normJoinPath"));
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Copy/Move Folder Content',
    description: "Copy or move folder content to another folder. \nDoes not apply to the current file being processed (either the original or working file).\nUseful if, for example, you want to move things like subtitle files or cover art to a new folder.",
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
            label: 'Source Directory',
            name: 'sourceDirectory',
            type: 'string',
            defaultValue: 'originalDirectory',
            inputUI: {
                type: 'dropdown',
                options: [
                    'originalDirectory',
                    'workingDirectory',
                ],
            },
            tooltip: 'Specify the source location of where files will be copied/moved from',
        },
        {
            label: 'Copy or Move',
            name: 'copyOrMove',
            type: 'string',
            defaultValue: 'copy',
            inputUI: {
                type: 'dropdown',
                options: [
                    'copy',
                    'move',
                ],
            },
            tooltip: 'Specify whether to copy or move the files',
        },
        {
            label: 'Output Directory',
            name: 'outputDirectory',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'directory',
            },
            tooltip: 'Specify ouput directory',
        },
        {
            label: 'Keep Relative Path',
            name: 'keepRelativePath',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to keep the relative path',
        },
        {
            label: 'All Files?',
            name: 'allFiles',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: "Specify whether to copy/move all files in the directory (excluding the original and working file)\n       or use the input below to specify file extensions",
        },
        {
            label: 'File Extensions',
            name: 'fileExtensions',
            type: 'string',
            defaultValue: 'srt,ass',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'allFiles',
                                    value: 'false',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: 'Specify a comma separated list of file extensions to copy/move',
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
var doOperation = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var args = _b.args, sourcePath = _b.sourcePath, destinationPath = _b.destinationPath, operation = _b.operation;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                args.jobLog("Input path: ".concat(sourcePath));
                args.jobLog("Output path: ".concat(destinationPath));
                if (!(sourcePath === destinationPath)) return [3 /*break*/, 1];
                args.jobLog("Input and output path are the same, skipping ".concat(operation));
                return [3 /*break*/, 3];
            case 1:
                args.deps.fsextra.ensureDirSync((0, fileUtils_1.getFileAbosluteDir)(destinationPath));
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: operation,
                        sourcePath: sourcePath,
                        destinationPath: destinationPath,
                        args: args,
                    })];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, keepRelativePath, allFiles, sourceDirectory, outputDirectory, copyOrMove, fileExtensions, outputPath, subStem, sourceDir, filesInDir, i;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, keepRelativePath = _a.keepRelativePath, allFiles = _a.allFiles;
                sourceDirectory = String(args.inputs.sourceDirectory);
                outputDirectory = String(args.inputs.outputDirectory);
                copyOrMove = String(args.inputs.copyOrMove);
                fileExtensions = String(args.inputs.fileExtensions).split(',').map(function (row) { return row.trim(); });
                outputPath = '';
                if (keepRelativePath) {
                    subStem = (0, fileUtils_1.getSubStem)({
                        inputPathStem: args.librarySettings.folder,
                        inputPath: args.originalLibraryFile._id,
                    });
                    outputPath = (0, normJoinPath_1.default)({
                        upath: args.deps.upath,
                        paths: [
                            outputDirectory,
                            subStem,
                        ],
                    });
                }
                else {
                    outputPath = outputDirectory;
                }
                sourceDir = (0, fileUtils_1.getFileAbosluteDir)(args.originalLibraryFile._id);
                if (sourceDirectory === 'workingDirectory') {
                    sourceDir = (0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id);
                }
                return [4 /*yield*/, fs_1.promises.readdir(sourceDir)];
            case 1:
                filesInDir = (_b.sent())
                    .map(function (row) { return ({
                    source: "".concat(sourceDir, "/").concat(row),
                    destination: (0, normJoinPath_1.default)({
                        upath: args.deps.upath,
                        paths: [
                            outputPath,
                            row,
                        ],
                    }),
                }); })
                    .filter(function (row) { return row.source !== args.originalLibraryFile._id && row.source !== args.inputFileObj._id; });
                if (!allFiles) {
                    filesInDir = filesInDir.filter(function (row) { return fileExtensions.includes((0, fileUtils_1.getContainer)(row.source)); });
                }
                i = 0;
                _b.label = 2;
            case 2:
                if (!(i < filesInDir.length)) return [3 /*break*/, 5];
                // eslint-disable-next-line no-await-in-loop
                return [4 /*yield*/, doOperation({
                        args: args,
                        sourcePath: filesInDir[i].source,
                        destinationPath: filesInDir[i].destination,
                        operation: copyOrMove,
                    })];
            case 3:
                // eslint-disable-next-line no-await-in-loop
                _b.sent();
                _b.label = 4;
            case 4:
                i += 1;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
