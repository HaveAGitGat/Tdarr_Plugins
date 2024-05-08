"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 4: Flow Errors Part 2 - On Flow Error",
    "description": "Chapter 4: Flow Errors Part 2 - On Flow Error",
    "tags": "",
    "flowPlugins": [
        {
            "name": "Input File",
            "sourceRepo": "Community",
            "pluginName": "inputFile",
            "version": "1.0.0",
            "id": "gtZCtmY-l",
            "position": {
                "x": 648.6536861377089,
                "y": -82.45578042880155
            }
        },
        {
            "name": "Check Video Codec",
            "sourceRepo": "Community",
            "pluginName": "checkVideoCodec",
            "version": "1.0.0",
            "id": "PpLF-5jxp",
            "position": {
                "x": 752.4065242952165,
                "y": 51.12406033129332
            }
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "QdLvoNjuG",
            "position": {
                "x": 773.1888091521793,
                "y": 727.583503313465
            }
        },
        {
            "name": "Begin Command",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandStart",
            "version": "1.0.0",
            "id": "-kY9osnGE",
            "position": {
                "x": 399.6705241883612,
                "y": 143.02276817432977
            }
        },
        {
            "name": "Execute",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandExecute",
            "version": "1.0.0",
            "id": "pmoPx8W0W",
            "position": {
                "x": 416.1451226612283,
                "y": 433.3485852473201
            }
        },
        {
            "name": "Set Container",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandSetContainer",
            "version": "1.0.0",
            "id": "-DEIJA3Pf",
            "position": {
                "x": 401.1862407548717,
                "y": 335.51877212115033
            }
        },
        {
            "name": "Set Video Encoder",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandSetVideoEncoder",
            "version": "1.0.0",
            "id": "U0fVPXskr",
            "position": {
                "x": 400.1862407548716,
                "y": 249.12292783005773
            }
        },
        {
            "name": "Fail Flow",
            "sourceRepo": "Community",
            "pluginName": "failFlow",
            "version": "1.0.0",
            "id": "mNwoZNlmo",
            "position": {
                "x": 616.8564543703576,
                "y": 578.3209514237449
            }
        },
        {
            "name": "Compare File Size",
            "sourceRepo": "Community",
            "pluginName": "compareFileSize",
            "version": "1.0.0",
            "id": "YGd45fK8d",
            "position": {
                "x": 518.9335431151374,
                "y": 502.8688871164036
            }
        },
        {
            "name": "On Flow Error",
            "sourceRepo": "Community",
            "pluginName": "onFlowError",
            "version": "1.0.0",
            "id": "yMWso-uZa",
            "position": {
                "x": 922.4197900595414,
                "y": 161.088098623682
            }
        },
        {
            "name": "1. To handle an error that occurs anywhere in this specifc flow, you can use the 'On Flow Error' plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "jpEn9FVQX",
            "position": {
                "x": 1018.5785464566798,
                "y": 65.98583847747655
            }
        },
        {
            "name": "All unhandled errors and the 'Fail Flow' plugin IN THIS FLOW will trigger the 'On Flow Error' plugin IN THIS FLOW",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "vRFTPo0p5",
            "position": {
                "x": 698.3866844766682,
                "y": 451.2472106052397
            }
        },
        {
            "name": "If another error occurs in the 'On Flow Error' flow then the flow will end and the file will be moved to the transcode 'Transcode: Error/Cancelled' tab. The  'On Flow Error' plugin will NOT be run again (to prevent infinite error loops)",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "fAQouEkEY",
            "position": {
                "x": 1183.421069816697,
                "y": 228.19157008625297
            }
        },
        {
            "name": "Send Web Request",
            "sourceRepo": "Community",
            "pluginName": "webRequest",
            "version": "1.0.0",
            "id": "42P9lb0B3",
            "position": {
                "x": 897.7260729664589,
                "y": 469.1243455181426
            }
        },
        {
            "name": "Even if all the plugins in the error flow complete successfully, the file will still be moved to the 'Transcode: Error/Cancelled' tab at the end.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "Ke1S57we6",
            "position": {
                "x": 1006.3188415680227,
                "y": 541.3784972055968
            }
        },
        {
            "name": "Fail Flow",
            "sourceRepo": "Community",
            "pluginName": "failFlow",
            "version": "1.0.0",
            "id": "yj3grm5d8",
            "position": {
                "x": 1047.7090907308577,
                "y": 394.7331214427515
            }
        },
        {
            "name": "Check File Exists",
            "sourceRepo": "Community",
            "pluginName": "checkFileExists",
            "version": "1.0.0",
            "id": "S_rVuKn8S",
            "position": {
                "x": 926.2665476107438,
                "y": 277.7066707997331
            }
        }
    ],
    "flowEdges": [
        {
            "source": "PpLF-5jxp",
            "sourceHandle": "1",
            "target": "QdLvoNjuG",
            "targetHandle": null,
            "id": "ldiZljXp2"
        },
        {
            "source": "gtZCtmY-l",
            "sourceHandle": "1",
            "target": "PpLF-5jxp",
            "targetHandle": null,
            "id": "Cs5aBSUks"
        },
        {
            "source": "-kY9osnGE",
            "sourceHandle": "1",
            "target": "U0fVPXskr",
            "targetHandle": null,
            "id": "wuqNLcC1D"
        },
        {
            "source": "U0fVPXskr",
            "sourceHandle": "1",
            "target": "-DEIJA3Pf",
            "targetHandle": null,
            "id": "Coq5pIs3c"
        },
        {
            "source": "-DEIJA3Pf",
            "sourceHandle": "1",
            "target": "pmoPx8W0W",
            "targetHandle": null,
            "id": "fGjbMXOng"
        },
        {
            "source": "PpLF-5jxp",
            "sourceHandle": "2",
            "target": "-kY9osnGE",
            "targetHandle": null,
            "id": "E5NHstmdF"
        },
        {
            "source": "pmoPx8W0W",
            "sourceHandle": "1",
            "target": "YGd45fK8d",
            "targetHandle": null,
            "id": "bldP67hmm"
        },
        {
            "source": "YGd45fK8d",
            "sourceHandle": "1",
            "target": "QdLvoNjuG",
            "targetHandle": null,
            "id": "fw9Le5zqo"
        },
        {
            "source": "YGd45fK8d",
            "sourceHandle": "2",
            "target": "QdLvoNjuG",
            "targetHandle": null,
            "id": "wd7SmimpM"
        },
        {
            "source": "YGd45fK8d",
            "sourceHandle": "3",
            "target": "mNwoZNlmo",
            "targetHandle": null,
            "id": "RmpqCf-Vh"
        },
        {
            "source": "jpEn9FVQX",
            "sourceHandle": "1",
            "target": "fAQouEkEY",
            "targetHandle": null,
            "id": "5mv1ls7Ib"
        },
        {
            "source": "fAQouEkEY",
            "sourceHandle": "1",
            "target": "Ke1S57we6",
            "targetHandle": null,
            "id": "_VEvhMOtk"
        },
        {
            "source": "yMWso-uZa",
            "sourceHandle": "1",
            "target": "S_rVuKn8S",
            "targetHandle": null,
            "id": "yweCdlSWM"
        },
        {
            "source": "S_rVuKn8S",
            "sourceHandle": "1",
            "target": "yj3grm5d8",
            "targetHandle": null,
            "id": "xI3eh7wZp"
        },
        {
            "source": "S_rVuKn8S",
            "sourceHandle": "2",
            "target": "42P9lb0B3",
            "targetHandle": null,
            "id": "V-qf6QBC4"
        }
    ]
}); };
exports.details = details;
