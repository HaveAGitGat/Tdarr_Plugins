"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Remove Stream By Property',
    description: 'Remove Stream By Property',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Property To Check',
            name: 'propertyToCheck',
            type: 'string',
            defaultValue: 'codec_name',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Enter one stream property to check. \n        To resolve 'Subtitle codec 94213 is not supported' error, leave as codec_name.\n        \n        \\nExample:\\n\n        codec_name\n\n        \\nExample:\\n\n        tags.language\n        ",
        },
        {
            label: 'Values To Remove',
            name: 'valuesToRemove',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        Enter values of the property above to remove. For example, if removing by codec_name, could enter ac3,aac. \n        To resolve 'Subtitle codec 94213 is not supported' error, enter mov_text.\n        \n        \\nExample:\\n\n        ac3,aac\n        ",
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
                ],
            },
            tooltip: "\n      Specify whether to remove streams that include or do not include the values above.\n      ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var propertyToCheck = String(args.inputs.propertyToCheck).trim();
    var valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map(function (item) { return item.trim().toLowerCase(); });
    var condition = String(args.inputs.condition);
    args.variables.ffmpegCommand.streams.forEach(function (stream) {
        var _a;
        // Skip stream index 0, this is the video stream
        if (stream.index === 0)
            return;
        var target = '';
        if (propertyToCheck.includes('.')) {
            var parts = propertyToCheck.split('.');
            target = (_a = stream[parts[0]]) === null || _a === void 0 ? void 0 : _a[parts[1]];
        }
        else {
            target = stream[propertyToCheck];
        }
        if (target) {
            var prop_1 = String(target).toLowerCase();
            var prefix_1 = "Removing stream index ".concat(stream.index, " because ").concat(propertyToCheck, " of ").concat(prop_1);
            if (condition === 'includes') {
                // Check each value individually for an exact match
                valuesToRemove.forEach(function (val) {
                    if (prop_1 === val) {
                        args.jobLog("".concat(prefix_1, " includes exact match ").concat(val, "\n"));
                        // eslint-disable-next-line no-param-reassign
                        stream.removed = true;
                    }
                });
            }
            else if (condition === 'not_includes') {
                // Check the array as a whole for no exact matches
                var noneMatch = valuesToRemove.every(function (val) { return prop_1 !== val; });
                if (noneMatch) {
                    args.jobLog("".concat(prefix_1, " does not include any exact matches of [").concat(valuesToRemove.join(', '), "]\n"));
                    // eslint-disable-next-line no-param-reassign
                    stream.removed = true;
                }
            }
        }
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
