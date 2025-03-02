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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Copy to Directory',
    description: 'Copy the working file to a directory',
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
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Specify whether to keep the relative path',
        },
        {
            label: 'Make Working File',
            name: 'makeWorkingFile',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Make the copied file the working file',
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
    var lib, _a, keepRelativePath, makeWorkingFile, outputDirectory, originalFileName, newContainer, outputPath, subStem, ouputFilePath, workingFile;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, keepRelativePath = _a.keepRelativePath, makeWorkingFile = _a.makeWorkingFile;
                outputDirectory = String(args.inputs.outputDirectory);
                originalFileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
                newContainer = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
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
                ouputFilePath = (0, normJoinPath_1.default)({
                    upath: args.deps.upath,
                    paths: [
                        outputPath,
                        "".concat(originalFileName, ".").concat(newContainer),
                    ],
                });
                workingFile = args.inputFileObj._id;
                if (makeWorkingFile) {
                    workingFile = ouputFilePath;
                }
                args.jobLog("Input path: ".concat(args.inputFileObj._id));
                args.jobLog("Output path: ".concat(outputPath));
                if (args.inputFileObj._id === ouputFilePath) {
                    args.jobLog('Input and output path are the same, skipping copy.');
                    return [2 /*return*/, {
                            outputFileObj: {
                                _id: args.inputFileObj._id,
                            },
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                args.deps.fsextra.ensureDirSync(outputPath);
                return [4 /*yield*/, fs_1.promises.copyFile(args.inputFileObj._id, ouputFilePath)];
            case 1:
                _b.sent();
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: workingFile,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
