"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Remove From Tdarr',
    description: "\n  If this plugin is executed, then when the flow ends, the item will be \n  removed from the Tdarr database and won't appear in Transcode Success or Error tables on the 'Tdarr' tab.\n  Use the 'Delete File' plugin if you would like to delete the file from disk.\n  ",
    style: {
        borderColor: 'red',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.31.01',
    sidebarPosition: -1,
    icon: 'faTrash',
    inputs: [],
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
    // eslint-disable-next-line no-param-reassign
    args.variables.removeFromTdarr = true;
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
