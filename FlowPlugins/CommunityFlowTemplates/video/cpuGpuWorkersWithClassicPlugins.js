"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    name: 'CPU and GPU Workers with Classic Plugins',
    description: 'An example of how to use CPU and GPU workers in a flow with Classic plugins.',
    tags: '',
    flowPlugins: [
        {
            name: 'Input File',
            sourceRepo: 'Community',
            pluginName: 'inputFile',
            version: '1.0.0',
            id: '7a6heYJTK',
            position: {
                x: 619.59375,
                y: 71,
            },
        },
        {
            name: 'Check Flow Variable Worker Type',
            sourceRepo: 'Community',
            pluginName: 'checkFlowVariable',
            version: '1.0.0',
            inputsDB: {
                variable: '{{{args.workerType}}}',
                value: 'transcodecpu',
            },
            id: 'Xmz-M1Kcp',
            position: {
                x: 283.20237348477906,
                y: 290.238450972502,
            },
        },
        {
            name: 'Run Classic Transcode Plugin GPU',
            sourceRepo: 'Community',
            pluginName: 'runClassicTranscodePlugin',
            version: '1.0.0',
            id: 'eqw2BDcZn',
            position: {
                x: 375.31709058623835,
                y: 408.0111681805965,
            },
        },
        {
            name: 'Run Classic Transcode Plugin CPU',
            sourceRepo: 'Community',
            pluginName: 'runClassicTranscodePlugin',
            version: '1.0.0',
            inputsDB: {
                pluginSourceId: 'Community:Tdarr_Plugin_MC93_Migz1FFMPEG_CPU',
            },
            id: 'UINSF-Jto',
            position: {
                x: 100.25684007589598,
                y: 404.37175331560564,
            },
        },
        {
            name: 'Replace Original File',
            sourceRepo: 'Community',
            pluginName: 'replaceOriginalFile',
            version: '1.0.0',
            id: 'lxwMPh0uu',
            position: {
                x: 595.7808723912251,
                y: 607.9004301072788,
            },
        },
        {
            name: 'Check Video Codec',
            sourceRepo: 'Community',
            pluginName: 'checkVideoCodec',
            version: '1.0.0',
            id: 'proNYXeri',
            position: {
                x: 619.8706093195298,
                y: 156.082632021403,
            },
        },
        {
            name: 'Check if the worker is CPU or GPU',
            sourceRepo: 'Community',
            pluginName: 'comment',
            version: '1.0.0',
            id: 'AKPe0A7V8',
            position: {
                x: 464.26942235255467,
                y: 287.4437630300136,
            },
        },
    ],
    flowEdges: [
        {
            source: 'Xmz-M1Kcp',
            sourceHandle: '1',
            target: 'UINSF-Jto',
            targetHandle: null,
            id: 'uidvJfV-Y',
        },
        {
            source: 'Xmz-M1Kcp',
            sourceHandle: '2',
            target: 'eqw2BDcZn',
            targetHandle: null,
            id: 'NJYk1xAp8',
        },
        {
            source: 'proNYXeri',
            sourceHandle: '2',
            target: 'Xmz-M1Kcp',
            targetHandle: null,
            id: 'SLQVwGIPH',
        },
        {
            source: '7a6heYJTK',
            sourceHandle: '1',
            target: 'proNYXeri',
            targetHandle: null,
            id: 'qiz1H28mJ',
        },
        {
            source: 'proNYXeri',
            sourceHandle: '1',
            target: 'lxwMPh0uu',
            targetHandle: null,
            id: 'AqBdvBcmk',
        },
        {
            source: 'UINSF-Jto',
            sourceHandle: '1',
            target: 'lxwMPh0uu',
            targetHandle: null,
            id: 'iwEuBiRZF',
        },
        {
            source: 'eqw2BDcZn',
            sourceHandle: '1',
            target: 'lxwMPh0uu',
            targetHandle: null,
            id: 'WQDC5fqqR',
        },
    ],
}); };
exports.details = details;
