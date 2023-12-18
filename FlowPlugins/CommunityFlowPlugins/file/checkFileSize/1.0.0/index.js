"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check File Size',
    description: 'Check size of working file',
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
            label: 'Unit',
            name: 'unit',
            type: 'string',
            defaultValue: 'GB',
            inputUI: {
                type: 'dropdown',
                options: [
                    'B',
                    'KB',
                    'MB',
                    'GB',
                ],
            },
            tooltip: 'Specify the unit to use',
        },
        {
            label: 'Greater Than',
            name: 'greaterThan',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify lower bound',
        },
        {
            label: 'Less Than',
            name: 'lessThan',
            type: 'number',
            defaultValue: '10000',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify upper bound',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'File within range',
        },
        {
            number: 2,
            tooltip: 'File not within range',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var isWithinRange = false;
    var greaterThanBytes = Number(args.inputs.greaterThan);
    var lessThanBytes = Number(args.inputs.lessThan);
    var fileSizeBytes = args.inputFileObj.file_size * 1000 * 1000;
    if (args.inputs.unit === 'KB') {
        greaterThanBytes *= 1000;
        lessThanBytes *= 1000;
    }
    else if (args.inputs.unit === 'MB') {
        greaterThanBytes *= 1000000;
        lessThanBytes *= 1000000;
    }
    else if (args.inputs.unit === 'GB') {
        greaterThanBytes *= 1000000000;
        lessThanBytes *= 1000000000;
    }
    if (fileSizeBytes >= greaterThanBytes && fileSizeBytes <= lessThanBytes) {
        isWithinRange = true;
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isWithinRange ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
