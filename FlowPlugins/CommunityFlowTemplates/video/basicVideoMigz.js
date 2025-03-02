"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    name: 'Basic HEVC Video Flow - Migz 50%',
    description: 'Basic HEVC video flow which uses the Migz GPU (NVENC) '
        + 'and Migz CPU plugins to aim for 50% file size reduction.',
    tags: '',
    flowPlugins: [
        {
            name: 'Input File',
            sourceRepo: 'Community',
            pluginName: 'inputFile',
            version: '1.0.0',
            id: 'pE6rU7gkW',
            position: {
                x: 605.6174844367866,
                y: 91.61529256488166,
            },
        },
        {
            name: 'Check if hevc',
            sourceRepo: 'Community',
            pluginName: 'checkVideoCodec',
            version: '1.0.0',
            id: '91b7IrsEc',
            position: {
                x: 605.9056229600291,
                y: 192.7915128738341,
            },
        },
        {
            name: 'Replace Original File',
            sourceRepo: 'Community',
            pluginName: 'replaceOriginalFile',
            version: '1.0.0',
            id: '4fkfOyR3l',
            position: {
                x: 616.6829422267598,
                y: 723.4017566509596,
            },
        },
        {
            name: 'Run Classic Transcode Plugin: Migz GPU',
            sourceRepo: 'Community',
            pluginName: 'runClassicTranscodePlugin',
            version: '2.0.0',
            id: 'QaMarr7U2',
            position: {
                x: 277.3652089704872,
                y: 482.2580996510953,
            },
        },
        {
            name: 'Check Flow Variable: Worker Type',
            sourceRepo: 'Community',
            pluginName: 'checkFlowVariable',
            version: '1.0.0',
            id: 'R3SsqA2R2',
            position: {
                x: 388.92513564303005,
                y: 265.27914587528255,
            },
            inputsDB: {
                variable: '{{{args.workerType}}}',
                value: 'transcodegpu',
            },
        },
        {
            name: 'Run Classic Transcode Plugin: Migz CPU',
            sourceRepo: 'Community',
            pluginName: 'runClassicTranscodePlugin',
            version: '2.0.0',
            id: 'vML4LnVoU',
            position: {
                x: 480.1963619411388,
                y: 479.8508686675832,
            },
            inputsDB: {
                pluginSourceId: 'Community:Tdarr_Plugin_MC93_Migz1FFMPEG_CPU',
            },
        },
        {
            name: 'Check Node Hardware Encoder',
            sourceRepo: 'Community',
            pluginName: 'checkNodeHardwareEncoder',
            version: '1.0.0',
            id: 'nXh1BK3js',
            position: {
                x: 302.73826398477604,
                y: 373.54857265752986,
            },
        },
    ],
    flowEdges: [
        {
            source: 'pE6rU7gkW',
            sourceHandle: '1',
            target: '91b7IrsEc',
            targetHandle: null,
            id: 'HhF4rw2DZ',
        },
        {
            source: '91b7IrsEc',
            sourceHandle: '1',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'W2nVG7ts5',
        },
        {
            source: '91b7IrsEc',
            sourceHandle: '2',
            target: 'R3SsqA2R2',
            targetHandle: null,
            id: 'xZsf8IwDg',
        },
        {
            source: 'R3SsqA2R2',
            sourceHandle: '2',
            target: 'vML4LnVoU',
            targetHandle: null,
            id: 'RWv471I6E',
        },
        {
            source: 'QaMarr7U2',
            sourceHandle: '1',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'CEk8bEYqP',
        },
        {
            source: 'QaMarr7U2',
            sourceHandle: '2',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'vsKLZM4zM',
        },
        {
            source: 'vML4LnVoU',
            sourceHandle: '1',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'vnP8TvN2d',
        },
        {
            source: 'vML4LnVoU',
            sourceHandle: '2',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: '-KMkJCTg3',
        },
        {
            source: 'R3SsqA2R2',
            sourceHandle: '1',
            target: 'nXh1BK3js',
            targetHandle: null,
            id: 'vfT4o_4G6',
        },
        {
            source: 'nXh1BK3js',
            sourceHandle: '1',
            target: 'QaMarr7U2',
            targetHandle: null,
            id: 'eADOkFsGe',
        },
        {
            source: 'nXh1BK3js',
            sourceHandle: '2',
            target: 'vML4LnVoU',
            targetHandle: null,
            id: 'Blu0QflQK',
        },
    ],
}); };
exports.details = details;
