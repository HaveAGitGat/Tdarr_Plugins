"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Keep Original File Timestamps',
    description: "Preserves original file modification and access times through transcoding.\n   Run AFTER Replace Original File plugin.",
    style: {
        borderColor: '#6efefd',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faCalendar',
    inputs: [
        {
            label: 'Enable Logging',
            name: 'enableLogging',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Enable detailed logging for debugging',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Timestamps applied successfully',
        },
        {
            number: 2,
            tooltip: 'Error occurred',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var fs = require('fs');
    var enableLogging = args.inputs.enableLogging === true || args.inputs.enableLogging === 'true';
    var log = function (msg) {
        if (enableLogging) {
            args.jobLog(msg);
        }
    };
    try {
        log('===== Keep Original Timestamps Plugin =====');
        log("Current working file: ".concat(args.inputFileObj._id));
        var originalAtimeMs = void 0;
        var originalMtimeMs = void 0;
        if (args.variables && args.variables.user
            && args.variables.user.originalAtimeMs && args.variables.user.originalMtimeMs) {
            log('Found saved timestamps in flow variables');
            originalAtimeMs = Number(args.variables.user.originalAtimeMs);
            originalMtimeMs = Number(args.variables.user.originalMtimeMs);
        }
        else {
            log('Timestamps not in variables, capturing from original file...');
            var originalFilePath = args.originalLibraryFile._id;
            var stats = fs.statSync(originalFilePath);
            originalAtimeMs = stats.atimeMs;
            originalMtimeMs = stats.mtimeMs;
            log("Captured from originalLibraryFile: "
                + "atime=".concat(new Date(originalAtimeMs).toISOString(), ", ")
                + "mtime=".concat(new Date(originalMtimeMs).toISOString()));
            // Save for future use in this flow
            if (!args.variables.user) {
                args.variables.user = {};
            }
            args.variables.user.originalAtimeMs = String(originalAtimeMs);
            args.variables.user.originalMtimeMs = String(originalMtimeMs);
            log('Saved timestamps to flow variables for later use');
        }
        if (!originalAtimeMs || !originalMtimeMs) {
            throw new Error('Could not find original timestamps');
        }
        var atime = new Date(originalAtimeMs);
        var mtime = new Date(originalMtimeMs);
        var targetFile = args.inputFileObj._id;
        log("Applying timestamps to: ".concat(targetFile));
        log("  atime: ".concat(atime.toISOString()));
        log("  mtime: ".concat(mtime.toISOString()));
        fs.utimesSync(targetFile, atime, mtime);
        log('Timestamps applied correctly');
        log('============================');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    catch (err) {
        args.jobLog("ERROR in Keep Original Timestamps: ".concat(err.message));
        args.jobLog(err.stack || '');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 2,
            variables: args.variables,
        };
    }
};
exports.plugin = plugin;
