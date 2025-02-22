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
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Send Web Request',
    description: 'Send Web Request',
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
            label: 'Method',
            name: 'method',
            type: 'string',
            defaultValue: 'post',
            inputUI: {
                type: 'dropdown',
                options: [
                    'get',
                    'post',
                    'put',
                    'delete',
                ],
            },
            tooltip: 'Specify request method',
        },
        {
            label: 'Request URL',
            name: 'requestUrl',
            type: 'string',
            defaultValue: 'http://example.com',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify request URL',
        },
        {
            label: 'Request Headers',
            name: 'requestHeaders',
            type: 'string',
            defaultValue: "{\n           \"Content-Type\": \"application/json\"\n}",
            inputUI: {
                type: 'textarea',
                style: {
                    height: '100px',
                },
            },
            tooltip: 'Specify request URL',
        },
        {
            label: 'Request Body',
            name: 'requestBody',
            type: 'string',
            defaultValue: "{\n            \"test\": \"test\"\n}",
            inputUI: {
                type: 'textarea',
                style: {
                    height: '100px',
                },
            },
            tooltip: 'Specify request body',
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
    var lib, method, requestUrl, requestHeaders, requestBody, requestConfig, res, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                method = String(args.inputs.method);
                requestUrl = String(args.inputs.requestUrl);
                requestHeaders = JSON.parse(String(args.inputs.requestHeaders));
                requestBody = JSON.parse(String(args.inputs.requestBody));
                requestConfig = {
                    method: method,
                    url: requestUrl,
                    headers: requestHeaders,
                    data: requestBody,
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios(requestConfig)];
            case 2:
                res = _a.sent();
                args.jobLog("Web request succeeded: Status Code: ".concat(res.status));
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                args.jobLog('Web Request Failed');
                args.jobLog(JSON.stringify(err_1));
                throw new Error('Web Request Failed');
            case 4: return [2 /*return*/, {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
