"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 4: Flow Errors Part 3 - Plugin-specific Error Handling",
    "description": "Chapter 4: Flow Errors Part 3 - Plugin-specific Error Handling",
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
                "x": 541.9238836009351,
                "y": 32.863009312154745
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
                "x": 399.8062875388412,
                "y": 417.9708580733087
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
                "x": 1060.1712089610803,
                "y": 145.28055874973487
            }
        },
        {
            "name": "Send Web Request",
            "sourceRepo": "Community",
            "pluginName": "webRequest",
            "version": "1.0.0",
            "id": "Bc2bZtgBc",
            "position": {
                "x": 922.4677516191077,
                "y": 279.351803016885
            }
        },
        {
            "name": "Tdarr also offers plugin-specific error handling using the RED connection on each plugin. The flow path will be triggered if an unhandled error occurs within that specific plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "H__edbTLw",
            "position": {
                "x": 767.7320724785685,
                "y": -230.81328720265796
            }
        },
        {
            "name": "Send Web Request: Ping Melissa to check network storage",
            "sourceRepo": "Community",
            "pluginName": "webRequest",
            "version": "1.0.0",
            "id": "X9NEJCEgk",
            "position": {
                "x": 880.7836232681229,
                "y": -39.676791653194755
            }
        },
        {
            "name": "Send Web Request: Ping Romesh to check transcode log",
            "sourceRepo": "Community",
            "pluginName": "webRequest",
            "version": "1.0.0",
            "id": "BO0c5TlKq",
            "position": {
                "x": 661.6510110384603,
                "y": 300.5554220718082
            }
        },
        {
            "name": "This allows very specific error flows, for example pinging different team members for different errors.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "zTVwtbuxI",
            "position": {
                "x": 657.8440331872728,
                "y": 166.67570418496692
            }
        },
        {
            "name": "The plugin-specifc error handling will NOT trigger the 'On Flow Error' plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "N9E-u8l0o",
            "position": {
                "x": 1170.7519669401188,
                "y": 56.50523025141092
            }
        },
        {
            "name": "But you can still join the plugin-specific error handling flow onto the rest of the 'On Flow Error' Flow",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "AOi3vLobO",
            "position": {
                "x": 1125.9768689675689,
                "y": 284.4868129833375
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
            "source": "yMWso-uZa",
            "sourceHandle": "1",
            "target": "Bc2bZtgBc",
            "targetHandle": null,
            "id": "7k8P1VYv6"
        },
        {
            "source": "gtZCtmY-l",
            "sourceHandle": "err1",
            "target": "X9NEJCEgk",
            "targetHandle": null,
            "id": "9rhuR5eSI"
        },
        {
            "source": "pmoPx8W0W",
            "sourceHandle": "err1",
            "target": "BO0c5TlKq",
            "targetHandle": null,
            "id": "ttZgLtKF3"
        },
        {
            "source": "H__edbTLw",
            "sourceHandle": "1",
            "target": "zTVwtbuxI",
            "targetHandle": null,
            "id": "5sjNNMXAK"
        },
        {
            "source": "X9NEJCEgk",
            "sourceHandle": "1",
            "target": "Bc2bZtgBc",
            "targetHandle": null,
            "id": "OW-yqRQH5"
        },
        {
            "source": "N9E-u8l0o",
            "sourceHandle": "1",
            "target": "AOi3vLobO",
            "targetHandle": null,
            "id": "K440_LQm_"
        }
    ]
}); };
exports.details = details;
