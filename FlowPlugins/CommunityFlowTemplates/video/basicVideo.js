"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    name: 'Basic HEVC Video Flow',
    description: 'Basic HEVC Video Flow',
    tags: '',
    flowPlugins: [
        {
            name: 'Input File',
            sourceRepo: 'Community',
            pluginName: 'inputFile',
            version: '1.0.0',
            id: 'pE6rU7gkW',
            position: {
                x: 758.5809635618224,
                y: 117.19206188888086,
            },
        },
        {
            name: 'Check if hevc',
            sourceRepo: 'Community',
            pluginName: 'checkVideoCodec',
            version: '1.0.0',
            id: '91b7IrsEc',
            position: {
                x: 672.4549563302081,
                y: 253.11148102973914,
            },
        },
        {
            name: 'Start',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandStart',
            version: '1.0.0',
            id: '4Swd6qzvc',
            position: {
                x: 489.25252076795084,
                y: 370.51229288382495,
            },
        },
        {
            name: 'Execute',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandExecute',
            version: '1.0.0',
            id: '450g167D8',
            position: {
                x: 488.72295602997406,
                y: 699.5034828311435,
            },
        },
        {
            name: 'Set Video Encoder',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetVideoEncoder',
            version: '1.0.0',
            id: '8B_6pRd_U',
            position: {
                x: 488.5270135748424,
                y: 477.83202026423606,
            },
        },
        {
            name: 'Replace Original File',
            sourceRepo: 'Community',
            pluginName: 'replaceOriginalFile',
            version: '1.0.0',
            id: '4fkfOyR3l',
            position: {
                x: 820.4549563302082,
                y: 742.2114810297393,
            },
        },
        {
            name: 'Set Container',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetContainer',
            version: '1.0.0',
            id: 'TtKXi3Q7h',
            position: {
                x: 488.21110165973323,
                y: 570.3064821931456,
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
            sourceHandle: '2',
            target: '4Swd6qzvc',
            targetHandle: null,
            id: 'jJizyFUcr',
        },
        {
            source: '4Swd6qzvc',
            sourceHandle: '1',
            target: '8B_6pRd_U',
            targetHandle: null,
            id: '3Df7Xoy93',
        },
        {
            source: '450g167D8',
            sourceHandle: '1',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'rE5Dsh9KM',
        },
        {
            source: '91b7IrsEc',
            sourceHandle: '1',
            target: '4fkfOyR3l',
            targetHandle: null,
            id: 'W2nVG7ts5',
        },
        {
            source: '8B_6pRd_U',
            sourceHandle: '1',
            target: 'TtKXi3Q7h',
            targetHandle: null,
            id: 'epqtLsPuG',
        },
        {
            source: 'TtKXi3Q7h',
            sourceHandle: '1',
            target: '450g167D8',
            targetHandle: null,
            id: 'ljOeP0cAZ',
        },
    ],
}); };
exports.details = details;
