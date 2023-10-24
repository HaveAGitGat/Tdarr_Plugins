"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 4: Flow Errors Part 1",
    "description": "Chapter 4: Flow Errors Part 1",
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
            "name": "If an unhandled error occurs during the flow, the flow will stop and the file will be moved to the Transcode: Error/Cancelled tab. You can then review the job report to see what went wrong.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "mNaOzfS0Y",
            "position": {
                "x": 604.5850500985517,
                "y": 166.18413013606266
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
            "name": "You can also force a flow to fail which can be useful in certain situation such as here.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "9QkIvxxxx",
            "position": {
                "x": 678.3646507954192,
                "y": 429.7476734555484
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
            "source": "mNaOzfS0Y",
            "sourceHandle": "1",
            "target": "9QkIvxxxx",
            "targetHandle": null,
            "id": "4Yez6rEN2"
        }
    ]
}); };
exports.details = details;
