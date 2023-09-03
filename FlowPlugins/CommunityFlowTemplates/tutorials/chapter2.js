"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 2: The Basics",
    "description": "Chapter 2: The Basics",
    "tags": "",
    "flowPlugins": [
        {
            "name": "Input File",
            "sourceRepo": "Community",
            "pluginName": "inputFile",
            "version": "1.0.0",
            "id": "p2KPpRjnB",
            "position": {
                "x": 414.1115477468154,
                "y": -216.87055056329626
            }
        },
        {
            "name": "1. The flow follows the current 'working file' which we can run checks and take actions on.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "ecLynt2i0",
            "position": {
                "x": 197.4536903827362,
                "y": -265.54506622009336
            }
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "jUig7_cRU",
            "position": {
                "x": 439.02078192278447,
                "y": 122.5624161723565
            }
        },
        {
            "name": "Rename File to have _BigFile",
            "sourceRepo": "Community",
            "pluginName": "renameFile",
            "version": "1.0.0",
            "inputsDB": {
                "fileRename": "${fileName}_BigFile.${container}"
            },
            "id": "2l0pB_oXW",
            "position": {
                "x": 257.94626475719076,
                "y": -21.078426771503985
            }
        },
        {
            "name": "Check File Size",
            "sourceRepo": "Community",
            "pluginName": "checkFileSize",
            "version": "1.0.0",
            "inputsDB": {
                "greaterThan": "1",
                "lessThan": "10000"
            },
            "id": "oDkceuMNL",
            "position": {
                "x": 413.7748155871969,
                "y": -110.90469509295968
            }
        },
        {
            "name": "Each plugin can only have one input handle but many plugins can link to it. Plugins which only check something are typically orange coloured and have 2 or more outputs.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "HTvMe6FSV",
            "position": {
                "x": 34.402701566604065,
                "y": -184.71873806260285
            }
        },
        {
            "name": "Once you make an action on a file, in almost all cases the output is the new file. It will be located in your library cache folder.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "3O3ECJdF-",
            "position": {
                "x": 33.1114649694174,
                "y": 113.19141666640903
            }
        },
        {
            "name": "Typical usage is to replace the original file. So this plugin will replace the original file with the new file.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "qA8hT1mmP",
            "position": {
                "x": 355.2680532661178,
                "y": 199.7482565776084
            }
        },
        {
            "name": "This flow route doesn't change the file, so the Replace Original File plugin won't do anything and the flow will end succesffully.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "1vBp13H02",
            "position": {
                "x": 597.7143477707415,
                "y": -48.77347490679115
            }
        },
        {
            "name": "Double click on a plugin to see what each GREEN output does. Ignore the RED outputs for now.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "s-m8qOhJ7",
            "position": {
                "x": 34.4143205430116,
                "y": -5.644569445757767
            }
        }
    ],
    "flowEdges": [
        {
            "source": "p2KPpRjnB",
            "sourceHandle": "1",
            "target": "oDkceuMNL",
            "targetHandle": null,
            "id": "S8inufSTF"
        },
        {
            "source": "oDkceuMNL",
            "sourceHandle": "1",
            "target": "2l0pB_oXW",
            "targetHandle": null,
            "id": "LFCRv0WUh"
        },
        {
            "source": "2l0pB_oXW",
            "sourceHandle": "1",
            "target": "jUig7_cRU",
            "targetHandle": null,
            "id": "w0K3dKylI"
        },
        {
            "source": "oDkceuMNL",
            "sourceHandle": "2",
            "target": "jUig7_cRU",
            "targetHandle": null,
            "id": "SNdz3urrJ"
        },
        {
            "source": "ecLynt2i0",
            "sourceHandle": "1",
            "target": "HTvMe6FSV",
            "targetHandle": null,
            "id": "7qPHR6V9P"
        },
        {
            "source": "3O3ECJdF-",
            "sourceHandle": "1",
            "target": "qA8hT1mmP",
            "targetHandle": null,
            "id": "GjDmOX_EI"
        },
        {
            "source": "HTvMe6FSV",
            "sourceHandle": "1",
            "target": "s-m8qOhJ7",
            "targetHandle": null,
            "id": "0bPlyyR9Q"
        },
        {
            "source": "s-m8qOhJ7",
            "sourceHandle": "1",
            "target": "3O3ECJdF-",
            "targetHandle": null,
            "id": "Mxxly19vC"
        }
    ]
}); };
exports.details = details;
