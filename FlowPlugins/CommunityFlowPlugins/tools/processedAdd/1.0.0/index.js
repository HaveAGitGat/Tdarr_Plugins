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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Add To Skiplist',
    description: "\n  Add file to skiplist. Can be used with 'Check Skiplist' plugin to check if file has already been processed.\n  You can view and clear the skiplist by going to Library -> Skiplist.\n  ",
    style: {
        borderColor: 'orange',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.37.01',
    sidebarPosition: 3,
    icon: 'faFile',
    inputs: [
        {
            label: 'Check Type',
            name: 'checkType',
            type: 'string',
            defaultValue: 'filePath',
            inputUI: {
                type: 'dropdown',
                options: [
                    'filePath',
                    'fileName',
                    'fileHash',
                ],
            },
            tooltip: 'Specify the type of check to perform.',
        },
        {
            label: 'File To Add',
            name: 'fileToAdd',
            type: 'string',
            defaultValue: 'originalFile',
            inputUI: {
                type: 'dropdown',
                options: [
                    'originalFile',
                    'workingFile',
                ],
            },
            tooltip: 'Specify the file to check',
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
    var lib, checkType, fileToAdd, propertyToAdd, fileToAddObj, newData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                checkType = String(args.inputs.checkType);
                fileToAdd = String(args.inputs.fileToAdd);
                propertyToAdd = '';
                fileToAddObj = args.originalLibraryFile;
                if (fileToAdd === 'workingFile') {
                    fileToAddObj = args.inputFileObj;
                }
                if (!(checkType === 'fileName')) return [3 /*break*/, 1];
                propertyToAdd = "".concat(fileToAddObj.fileNameWithoutExtension, ".").concat(fileToAddObj.container);
                return [3 /*break*/, 4];
            case 1:
                if (!(checkType === 'filePath')) return [3 /*break*/, 2];
                propertyToAdd = fileToAddObj._id;
                return [3 /*break*/, 4];
            case 2:
                if (!(checkType === 'fileHash')) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, fileUtils_1.hashFile)(fileToAddObj._id, 'sha256')];
            case 3:
                propertyToAdd = _a.sent();
                _a.label = 4;
            case 4: return [4 /*yield*/, args.deps.crudTransDBN('F2FOutputJSONDB', 'removeOne', propertyToAdd, {})];
            case 5:
                _a.sent();
                newData = {
                    _id: propertyToAdd,
                    DB: fileToAddObj.DB,
                    file: fileToAddObj.file,
                    date: (new Date()).getTime(),
                };
                return [4 /*yield*/, args.deps.crudTransDBN('F2FOutputJSONDB', 'insert', propertyToAdd, newData)];
            case 6:
                _a.sent();
                args.jobLog("Added ".concat(propertyToAdd, " to skiplist"));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
