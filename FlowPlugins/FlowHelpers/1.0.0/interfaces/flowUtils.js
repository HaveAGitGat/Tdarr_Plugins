"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFfmpegCommandInit = void 0;
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
