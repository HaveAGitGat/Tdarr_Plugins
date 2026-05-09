"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendFfmpegCommandV2Operation = exports.ffmpegCommandV2RequiresVersion = exports.ffmpegCommandV2PluginVersion = void 0;
var flowUtils_1 = require("./interfaces/flowUtils");
exports.ffmpegCommandV2PluginVersion = '2.0.0';
exports.ffmpegCommandV2RequiresVersion = '2.73.01';
var appendFfmpegCommandV2Operation = function (_a) {
    var _b, _c;
    var args = _a.args, pluginName = _a.pluginName, operationType = _a.operationType, inputs = _a.inputs;
    (0, flowUtils_1.checkFfmpegCommandV2Init)(args);
    (_b = args.variables.ffmpegCommandV2) === null || _b === void 0 ? void 0 : _b.operations.push({
        pluginName: pluginName,
        pluginVersion: exports.ffmpegCommandV2PluginVersion,
        pluginId: (_c = args.thisPlugin) === null || _c === void 0 ? void 0 : _c.id,
        operationType: operationType,
        inputs: inputs,
    });
};
exports.appendFfmpegCommandV2Operation = appendFfmpegCommandV2Operation;
