"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFfmpegCommandV2Init = exports.checkFfmpegCommandInit = void 0;
var checkFfmpegCommandInit = function (args) {
    var _a, _b;
    if (!((_b = (_a = args === null || args === void 0 ? void 0 : args.variables) === null || _a === void 0 ? void 0 : _a.ffmpegCommand) === null || _b === void 0 ? void 0 : _b.init)) {
        throw new Error('FFmpeg command plugins not used correctly.'
            + ' Please use the "Begin Command" plugin before using this plugin.'
            + ' Afterwards, use the "Execute" plugin to execute the built FFmpeg command.'
            + ' Once the "Execute" plugin has been used, you need to use a new "Begin Command"'
            + ' plugin to start a new FFmpeg command.');
    }
};
exports.checkFfmpegCommandInit = checkFfmpegCommandInit;
var checkFfmpegCommandV2Init = function (args) {
    var _a, _b, _c, _d;
    if (!((_b = (_a = args === null || args === void 0 ? void 0 : args.variables) === null || _a === void 0 ? void 0 : _a.ffmpegCommand) === null || _b === void 0 ? void 0 : _b.init) || ((_d = (_c = args === null || args === void 0 ? void 0 : args.variables) === null || _c === void 0 ? void 0 : _c.ffmpegCommand) === null || _d === void 0 ? void 0 : _d.version) !== '2.0.0') {
        throw new Error('FFmpeg command v2.0.0 plugins not used correctly.'
            + ' Please use the "Begin Command (v2.0.0)" plugin before using this plugin.'
            + ' Afterwards, use the "Execute (v2.0.0)" plugin to execute the built FFmpeg command.'
            + ' Once the "Execute (v2.0.0)" plugin has been used, you need to use a new "Begin Command (v2.0.0)"'
            + ' plugin to start a new FFmpeg command.');
    }
};
exports.checkFfmpegCommandV2Init = checkFfmpegCommandV2Init;
