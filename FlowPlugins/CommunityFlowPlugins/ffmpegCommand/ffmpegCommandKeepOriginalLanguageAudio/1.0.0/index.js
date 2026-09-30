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
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Keep Original Language Audio',
    description: "Remove dubbed audio tracks. Keeps the languages you list plus the title's original\n  language, which is looked up in Radarr or Sonarr, so foreign language titles keep their own audio.\n  \\n\\n\n  A fixed keep list cannot do this safely: keeping only English mutes a Japanese film, and adding\n  Japanese to the list keeps the Japanese dub on every English film.\n  \\n\\n\n  Keep list codes match every variant of the same language, so eng also keeps en and en-US tracks.\n  \\n\\n\n  Fails open: if the lookup fails, the title is not found, the original language is unknown, or the\n  result would remove every audio track, all audio is kept. Needs Radarr v3+ or Sonarr v4+ (Sonarr v3\n  does not report an original language).",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Arr',
            name: 'arr',
            type: 'string',
            defaultValue: 'radarr',
            inputUI: {
                type: 'dropdown',
                options: ['radarr', 'sonarr'],
            },
            tooltip: 'Specify which arr to look the original language up in',
        },
        {
            label: 'Arr API Key',
            name: 'arr_api_key',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your arr api key here',
        },
        {
            label: 'Arr Host',
            name: 'arr_host',
            type: 'string',
            defaultValue: 'http://192.168.1.1:7878',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Input your arr host here.'
                + '\\nExample:\\n'
                + 'http://192.168.1.1:7878\\n'
                + 'http://192.168.1.1:8989\\n'
                + 'https://radarr.domain.com\\n'
                + 'https://sonarr.domain.com\\n',
        },
        {
            label: 'Always Keep Languages',
            name: 'keepLanguages',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Comma separated language codes to keep in addition to the original language.'
                + ' Each code also matches the other codes for the same language (eng = en = en-US).'
                + '\\nExample:\\n'
                + 'eng\\n'
                + 'eng,fre',
        },
        {
            label: 'Keep Untagged Audio',
            name: 'keepUntagged',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Keep audio tracks with no language tag, or tagged und.',
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
// Radarr/Sonarr language names -> language codes found in Matroska/MP4 tags
// (ISO 639-2/B, ISO 639-2/T and ISO 639-1).
var languageCodes = {
    afrikaans: ['afr', 'af'],
    albanian: ['alb', 'sqi', 'sq'],
    arabic: ['ara', 'ar'],
    azerbaijani: ['aze', 'az'],
    bengali: ['ben', 'bn'],
    bosnian: ['bos', 'bs'],
    bulgarian: ['bul', 'bg'],
    cantonese: ['chi', 'zho', 'zh', 'yue'],
    catalan: ['cat', 'ca'],
    chinese: ['chi', 'zho', 'zh', 'cmn', 'yue'],
    croatian: ['hrv', 'hr'],
    czech: ['cze', 'ces', 'cs'],
    danish: ['dan', 'da'],
    dutch: ['dut', 'nld', 'nl'],
    english: ['eng', 'en'],
    estonian: ['est', 'et'],
    finnish: ['fin', 'fi'],
    flemish: ['dut', 'nld', 'nl'],
    french: ['fre', 'fra', 'fr'],
    georgian: ['geo', 'kat', 'ka'],
    german: ['ger', 'deu', 'de'],
    greek: ['gre', 'ell', 'el'],
    hebrew: ['heb', 'he', 'iw'],
    hindi: ['hin', 'hi'],
    hungarian: ['hun', 'hu'],
    icelandic: ['ice', 'isl', 'is'],
    indonesian: ['ind', 'id'],
    italian: ['ita', 'it'],
    japanese: ['jpn', 'ja'],
    kannada: ['kan', 'kn'],
    kazakh: ['kaz', 'kk'],
    korean: ['kor', 'ko'],
    latvian: ['lav', 'lv'],
    lithuanian: ['lit', 'lt'],
    macedonian: ['mac', 'mkd', 'mk'],
    malay: ['may', 'msa', 'ms'],
    malayalam: ['mal', 'ml'],
    mandarin: ['chi', 'zho', 'zh', 'cmn'],
    marathi: ['mar', 'mr'],
    mongolian: ['mon', 'mn'],
    norwegian: ['nor', 'nob', 'nno', 'no', 'nb', 'nn'],
    persian: ['per', 'fas', 'fa'],
    polish: ['pol', 'pl'],
    portuguese: ['por', 'pt'],
    punjabi: ['pan', 'pa'],
    romanian: ['rum', 'ron', 'ro'],
    romansh: ['roh', 'rm'],
    russian: ['rus', 'ru'],
    serbian: ['srp', 'sr'],
    slovak: ['slo', 'slk', 'sk'],
    slovenian: ['slv', 'sl'],
    spanish: ['spa', 'es'],
    swedish: ['swe', 'sv'],
    tagalog: ['tgl', 'fil', 'tl'],
    tamil: ['tam', 'ta'],
    telugu: ['tel', 'te'],
    thai: ['tha', 'th'],
    turkish: ['tur', 'tr'],
    ukrainian: ['ukr', 'uk'],
    urdu: ['urd', 'ur'],
    uzbek: ['uzb', 'uz'],
    vietnamese: ['vie', 'vi'],
};
// 'Portuguese (Brazil)' -> 'portuguese', 'Spanish (Latino)' -> 'spanish'
var normaliseLanguageName = function (name) { return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z]/g, ''); };
// Tags that name no single spoken language: undetermined, no linguistic content, multiple, uncoded.
var untaggedCodes = ['', 'und', 'zxx', 'mul', 'mis'];
// 'en-US' -> 'en', 'pt_BR' -> 'pt'
var primaryLanguageTag = function (tag) { return tag.toLowerCase().trim().split(/[-_]/)[0]; };
// 'eng' -> ['eng', 'en'], so a keep list entry matches every tag variant of its language.
var expandLanguageCode = function (code) {
    var variants = Object.values(languageCodes)
        .filter(function (codes) { return codes.includes(code); })
        .flat();
    return variants.length > 0 ? variants : [code];
};
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, result, audioStreams, arr, arrHostInput, arrHost, fileName, originalLanguage, response, media, err_1, status_1, originalCodes, keep, keepUntagged, isKept, toRemove, i, stream;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                (0, flowUtils_1.checkFfmpegCommandInit)(args);
                result = {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 1,
                    variables: args.variables,
                };
                audioStreams = args.variables.ffmpegCommand.streams
                    .filter(function (stream) { return stream.codec_type === 'audio' && !stream.removed; });
                if (audioStreams.length <= 1) {
                    args.jobLog('Fewer than two audio streams, nothing to remove');
                    return [2 /*return*/, result];
                }
                arr = String(args.inputs.arr);
                arrHostInput = String(args.inputs.arr_host).trim();
                arrHost = arrHostInput.endsWith('/') ? arrHostInput.slice(0, -1) : arrHostInput;
                fileName = (0, fileUtils_1.getFileName)(((_a = args.originalLibraryFile) === null || _a === void 0 ? void 0 : _a._id) || args.inputFileObj._id);
                originalLanguage = '';
                _g.label = 1;
            case 1:
                _g.trys.push([1, 3, , 4]);
                return [4 /*yield*/, args.deps.axios({
                        method: 'get',
                        url: "".concat(arrHost, "/api/v3/parse?title=").concat(encodeURIComponent(fileName)),
                        headers: {
                            'X-Api-Key': String(args.inputs.arr_api_key),
                            Accept: 'application/json',
                        },
                    })];
            case 2:
                response = _g.sent();
                media = arr === 'radarr' ? (_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.movie : (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.series;
                if (!media) {
                    args.jobLog("'".concat(fileName, "' was not found in ").concat(arr, ", keeping all audio"));
                    return [2 /*return*/, result];
                }
                originalLanguage = String(((_d = media.originalLanguage) === null || _d === void 0 ? void 0 : _d.name) || '');
                return [3 /*break*/, 4];
            case 3:
                err_1 = _g.sent();
                status_1 = (_e = err_1 === null || err_1 === void 0 ? void 0 : err_1.response) === null || _e === void 0 ? void 0 : _e.status;
                args.jobLog("".concat(arr, " lookup failed (").concat(status_1 ? "HTTP ".concat(status_1) : err_1.message, "),")
                    + ' keeping all audio');
                return [2 /*return*/, result];
            case 4:
                if (!originalLanguage) {
                    args.jobLog("".concat(arr, " did not return an original language for '").concat(fileName, "', keeping all audio"));
                    return [2 /*return*/, result];
                }
                originalCodes = languageCodes[normaliseLanguageName(originalLanguage)];
                if (!originalCodes) {
                    args.jobLog("No language codes known for original language '".concat(originalLanguage, "', keeping all audio"));
                    return [2 /*return*/, result];
                }
                keep = new Set(originalCodes);
                String(args.inputs.keepLanguages)
                    .split(',')
                    .map(primaryLanguageTag)
                    .filter(function (code) { return code !== ''; })
                    .forEach(function (code) { return expandLanguageCode(code).forEach(function (variant) { return keep.add(variant); }); });
                keepUntagged = args.inputs.keepUntagged === true || String(args.inputs.keepUntagged) === 'true';
                args.jobLog("Original language is ".concat(originalLanguage, ", keeping: ").concat(Array.from(keep).join(','))
                    + "".concat(keepUntagged ? ' and untagged audio' : ''));
                isKept = function (language) {
                    if (untaggedCodes.includes(language)) {
                        return keepUntagged;
                    }
                    return keep.has(language);
                };
                toRemove = audioStreams.filter(function (stream) { var _a; return !isKept(primaryLanguageTag(String(((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) || ''))); });
                if (toRemove.length === 0) {
                    args.jobLog('All audio streams are wanted, nothing removed');
                    return [2 /*return*/, result];
                }
                if (toRemove.length === audioStreams.length) {
                    args.jobLog('Removing these would leave no audio, keeping all audio instead');
                    return [2 /*return*/, result];
                }
                for (i = 0; i < toRemove.length; i++) {
                    stream = toRemove[i];
                    args.jobLog("Removing audio stream ".concat(stream.index, " (").concat(((_f = stream.tags) === null || _f === void 0 ? void 0 : _f.language) || 'untagged', ",")
                        + " ".concat(stream.codec_name, ")"));
                    stream.removed = true;
                }
                // eslint-disable-next-line no-param-reassign
                args.variables.ffmpegCommand.shouldProcess = true;
                args.jobLog("Kept ".concat(audioStreams.length - toRemove.length, " of ").concat(audioStreams.length, " audio streams"));
                return [2 /*return*/, result];
        }
    });
}); };
exports.plugin = plugin;
