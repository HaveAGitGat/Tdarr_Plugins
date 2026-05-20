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
    name: 'Check Skiplist',
    description: "\n    Check if file has already been added to skiplist by 'Add To Skiplist' flow plugin.\n    You can view and clear the skiplist by going to Library -> Skiplist.\n  ",
    style: {
        borderColor: 'orange',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.37.01',
    sidebarPosition: 2,
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
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File is not on library skiplist',
        },
        {
            number: 2,
            tooltip: 'File is on library skiplist',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, checkType, propertyToCheck, outputHist, outputNumber;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                checkType = String(args.inputs.checkType);
                propertyToCheck = '';
                if (!(checkType === 'fileName')) return [3 /*break*/, 1];
                propertyToCheck = "".concat(args.inputFileObj.fileNameWithoutExtension, ".").concat(args.inputFileObj.container);
                return [3 /*break*/, 4];
            case 1:
                if (!(checkType === 'filePath')) return [3 /*break*/, 2];
                propertyToCheck = args.inputFileObj._id;
                return [3 /*break*/, 4];
            case 2:
                if (!(checkType === 'fileHash')) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, fileUtils_1.hashFile)(args.inputFileObj._id, 'sha256')];
            case 3:
                propertyToCheck = _a.sent();
                _a.label = 4;
            case 4:
                args.jobLog("Checking if file is on skiplist: ".concat(propertyToCheck));
                return [4 /*yield*/, args.deps.crudTransDBN('F2FOutputJSONDB', 'getById', propertyToCheck, {})];
            case 5:
                outputHist = _a.sent();
                outputNumber = 1;
                if (outputHist !== undefined && outputHist.DB === args.inputFileObj.DB) {
                    args.jobLog('File is on library skiplist');
                    outputNumber = 2;
                }
                else {
                    args.jobLog('File is not on library skiplist');
                }
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: outputNumber,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
