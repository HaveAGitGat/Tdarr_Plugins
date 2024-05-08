"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var fs_1 = __importDefault(require("fs"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Exists',
    description: 'Check file Exists',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'File To Check',
            name: 'fileToCheck',
            type: 'string',
            // eslint-disable-next-line no-template-curly-in-string
            defaultValue: '${fileName}_720p.${container}',
            inputUI: {
                type: 'text',
            },
            // eslint-disable-next-line no-template-curly-in-string
            tooltip: 'Specify file to check using templating e.g. ${fileName}_720p.${container}',
        },
        {
            label: 'Directory',
            name: 'directory',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'directory',
            },
            tooltip: 'Specify directory to check. Leave blank to use working directory.'
                + ' Put below Input File plugin to check original file directory.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File exists',
        },
        {
            number: 2,
            tooltip: 'File does not exist',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var directory = String(args.inputs.directory).trim() || (0, fileUtils_1.getFileAbosluteDir)(args.inputFileObj._id);
    var fileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
    var fileToCheck = String(args.inputs.fileToCheck).trim();
    fileToCheck = fileToCheck.replace(/\${fileName}/g, fileName);
    fileToCheck = fileToCheck.replace(/\${container}/g, (0, fileUtils_1.getContainer)(args.inputFileObj._id));
    fileToCheck = "".concat(directory, "/").concat(fileToCheck);
    var fileExists = false;
    if (fs_1.default.existsSync(fileToCheck)) {
        fileExists = true;
        args.jobLog("File exists: ".concat(fileToCheck));
    }
    else {
        args.jobLog("File does not exist: ".concat(fileToCheck));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: fileExists ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
