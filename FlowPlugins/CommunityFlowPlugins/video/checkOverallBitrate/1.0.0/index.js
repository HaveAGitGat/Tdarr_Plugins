"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check Overall Bitrate',
    description: 'Check if overall file bitrate is within a specific range',
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
            defaultValue: 'kbps',
            inputUI: {
                type: 'dropdown',
                options: [
                    'bps',
                    'kbps',
                    'mbps',
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
    var greaterThanBits = Number(args.inputs.greaterThan);
    var lessThanBits = Number(args.inputs.lessThan);
    if (args.inputs.unit === 'kbps') {
        greaterThanBits *= 1000;
        lessThanBits *= 1000;
    }
    else if (args.inputs.unit === 'mbps') {
        greaterThanBits *= 1000000;
        lessThanBits *= 1000000;
    }
    args.jobLog("File bitrate is ".concat(args.inputFileObj.bit_rate, " bps"));
    args.jobLog("Checking if bitrate is within range ".concat(greaterThanBits, " bps and ").concat(lessThanBits, " bps"));
    if (args.inputFileObj.bit_rate >= greaterThanBits && args.inputFileObj.bit_rate <= lessThanBits) {
        isWithinRange = true;
        args.jobLog('File bitrate is within range');
    }
    else {
        args.jobLog('File bitrate is not within range');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: isWithinRange ? 1 : 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
