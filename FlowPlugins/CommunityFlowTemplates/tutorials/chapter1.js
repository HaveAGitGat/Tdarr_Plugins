"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 1: Getting Started",
    "description": "Chapter 1: Getting Started",
    "tags": "",
    "flowPlugins": [
        {
            "name": "Input File",
            "sourceRepo": "Community",
            "pluginName": "inputFile",
            "version": "1.0.0",
            "id": "_YTuyCZg3",
            "position": {
                "x": 644.7725474007168,
                "y": -59.78556037646227
            }
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "RQzydYbay",
            "position": {
                "x": 644.8785689715966,
                "y": 285.63446752627516
            }
        },
        {
            "name": "1. Hello and welcome to Tdarr! This is a comment plugin. It doesn't do anything except help explain what's going on in a flow! You can place them anywhere and even link them together.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "df5cejfZP",
            "position": {
                "x": 774.8672137292031,
                "y": -254.93856109034408
            }
        },
        {
            "name": "2. See! This comment won't do anything. The file from the previous plugin will be passed straight to the next plugin",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "30CajwYP2",
            "position": {
                "x": 644.6915712919753,
                "y": 135.90533672888392
            }
        },
        {
            "name": "3. This here is an input file plugin and it's where every flow starts. You can only have ONE of these per flow.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "734dA76hg",
            "position": {
                "x": 444.5704060029551,
                "y": -3.4693570957774114
            }
        },
        {
            "name": "4. That's it for this one, see you in the next chapter!",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "rkYonbPgX",
            "position": {
                "x": 443.9627448274695,
                "y": 332.6480632642012
            }
        }
    ],
    "flowEdges": [
        {
            "source": "_YTuyCZg3",
            "sourceHandle": "1",
            "target": "30CajwYP2",
            "targetHandle": null,
            "id": "HUBIf10ny"
        },
        {
            "source": "30CajwYP2",
            "sourceHandle": "1",
            "target": "RQzydYbay",
            "targetHandle": null,
            "id": "Gd19X19w1"
        },
        {
            "source": "df5cejfZP",
            "sourceHandle": "1",
            "target": "30CajwYP2",
            "targetHandle": null,
            "id": "0EA92XgvP"
        },
        {
            "source": "734dA76hg",
            "sourceHandle": "1",
            "target": "rkYonbPgX",
            "targetHandle": null,
            "id": "lXbYouTsz"
        }
    ]
}); };
exports.details = details;
