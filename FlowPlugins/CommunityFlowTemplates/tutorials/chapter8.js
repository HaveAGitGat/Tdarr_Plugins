"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 8: Unmapped Nodes",
    "description": "Chapter 8: Unmapped Nodes",
    "tags": "",
    "flowPlugins": [
        {
            "name": "Tags: Worker Type - Mapped Node",
            "sourceRepo": "Community",
            "pluginName": "tagsWorkerType",
            "version": "1.0.0",
            "id": "XDkUDTqXV",
            "position": {
                "x": 618.728206498488,
                "y": 797.6991616678526
            },
            "fpEnabled": true,
            "inputsDB": {
                "requiredNodeTags": "mapped"
            }
        },
        {
            "name": "Tags: Worker Type - Unmapped Node",
            "sourceRepo": "Community",
            "pluginName": "tagsWorkerType",
            "version": "1.0.0",
            "id": "Gm1kh8K5w",
            "position": {
                "x": 487.23666063579026,
                "y": 281.79774016757386
            },
            "fpEnabled": true,
            "inputsDB": {
                "requiredNodeTags": "unmapped"
            }
        },
        {
            "name": "Input File",
            "sourceRepo": "Community",
            "pluginName": "inputFile",
            "version": "1.0.0",
            "id": "pE6rU7gkW",
            "position": {
                "x": 788.5712895368422,
                "y": 45.83576905176477
            },
            "fpEnabled": true
        },
        {
            "name": "Check if hevc",
            "sourceRepo": "Community",
            "pluginName": "checkVideoCodec",
            "version": "1.0.0",
            "id": "91b7IrsEc",
            "position": {
                "x": 788.2207108267078,
                "y": 203.7781028159269
            },
            "fpEnabled": true
        },
        {
            "name": "Start",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandStart",
            "version": "1.0.0",
            "id": "4Swd6qzvc",
            "position": {
                "x": 489.25252076795084,
                "y": 370.51229288382495
            },
            "fpEnabled": true
        },
        {
            "name": "Execute",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandExecute",
            "version": "1.0.0",
            "id": "450g167D8",
            "position": {
                "x": 488.72295602997406,
                "y": 699.5034828311435
            },
            "fpEnabled": true
        },
        {
            "name": "Set Video Encoder",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandSetVideoEncoder",
            "version": "1.0.0",
            "id": "8B_6pRd_U",
            "position": {
                "x": 488.5270135748424,
                "y": 477.83202026423606
            },
            "fpEnabled": true
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "4fkfOyR3l",
            "position": {
                "x": 797.2573001129032,
                "y": 882.7619863463507
            },
            "fpEnabled": true
        },
        {
            "name": "Set Container",
            "sourceRepo": "Community",
            "pluginName": "ffmpegCommandSetContainer",
            "version": "1.0.0",
            "id": "TtKXi3Q7h",
            "position": {
                "x": 488.21110165973323,
                "y": 570.3064821931456
            },
            "fpEnabled": true
        },
        {
            "name": "Tags: Worker Type - Mapped Node",
            "sourceRepo": "Community",
            "pluginName": "tagsWorkerType",
            "version": "1.0.0",
            "id": "7Y_fzVfGm",
            "position": {
                "x": 788.7823658666633,
                "y": 127.15363454994434
            },
            "fpEnabled": true,
            "inputsDB": {
                "requiredNodeTags": "mapped"
            }
        },
        {
            "name": "We will check the file codec on a mapped node. This way bandwidth and time is saved as we don't need to unnecessarily send the whole file to the unmapped node.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "6oOV2PLSr",
            "position": {
                "x": 958.0256289687773,
                "y": 129.22000506355067
            },
            "fpEnabled": true
        },
        {
            "name": "If the codec is not what we want, we'll require the next transcoding steps to run on an unmapped node. The unmapped node will automatically download the file from the server.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "j343VFewY",
            "position": {
                "x": 316.4293037925603,
                "y": 290.6548883625747
            },
            "fpEnabled": true
        },
        {
            "name": "After the transcode, we'll run the original file replacement on a mapped node which has access to the server file system. The mapped node will automatically download the working file from the unmapped node.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "hVhthld87",
            "position": {
                "x": 364.852600714643,
                "y": 769.3367928955186
            },
            "fpEnabled": true
        },
        {
            "name": "Before starting, ensure that in the Node options panel on the Tdarr tab, the mapped node has node tag 'mapped' and the umapped node has node tag 'umapped'.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "9sd__MisF",
            "position": {
                "x": 791.5682800167409,
                "y": -93.09360376469954
            },
            "fpEnabled": true
        },
        {
            "name": "Unmapped nodes are a new node type for Tdarr Pro members on 2.27.01 and above. More info: https://docs.tdarr.io/docs/nodes/nodes#unmapped",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "EILF-RWh2",
            "position": {
                "x": 791.4236829857584,
                "y": -209.23734619332546
            },
            "fpEnabled": true
        }
    ],
    "flowEdges": [
        {
            "source": "4Swd6qzvc",
            "sourceHandle": "1",
            "target": "8B_6pRd_U",
            "targetHandle": null,
            "id": "3Df7Xoy93"
        },
        {
            "source": "8B_6pRd_U",
            "sourceHandle": "1",
            "target": "TtKXi3Q7h",
            "targetHandle": null,
            "id": "epqtLsPuG"
        },
        {
            "source": "TtKXi3Q7h",
            "sourceHandle": "1",
            "target": "450g167D8",
            "targetHandle": null,
            "id": "ljOeP0cAZ"
        },
        {
            "source": "450g167D8",
            "sourceHandle": "1",
            "target": "XDkUDTqXV",
            "targetHandle": null,
            "id": "3412q1wK2"
        },
        {
            "source": "XDkUDTqXV",
            "sourceHandle": "1",
            "target": "4fkfOyR3l",
            "targetHandle": null,
            "id": "3jQP_egvG"
        },
        {
            "source": "pE6rU7gkW",
            "sourceHandle": "1",
            "target": "7Y_fzVfGm",
            "targetHandle": null,
            "id": "XHRuig1Dp"
        },
        {
            "source": "7Y_fzVfGm",
            "sourceHandle": "1",
            "target": "91b7IrsEc",
            "targetHandle": null,
            "id": "_CJ9H5I_X"
        },
        {
            "source": "91b7IrsEc",
            "sourceHandle": "1",
            "target": "4fkfOyR3l",
            "targetHandle": null,
            "id": "2x5mRYwOU"
        },
        {
            "source": "91b7IrsEc",
            "sourceHandle": "2",
            "target": "Gm1kh8K5w",
            "targetHandle": null,
            "id": "8eBsa60Xp"
        },
        {
            "source": "Gm1kh8K5w",
            "sourceHandle": "1",
            "target": "4Swd6qzvc",
            "targetHandle": null,
            "id": "IryDiBCVX"
        },
        {
            "source": "EILF-RWh2",
            "sourceHandle": "1",
            "target": "9sd__MisF",
            "targetHandle": null,
            "id": "IPiPj8zhv"
        }
    ]
}); };
exports.details = details;
