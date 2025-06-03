"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Stream Property',
    description: 'Check if file has specified stream property',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faFilter',
    inputs: [
        {
            label: 'Property To Check',
            name: 'propertyToCheck',
            type: 'string',
            defaultValue: 'codec_name',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Enter one stream property to check.\n        \n        \\nExample:\\n\n        codec_name\n\n        \\nExample:\\n\n        tags.language\n        ",
        },
        {
            label: 'Values To Match',
            name: 'valuesToMatch',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Enter values of the property above to match. For example, if checking codec_name, could enter ac3,aac:\n        \n        \\nExample:\\n\n        ac3,aac\n        ",
        },
        {
            label: 'Condition',
            name: 'condition',
            type: 'string',
            defaultValue: 'includes',
            inputUI: {
                type: 'dropdown',
                options: [
                    'includes',
                    'not_includes',
                    'equals',
                    'not_equals',
                ],
            },
            tooltip: "\n      Specify the matching condition:\n      - includes: property value includes any of the specified values\n      - not_includes: property value does not include any of the specified values  \n      - equals: property value exactly equals one of the specified values\n      - not_equals: property value does not equal any of the specified values\n      ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File has matching stream property',
        },
        {
            number: 2,
            tooltip: 'File does not have matching stream property',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var propertyToCheck = String(args.inputs.propertyToCheck).trim();
    var valuesToMatch = String(args.inputs.valuesToMatch).trim().split(',').map(function (item) { return item.trim(); })
        .filter(function (row) { return row.length > 0; });
    var condition = String(args.inputs.condition);
    // Validation
    if (!propertyToCheck) {
        args.jobLog('Error: Property to check cannot be empty\n');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 2,
            variables: args.variables,
        };
    }
    if (valuesToMatch.length === 0) {
        args.jobLog('Error: Values to match cannot be empty\n');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 2,
            variables: args.variables,
        };
    }
    var hasMatchingProperty = false;
    // Helper function to get nested property value
    var getNestedProperty = function (obj, path) {
        var parts = path.split('.');
        var current = obj;
        for (var i = 0; i < parts.length; i += 1) {
            var part = parts[i];
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    };
    // Check all streams in the file
    if (args.inputFileObj.ffProbeData && args.inputFileObj.ffProbeData.streams) {
        var streams = args.inputFileObj.ffProbeData.streams;
        for (var streamIdx = 0; streamIdx < streams.length && !hasMatchingProperty; streamIdx += 1) {
            var stream = streams[streamIdx];
            // Get property value using improved nested property handling
            var target = getNestedProperty(stream, propertyToCheck);
            if (target !== undefined && target !== null) {
                var prop = String(target).toLowerCase();
                switch (condition) {
                    case 'includes':
                        for (var i = 0; i < valuesToMatch.length; i += 1) {
                            var val = valuesToMatch[i].toLowerCase();
                            if (prop.includes(val)) {
                                hasMatchingProperty = true;
                                args.jobLog("Stream ".concat(stream.index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" includes \"").concat(val, "\"\n"));
                                break;
                            }
                        }
                        break;
                    case 'not_includes':
                        var includesAny = false;
                        for (var i = 0; i < valuesToMatch.length; i += 1) {
                            var val = valuesToMatch[i].toLowerCase();
                            if (prop.includes(val)) {
                                includesAny = true;
                                break;
                            }
                        }
                        if (!includesAny) {
                            hasMatchingProperty = true;
                            args.jobLog("Stream ".concat(stream.index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" does not include any of the specified values\n"));
                        }
                        break;
                    case 'equals':
                        for (var i = 0; i < valuesToMatch.length; i += 1) {
                            var val = valuesToMatch[i].toLowerCase();
                            if (prop === val) {
                                hasMatchingProperty = true;
                                args.jobLog("Stream ".concat(stream.index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" equals \"").concat(val, "\"\n"));
                                break;
                            }
                        }
                        break;
                    case 'not_equals':
                        var equalsAny = false;
                        for (var i = 0; i < valuesToMatch.length; i += 1) {
                            var val = valuesToMatch[i].toLowerCase();
                            if (prop === val) {
                                equalsAny = true;
                                break;
                            }
                        }
                        if (!equalsAny) {
                            hasMatchingProperty = true;
                            args.jobLog("Stream ".concat(stream.index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" does not equal any of the specified values\n"));
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
    var outputNumber = hasMatchingProperty ? 1 : 2;
    args.jobLog("File routed to output ".concat(outputNumber, " - ").concat(hasMatchingProperty ? 'has' : 'does not have', " ")
        + 'matching stream property\n');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
