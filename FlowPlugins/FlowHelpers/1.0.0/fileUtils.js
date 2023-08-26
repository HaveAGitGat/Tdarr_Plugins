"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFfType = exports.getFileName = exports.getContainer = void 0;
var getContainer = function (filePath) {
    var parts = filePath.split('.');
    return parts[parts.length - 1];
};
exports.getContainer = getContainer;
var getFileName = function (filePath) {
    var parts = filePath.split('/');
    var fileNameAndContainer = parts[parts.length - 1];
    var parts2 = fileNameAndContainer.split('.');
    return parts2[0];
};
exports.getFileName = getFileName;
var getFfType = function (codecType) { return (codecType === 'video' ? 'v' : 'a'); };
exports.getFfType = getFfType;
