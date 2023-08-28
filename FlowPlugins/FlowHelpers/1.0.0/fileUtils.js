"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubStem = exports.getFfType = exports.getFileName = exports.getContainer = void 0;
var getContainer = function (filePath) {
    var parts = filePath.split('.');
    return parts[parts.length - 1];
};
exports.getContainer = getContainer;
var getFileName = function (filePath) {
    var parts = filePath.split('/');
    var fileNameAndContainer = parts[parts.length - 1];
    var parts2 = fileNameAndContainer.split('.');
    parts2.pop();
    return parts2.join('.');
};
exports.getFileName = getFileName;
var getFfType = function (codecType) { return (codecType === 'video' ? 'v' : 'a'); };
exports.getFfType = getFfType;
var getSubStem = function (_a) {
    var inputPathStem = _a.inputPathStem, inputPath = _a.inputPath;
    var subStem = inputPath.substring(inputPathStem.length);
    var parts = subStem.split('/');
    parts.pop();
    return parts.join('/');
};
exports.getSubStem = getSubStem;
