"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFfmpegCommandV2Init = exports.checkFfmpegCommandInit = void 0;
// eslint-disable-next-line import/prefer-default-export
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
    var _a, _b;
    if (!((_b = (_a = args === null || args === void 0 ? void 0 : args.variables) === null || _a === void 0 ? void 0 : _a.ffmpegCommandV2) === null || _b === void 0 ? void 0 : _b.init) || args.variables.ffmpegCommandV2.version !== 2) {
        throw new Error('FFmpeg command v2 plugins not used correctly.'
            + ' Please use the v2 "Begin Command" plugin before using this plugin.'
            + ' Afterwards, use the v2 "Execute" plugin to execute the built FFmpeg command.'
            + ' Once the v2 "Execute" plugin has been used, you need to use a new v2 "Begin Command"'
            + ' plugin to start a new FFmpeg command.');
    }
};
exports.checkFfmpegCommandV2Init = checkFfmpegCommandV2Init;
