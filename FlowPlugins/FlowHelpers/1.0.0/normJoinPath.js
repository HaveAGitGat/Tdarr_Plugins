"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var formatWindowsRootFolder = function (path) {
    // Remove '.' from end of Windows root folder mapping e.g. 'E:.'
    if (path.length === 3
        && path.charAt(1) === ':'
        && path.charAt(2) === '.') {
        // eslint-disable-next-line no-param-reassign
        path = path.slice(0, -1);
    }
    return path;
};
var normJoinPath = function (_a) {
    var upath = _a.upath, paths = _a.paths;
    var path = upath.joinSafe.apply(upath, paths);
    path = formatWindowsRootFolder(path);
    return path;
};
exports.default = normJoinPath;
