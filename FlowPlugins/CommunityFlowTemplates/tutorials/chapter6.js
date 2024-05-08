"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 6: The Review System",
    "description": "Chapter 6: The Review System",
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
            "id": "R0gX9B20d",
            "position": {
                "x": 879.7236115475249,
                "y": 934.782797377857
            }
        },
        {
            "name": "Begin Command",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandStart",
            "version": "1.0.0",
            "id": "U6N3AQubH",
            "position": {
                "x": 546.8854528742303,
                "y": 174.54090453410515
            }
        },
        {
            "name": "Execute",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandExecute",
            "version": "1.0.0",
            "id": "Lv-zb-iTw",
            "position": {
                "x": 543.172691292081,
                "y": 368.6158072160807
            }
        },
        {
            "name": "Set Video Encoder",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandSetVideoEncoder",
            "version": "1.0.0",
            "id": "1pOFUCuQR",
            "position": {
                "x": 545.0642491154337,
                "y": 274.70711126791645
            }
        },
        {
            "name": "Require Review",
            "sourceRepo": "Community",
            "pluginName": "requireReview",
            "version": "1.0.0",
            "id": "oHpu2fZOi",
            "position": {
                "x": 631.7959812272709,
                "y": 459.542392214296
            }
        },
        {
            "name": "Run Classic Transcode Plugin: Add Audio Stream",
            "sourceRepo": "Community",
            "pluginName": "runClassicTranscodePlugin",
            "version": "1.0.0",
            "inputsDB": {
                "pluginSourceId": "Community:Tdarr_Plugin_00td_action_add_audio_stream_codec"
            },
            "id": "RZX5jIP5I",
            "position": {
                "x": 632.2402074212371,
                "y": 545.8356807635909
            }
        },
        {
            "name": "Run Classic Transcode Plugin",
            "sourceRepo": "Community",
            "pluginName": "runClassicTranscodePlugin",
            "version": "1.0.0",
            "inputsDB": {
                "pluginSourceId": "Community:Tdarr_Plugin_00td_action_remove_audio_by_channel_count",
                "channelCounts": "8"
            },
            "id": "3zj5puRQ1",
            "position": {
                "x": 696.5390735282473,
                "y": 758.7339551203235
            }
        },
        {
            "name": "Require Review",
            "sourceRepo": "Community",
            "pluginName": "requireReview",
            "version": "1.0.0",
            "id": "q8Pz_3HGh",
            "position": {
                "x": 634.7388490591334,
                "y": 648.8668893974542
            }
        },
        {
            "name": "You can pause a flow by using the 'Require Review' plugin. This will cause the file to stay in the staging section on the Tdarr tab until the 'Reviewed' button is pressed. This allows you to check the last completed cache file.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "YPyMAbZ76",
            "position": {
                "x": 856.2716462414401,
                "y": 343.06736953610425
            }
        },
        {
            "name": "Once the file has been reviewed, the flow will continue from the next plugin.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "REt4UEEGD",
            "position": {
                "x": 856.7260936183322,
                "y": 531.8099095812979
            }
        },
        {
            "name": "You can 'Require Review' as much as you like!",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "UhuSLjA8g",
            "position": {
                "x": 857.7070495622867,
                "y": 709.362935437006
            }
        },
        {
            "name": "Require Review",
            "sourceRepo": "Community",
            "pluginName": "requireReview",
            "version": "1.0.0",
            "id": "8IU0bhEJs",
            "position": {
                "x": 780.2115299899054,
                "y": 844.7348557026837
            }
        }
    ],
    "flowEdges": [
        {
            "source": "gtZCtmY-l",
            "sourceHandle": "1",
            "target": "PpLF-5jxp",
            "targetHandle": null,
            "id": "Cs5aBSUks"
        },
        {
            "source": "U6N3AQubH",
            "sourceHandle": "1",
            "target": "1pOFUCuQR",
            "targetHandle": null,
            "id": "RdnvWmv0o"
        },
        {
            "source": "1pOFUCuQR",
            "sourceHandle": "1",
            "target": "Lv-zb-iTw",
            "targetHandle": null,
            "id": "p-VkIS6DK"
        },
        {
            "source": "PpLF-5jxp",
            "sourceHandle": "2",
            "target": "U6N3AQubH",
            "targetHandle": null,
            "id": "x_vWzShYB"
        },
        {
            "source": "PpLF-5jxp",
            "sourceHandle": "1",
            "target": "R0gX9B20d",
            "targetHandle": null,
            "id": "CtIsUppTB"
        },
        {
            "source": "Lv-zb-iTw",
            "sourceHandle": "1",
            "target": "oHpu2fZOi",
            "targetHandle": null,
            "id": "d9tDIjd1L"
        },
        {
            "source": "oHpu2fZOi",
            "sourceHandle": "1",
            "target": "RZX5jIP5I",
            "targetHandle": null,
            "id": "kFP4WRftx"
        },
        {
            "source": "RZX5jIP5I",
            "sourceHandle": "1",
            "target": "q8Pz_3HGh",
            "targetHandle": null,
            "id": "nqbQJ9wUz"
        },
        {
            "source": "q8Pz_3HGh",
            "sourceHandle": "1",
            "target": "3zj5puRQ1",
            "targetHandle": null,
            "id": "Vx60urLP7"
        },
        {
            "source": "YPyMAbZ76",
            "sourceHandle": "1",
            "target": "REt4UEEGD",
            "targetHandle": null,
            "id": "B85VWeRRu"
        },
        {
            "source": "REt4UEEGD",
            "sourceHandle": "1",
            "target": "UhuSLjA8g",
            "targetHandle": null,
            "id": "wk44u1THD"
        },
        {
            "source": "3zj5puRQ1",
            "sourceHandle": "1",
            "target": "8IU0bhEJs",
            "targetHandle": null,
            "id": "9Q4vfDFmI"
        },
        {
            "source": "8IU0bhEJs",
            "sourceHandle": "1",
            "target": "R0gX9B20d",
            "targetHandle": null,
            "id": "8wXVHwiDC"
        }
    ]
}); };
exports.details = details;
