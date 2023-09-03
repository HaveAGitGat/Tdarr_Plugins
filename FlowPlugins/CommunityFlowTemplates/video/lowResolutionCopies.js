"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    name: 'Create Low Resolution Video Copies',
    description: 'Create Low Resolution Video Copies',
    tags: '',
    flowPlugins: [
        {
            name: 'Input File',
            sourceRepo: 'Community',
            pluginName: 'inputFile',
            version: '1.0.0',
            id: 'pE6rU7gkW',
            position: {
                x: 764.3859715446088,
                y: 54.59674430707997,
            },
        },
        {
            name: 'Check File Exists _480p',
            sourceRepo: 'Community',
            pluginName: 'checkFileExists',
            version: '1.0.0',
            inputsDB: {
                fileToCheck: '${fileName}_480p.${container}',
            },
            id: 'VyNRD3YjM',
            position: {
                x: 1127.8807371830678,
                y: -1.4370146635981769,
            },
        },
        {
            name: 'Rename File _480p',
            sourceRepo: 'Community',
            pluginName: 'renameFile',
            version: '1.0.0',
            inputsDB: {
                fileRename: '${fileName}_480p.${container}',
            },
            id: 'VpCD-7LZJ',
            position: {
                x: 1398.163993949301,
                y: 562.3533349776774,
            },
        },
        {
            name: 'Replace Original File',
            sourceRepo: 'Community',
            pluginName: 'replaceOriginalFile',
            version: '1.0.0',
            id: '1pj9oSg5G',
            position: {
                x: 736.3406162570204,
                y: 598.8673432638388,
            },
        },
        {
            name: 'Check File Exists _720p',
            sourceRepo: 'Community',
            pluginName: 'checkFileExists',
            version: '1.0.0',
            inputsDB: {
                fileToCheck: '${fileName}_720p.${container}',
            },
            id: 'uDC6XT1Jy',
            position: {
                x: 1060.0100333142968,
                y: 110.8981370311281,
            },
        },
        {
            name: 'Check File Name Includes',
            sourceRepo: 'Community',
            pluginName: 'checkFileNameIncludes',
            version: '1.0.0',
            inputsDB: {
                terms: '_720p,_480p',
            },
            id: 'wRipuaq4G',
            position: {
                x: 763.9976994431687,
                y: 198.97576654117708,
            },
        },
        {
            name: 'Rename File _720p',
            sourceRepo: 'Community',
            pluginName: 'renameFile',
            version: '1.0.0',
            inputsDB: {
                fileRename: '${fileName}_720p.${container}',
            },
            id: 'cTKbaB8nT',
            position: {
                x: 1087.883110780845,
                y: 509.6274273776863,
            },
        },
        {
            name: 'Move To Original Directory',
            sourceRepo: 'Community',
            pluginName: 'moveToOriginalDirectory',
            version: '1.0.0',
            id: 'mFRK-Z9WC',
            position: {
                x: 1162.0438576735944,
                y: 608.0524996697887,
            },
        },
        {
            name: 'Set Original File',
            sourceRepo: 'Community',
            pluginName: 'setOriginalFile',
            version: '1.0.0',
            id: 'oD4u5PY9T',
            position: {
                x: 1020.6746394849897,
                y: 738.9349550904227,
            },
        },
        {
            name: 'Begin Command',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandStart',
            version: '1.0.0',
            id: 'FSG9AOX5c',
            position: {
                x: 1171.2902386661297,
                y: 178.0193821518036,
            },
        },
        {
            name: 'Set Video Encoder',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetVideoEncoder',
            version: '1.0.0',
            inputsDB: {
                forceEncoding: 'true',
            },
            id: 'wcmBN2N02',
            position: {
                x: 1171.0819612214827,
                y: 257.19366435734827,
            },
        },
        {
            name: 'Execute',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandExecute',
            version: '1.0.0',
            id: 'tmUd79-Fb',
            position: {
                x: 1167.5698309351776,
                y: 406.2043896501846,
            },
        },
        {
            name: 'Begin Command',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandStart',
            version: '1.0.0',
            id: 'Jn6dcKd3i',
            position: {
                x: 1395.4614497255334,
                y: 111.74717420966138,
            },
        },
        {
            name: 'Execute',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandExecute',
            version: '1.0.0',
            id: 'gbY0xIJnB',
            position: {
                x: 1398.0103706416776,
                y: 417.6787803779547,
            },
        },
        {
            name: 'Set Video Resolution 480p',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetVdeoResolution',
            version: '1.0.0',
            inputsDB: {
                targetResolution: '480p',
            },
            id: 'dzFEwECXB',
            position: {
                x: 1396.1961096759603,
                y: 309.9727302535869,
            },
        },
        {
            name: 'Set Video Encoder',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetVideoEncoder',
            version: '1.0.0',
            inputsDB: {
                forceEncoding: 'true',
            },
            id: '_EynbvgSl',
            position: {
                x: 1396.1961096759603,
                y: 214.35898180146438,
            },
        },
        {
            name: 'Set Video Resolution 720p',
            sourceRepo: 'Community',
            pluginName: 'ffmpegCommandSetVdeoResolution',
            version: '1.0.0',
            inputsDB: {
                targetResolution: '720p',
            },
            id: 'CMm7MlE7g',
            position: {
                x: 1169.6624226114702,
                y: 336.82482287402803,
            },
        },
    ],
    flowEdges: [
        {
            source: 'pE6rU7gkW',
            sourceHandle: '1',
            target: 'wRipuaq4G',
            targetHandle: null,
            id: 'IE_oGhETB',
        },
        {
            source: 'wRipuaq4G',
            sourceHandle: '1',
            target: '1pj9oSg5G',
            targetHandle: null,
            id: 'QR6uGNUhE',
        },
        {
            source: 'wRipuaq4G',
            sourceHandle: '2',
            target: 'VyNRD3YjM',
            targetHandle: null,
            id: 'sh_kstv0D',
        },
        {
            source: 'uDC6XT1Jy',
            sourceHandle: '1',
            target: '1pj9oSg5G',
            targetHandle: null,
            id: 'G5jl85ijr',
        },
        {
            source: 'VyNRD3YjM',
            sourceHandle: '1',
            target: 'uDC6XT1Jy',
            targetHandle: null,
            id: 'DmUL9DS8q',
        },
        {
            source: 'VpCD-7LZJ',
            sourceHandle: '1',
            target: 'mFRK-Z9WC',
            targetHandle: null,
            id: 'ap4YXAxy3',
        },
        {
            source: 'cTKbaB8nT',
            sourceHandle: '1',
            target: 'mFRK-Z9WC',
            targetHandle: null,
            id: 'i9fr5J5pL',
        },
        {
            source: 'mFRK-Z9WC',
            sourceHandle: '1',
            target: 'oD4u5PY9T',
            targetHandle: null,
            id: 'KUw59S_Zl',
        },
        {
            source: 'oD4u5PY9T',
            sourceHandle: '1',
            target: 'wRipuaq4G',
            targetHandle: null,
            id: 'HlM4E6eV8',
        },
        {
            source: 'tmUd79-Fb',
            sourceHandle: '1',
            target: 'cTKbaB8nT',
            targetHandle: null,
            id: 'iJLmmoDLp',
        },
        {
            source: 'uDC6XT1Jy',
            sourceHandle: '2',
            target: 'FSG9AOX5c',
            targetHandle: null,
            id: 'iRTrU8utq',
        },
        {
            source: 'dzFEwECXB',
            sourceHandle: '1',
            target: 'gbY0xIJnB',
            targetHandle: null,
            id: 'A5cyCu_kx',
        },
        {
            source: 'Jn6dcKd3i',
            sourceHandle: '1',
            target: '_EynbvgSl',
            targetHandle: null,
            id: '1HajidLz-',
        },
        {
            source: '_EynbvgSl',
            sourceHandle: '1',
            target: 'dzFEwECXB',
            targetHandle: null,
            id: 'vEESYeSsL',
        },
        {
            source: 'VyNRD3YjM',
            sourceHandle: '2',
            target: 'Jn6dcKd3i',
            targetHandle: null,
            id: 'q8zd_qCSU',
        },
        {
            source: 'gbY0xIJnB',
            sourceHandle: '1',
            target: 'VpCD-7LZJ',
            targetHandle: null,
            id: 'leYMQdxHw',
        },
        {
            source: 'FSG9AOX5c',
            sourceHandle: '1',
            target: 'wcmBN2N02',
            targetHandle: null,
            id: 'Dl5MCSqQM',
        },
        {
            source: 'wcmBN2N02',
            sourceHandle: '1',
            target: 'CMm7MlE7g',
            targetHandle: null,
            id: 'GIpbjomC8',
        },
        {
            source: 'CMm7MlE7g',
            sourceHandle: '1',
            target: 'tmUd79-Fb',
            targetHandle: null,
            id: 'AxR9R10MY',
        },
    ],
}); };
exports.details = details;
