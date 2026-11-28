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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Rename File',
    description: 'Rename a file',
    style: {
        borderColor: 'green',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'File Name Match',
            name: 'fileMatch',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '.+',
            inputUI: {
                type: 'text',
            },
            // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Specify regex match pattern for replacing e.g. ".+" or "test_(${inputFileName}).mkv"\n\n'
                + 'Available variables are inputFileName, inputFileContainer, originalFileName, originalFileContainer, '
                + 'and args (see https://docs.tdarr.io/docs/plugins/flow-plugins/basics).',
        },
        {
            label: 'File Name Replace',
            name: 'fileReplace',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '${inputFileName}_${args.inputFileObj.video_resolution}.${inputFileContainer}',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify regex replace pattern e.g.'
                // eslint-disable-next-line no-template-curly-in-string
                + '$1_${args.inputFileObj.video_resolution}.${inputFileContainer}\n\n'
                + 'Available variables are inputFileName, inputFileContainer, originalFileName, originalFileContainer, '
                + 'and args (see https://docs.tdarr.io/docs/plugins/flow-plugins/basics).',
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
var replaceVariables = function (input, args, escape) {
    var _a;
    var _ = args.deps.lodash;
    var values = {
        args: args,
        inputFileName: (0, fileUtils_1.getFileName)(args.inputFileObj._id),
        inputFileContainer: (0, fileUtils_1.getContainer)(args.inputFileObj._id),
        originalFileName: (0, fileUtils_1.getFileName)(args.originalLibraryFile._id),
        originalFileContainer: (0, fileUtils_1.getContainer)(args.originalLibraryFile._id),
    };
    return ((_a = input.match(/\${[^}]+}/g)) === null || _a === void 0 ? void 0 : _a.reduce(function (output, match) {
        var objPath = match.slice(2, -1).trim();
        var value = String(_.get(values, objPath));
        return output.replace(match, escape ? _.escapeRegExp(value) : value);
    }, input)) || input;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, match, replace, newName, fileDir, newPath;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                match = replaceVariables(String(args.inputs.fileMatch).trim(), args, true);
                replace = replaceVariables(String(args.inputs.fileReplace).trim(), args, false);
                args.jobLog("File: '".concat((_c = (_b = (_a = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.split('/')) === null || _c === void 0 ? void 0 : _c.pop(), "'"));
                args.jobLog("Match: '".concat(match, "'"));
                args.jobLog("Replace: '".concat(replace, "'"));
                newName = ((_g = (_f = (_e = (_d = args === null || args === void 0 ? void 0 : args.inputFileObj) === null || _d === void 0 ? void 0 : _d._id) === null || _e === void 0 ? void 0 : _e.split('/')) === null || _f === void 0 ? void 0 : _f.pop()) === null || _g === void 0 ? void 0 : _g.replace(new RegExp(match, 'ig'), replace)) || '';
                fileDir = (0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id);
                newPath = "".concat(fileDir, "/").concat(newName);
                if (args.inputFileObj._id === newPath) {
                    args.jobLog('Input and output path are the same, skipping rename.');
                    return [2 /*return*/, {
                            outputFileObj: {
                                _id: args.inputFileObj._id,
                            },
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: args.inputFileObj._id,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 1:
                _h.sent();
                return [2 /*return*/, {
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
