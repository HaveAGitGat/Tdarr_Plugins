"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Tags: Requeue',
    description: "\nPlace the file back in the staging queue with specific tags.\n\nOnly Nodes/Workers which match the tags will be able to process the file.\n\nThe tags must have one of the following: 'requireCPU', 'requireGPU', or 'requireCPUorGPU'.\n\nThe above tells the server what type of worker is required to process the file.\n\nSubsequent tags must not use the reserved word 'require' in them.\n\nYou can set the 'Node Tags' in the Node options panel.\n\nA worker will only process a file if the Custom Queue Tags are a subset of the Worker/Node Tags\n",
    style: {
        borderColor: 'yellow',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.20.01',
    sidebarPosition: -1,
    icon: 'faRedo',
    inputs: [
        {
            label: 'Use Basic Queue Tags',
            name: 'useBasicQueueTags',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Use basic queue tags or custom tags.',
        },
        {
            label: 'Basic Queue Tags',
            name: 'basicQueueTags',
            type: 'string',
            defaultValue: 'requireCPU',
            inputUI: {
                type: 'dropdown',
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useBasicQueueTags',
                                    value: 'true',
                                    condition: '===',
                                },
                            ],
                        },
                    ],
                },
                options: [
                    'requireCPU',
                    'requireGPU',
                    'requireGPU:nvenc',
                    'requireGPU:qsv',
                    'requireGPU:vaapi',
                    'requireGPU:videotoolbox',
                    'requireGPU:amf',
                    'requireCPUorGPU',
                ],
            },
            tooltip: 'Specify tags to requeue file with.',
        },
        {
            label: 'Custom Queue Tags',
            name: 'customQueueTags',
            type: 'string',
            defaultValue: 'requireCPUorGPU,tag1',
            inputUI: {
                type: 'textarea',
                style: {
                    height: '100px',
                },
                displayConditions: {
                    logic: 'AND',
                    sets: [
                        {
                            logic: 'AND',
                            inputs: [
                                {
                                    name: 'useBasicQueueTags',
                                    value: 'true',
                                    condition: '!==',
                                },
                            ],
                        },
                    ],
                },
            },
            tooltip: "\nrequireGPU:nvenc,tag1,tag2\nrequireCPUorGPU,tag1,tag2\nrequireCPU,tag1,tag2\nrequireGPU,tag1,tag2,tag3\nrequireGPU,tag1\nrequireGPU,{{{args.userVariables.global.test}}}\nrequireCPUorGPU,tag1,tag2\n      ",
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
    var basicQueueTags = String(args.inputs.basicQueueTags);
    var customQueueTags = String(args.inputs.customQueueTags);
    // eslint-disable-next-line no-param-reassign
    args.variables.queueTags = args.inputs.useBasicQueueTags ? basicQueueTags : customQueueTags;
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
