"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 3: FFmpeg Command",
    "description": "Chapter 3: FFmpeg Command",
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
                "x": 648.9333795070321,
                "y": -12.529435106431094
            }
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "QdLvoNjuG",
            "position": {
                "x": 723.9430232247286,
                "y": 534.7914903208923
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
                "x": 400.42838247161643,
                "y": 438.58749864385743
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
            "name": "The FFmpeg Command plugins dynamically create an FFmpeg command depending on the input file",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "hGnpEHnk5",
            "position": {
                "x": 254.91444207269103,
                "y": -44.61887485112061
            }
        },
        {
            "name": "You must always begin an FFmpeg command using the 'Begin Command' Plugin",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "saj94a135",
            "position": {
                "x": 201.288800916537,
                "y": 100.94856498487928
            }
        },
        {
            "name": "In this example, if the video file is already in h265/hevc and mkv container, no action will be taken on the file. To force re-encoding, you can use the forceEncoding option on the Video Encoder plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "sb5MvVryc",
            "position": {
                "x": 201.61485276007585,
                "y": 222.09640730256172
            }
        },
        {
            "name": "Once the FFmpeg command has been created, you need to execute it using this plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "V0QGN5PKA",
            "position": {
                "x": 202.61485276007582,
                "y": 440.0964073025617
            }
        },
        {
            "name": "Once again, the output contains the new cache file (or the original file if no action was taken on the file). If there's a new cache file, the 'Replace Original File' plugin will replace the original file, else it will do nothing.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "i4eODNlBc",
            "position": {
                "x": 536.6148527600759,
                "y": 568.0964073025617
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
            "target": "QdLvoNjuG",
            "targetHandle": null,
            "id": "k9JywvYcK"
        },
        {
            "source": "hGnpEHnk5",
            "sourceHandle": "1",
            "target": "saj94a135",
            "targetHandle": null,
            "id": "dX6DiWPJX"
        },
        {
            "source": "saj94a135",
            "sourceHandle": "1",
            "target": "sb5MvVryc",
            "targetHandle": null,
            "id": "0MAqJvu_e"
        },
        {
            "source": "sb5MvVryc",
            "sourceHandle": "1",
            "target": "V0QGN5PKA",
            "targetHandle": null,
            "id": "57NrKKG2n"
        },
        {
            "source": "V0QGN5PKA",
            "sourceHandle": "1",
            "target": "i4eODNlBc",
            "targetHandle": null,
            "id": "BHwljK8rj"
        }
    ]
}); };
exports.details = details;
