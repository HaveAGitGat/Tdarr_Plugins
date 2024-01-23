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
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var details = function () { return ({
    name: 'Notify Plex Media Reanlayzer',
    description: 'Notify Plex Media Reanalyzer to trigger Plex reanalysis after file change. https://github.com/brandon099/plex-media-reanalyzer',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faBell',
    inputs: [
        {
            label: 'Plex Media Reanalyzer URL',
            name: 'plexMediaReanalyzerUrl',
            type: 'string',
            defaultValue: 'http://plex-media-reanalyzer:8080',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify Plex Media Reanalyzer URL, including port if not 80 or 443.',
        },
        {
            label: 'Plex Media Reanalyzer Auth key',
            name: 'plexMediaReanalyzerAuthKey',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify Plex Media Reanalyzer Auth key if it has been configured. Leave blank if not configured.',
        },
        {
            label: 'Plex API Key',
            name: 'plexApiKey',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify Plex API Key. This is required.',
        },
        {
            label: 'Plex Library Name',
            name: 'plexMediaReanalyzerLibraryName',
            type: 'string',
            defaultValue: 'Movies',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify Plex Library Name. This is not required, but if not provided it will default to whatever is configured in Plex Media Reanalyzer server configuration.',
        }
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        }
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, _a, plexApiKey, plexMediaReanalyzerAuthKey, plexMediaReanalyzerLibraryName, plexMediaReanalyzerUrl, fileName, plexMediaReanalyzerUrl_clean, headers, analyzeMediaRequest;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, plexApiKey = _a.plexApiKey, plexMediaReanalyzerAuthKey = _a.plexMediaReanalyzerAuthKey, plexMediaReanalyzerLibraryName = _a.plexMediaReanalyzerLibraryName;
                plexMediaReanalyzerUrl = String(args.inputs.plexMediaReanalyzerUrl).trim();
                fileName = ((_c = (_b = args.originalLibraryFile) === null || _b === void 0 ? void 0 : _b.meta) === null || _c === void 0 ? void 0 : _c.FileName) || '';
                plexMediaReanalyzerUrl_clean = plexMediaReanalyzerUrl.endsWith('/') ? plexMediaReanalyzerUrl.slice(0, -1) : plexMediaReanalyzerUrl;
                ;
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': plexMediaReanalyzerAuthKey,
                    'X-Plex-Token': plexApiKey,
                    Accept: 'application/json',
                };
                args.jobLog('Sending analyze request to Plex Media Reanalyzer...');
                analyzeMediaRequest = {
                    method: 'post',
                    url: "".concat(plexMediaReanalyzerUrl_clean, "/anaylze_media"),
                    headers: headers,
                    data: JSON.stringify({
                        filename: fileName,
                        library_section: plexMediaReanalyzerLibraryName,
                    }),
                };
                return [4 /*yield*/, args.deps.axios(analyzeMediaRequest)];
            case 1:
                _d.sent();
                args.jobLog("\u2714 Requested Plex Media Reanalyzer to reanalyze ".concat(fileName, "."));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
