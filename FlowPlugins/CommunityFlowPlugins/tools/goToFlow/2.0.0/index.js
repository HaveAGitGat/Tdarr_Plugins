"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Go To Flow',
    description: 'Go to a different flow',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.14.01',
    sidebarPosition: -1,
    icon: 'faArrowRight',
    inputs: [
        {
            label: 'Flow ID',
            name: 'flowId',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'dropdown',
                options: [],
            },
            tooltip: 'Specify flow ID to go to',
        },
        {
            label: 'Plugin ID',
            name: 'pluginId',
            type: 'string',
            defaultValue: 'start',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify plugin ID to go to',
        },
    ],
    outputs: [],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
