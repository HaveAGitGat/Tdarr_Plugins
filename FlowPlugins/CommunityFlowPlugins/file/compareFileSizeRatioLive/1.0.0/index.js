"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Compare File Size Ratio Live',
    description: "\n  Compare either the estimated final size or current output size to the input size and \n  give an error if estimated final size or current size surpasses the threshold %.\n\n  Works with 'FfmpegCommand', 'HandBrake Custom Arguments', 'Run Classic Transcode' and other flow plugins \n  that output a file.\n\n  Can be placed anywhere before a plugin which outputs a new file.\n\n  You can check if this plugin caused an error by using 'Check Flow Variable' and checking if \n  {{{args.variables.liveSizeCompare.error}}} is true.\n  ',\n  ",
    style: {
        borderColor: 'orange',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [
        {
            label: 'Enabled',
            name: 'enabled',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: "Enable or disable this plugin. For example you may want to enable it for one transcoding block and then\n      disable it for another block.\n      ",
        },
        {
            label: 'Compare Method',
            name: 'compareMethod',
            type: 'string',
            defaultValue: 'estimatedFinalSize',
            inputUI: {
                type: 'dropdown',
                options: [
                    'estimatedFinalSize',
                    'currentSize',
                ],
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enabled',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "Specify the method to compare.\n      Estimated Final Size: Compare the estimated final output size to the input size.\n      Current Size: Compare the current output size to the input size.\n      ",
        },
        {
            label: 'Threshold Size %',
            name: 'thresholdPerc',
            type: 'number',
            defaultValue: '60',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enabled',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "Enter the threshold size percentage relative to the input size. \n      An error will be triggered if the estimated or current size exceeds this percentage.\n\n      For example, if the input size is 100MB and the threshold is 60%, the estimated final size or current size\n      must not surpass 60MB else an error will be given and processing will stop.\n      ",
        },
        {
            label: 'Check Delay (seconds)',
            name: 'checkDelaySeconds',
            type: 'number',
            defaultValue: '20',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'enabled',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\n      Specify the delay in seconds before beginning the comparison.\n      A larger delay gives more time for the estimated final size to stabilize.\n      ",
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
    var enabled = Boolean(args.inputs.enabled);
    var compareMethod = String(args.inputs.compareMethod);
    var thresholdPerc = Number(args.inputs.thresholdPerc);
    var checkDelaySeconds = Number(args.inputs.checkDelaySeconds);
    // eslint-disable-next-line no-param-reassign
    args.variables.liveSizeCompare = {
        enabled: enabled,
        compareMethod: compareMethod,
        thresholdPerc: thresholdPerc,
        checkDelaySeconds: checkDelaySeconds,
        error: false,
    };
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
