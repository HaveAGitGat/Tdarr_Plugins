"use strict";
/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */
Object.defineProperty(exports, "__esModule", { value: true });
exports.details = void 0;
var details = function () { return ({
    "name": "Chapter 5: Go To Flow",
    "description": "Chapter 5: Go To Flow",
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
            "name": "On Flow Error",
            "sourceRepo": "Community",
            "pluginName": "onFlowError",
            "version": "1.0.0",
            "id": "yMWso-uZa",
            "position": {
                "x": 1122.33024332169,
                "y": 226.4434391132305
            }
        },
        {
            "name": "You can use the Go To Flow to go to a different flow. The working file will be passed to that flow and will continue as normal. Double click on the plugin to select the flow you'd like to go to.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "rHV28Kbkv",
            "position": {
                "x": 462.0014512264263,
                "y": 65.78412788449464
            }
        },
        {
            "name": "Go To Flow",
            "sourceRepo": "Community",
            "pluginName": "goToFlow",
            "version": "1.0.0",
            "id": "gOrbropah",
            "position": {
                "x": 572.7308895655424,
                "y": 234.58707695358294
            }
        },
        {
            "name": "By design, if an error happens in a different flow, this 'On Flow Error' will not be called. Across all flows, the 'On Flow Error' plugin will only be called ONCE in the flow that the FIRST error occurred in.  'On Flow Error' plugins in flows before or after the current flow will not be called, even if an error occurs in them at a later time.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "7azuiVML9",
            "position": {
                "x": 1310.2464269220861,
                "y": 134.70796523124582
            }
        },
        {
            "name": "Replace Original File",
            "sourceRepo": "Community",
            "pluginName": "replaceOriginalFile",
            "version": "1.0.0",
            "id": "ELn0kcc-1",
            "position": {
                "x": 778.4079905179452,
                "y": 428.7308825254772
            }
        },
        {
            "name": "Go To Flow",
            "sourceRepo": "Community",
            "pluginName": "goToFlow",
            "version": "1.0.0",
            "id": "j5dOGi9zz",
            "position": {
                "x": 1122.484636036451,
                "y": 397.97542817745443
            }
        },
        {
            "name": "After an error has occured you can even go to a different flow! So you can create a dedicated Error flow and go to it each time an error occurs within any of your flows! Useful for notifications etc.",
            "sourceRepo": "Community",
            "pluginName": "comment",
            "version": "1.0.0",
            "id": "EpMxr2UuE",
            "position": {
                "x": 1205.7688307851763,
                "y": 479.4625484620842
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
            "source": "PpLF-5jxp",
            "sourceHandle": "1",
            "target": "gOrbropah",
            "targetHandle": null,
            "id": "qVWE7SWt2"
        },
        {
            "source": "rHV28Kbkv",
            "sourceHandle": "1",
            "target": "7azuiVML9",
            "targetHandle": null,
            "id": "i0OUf3hAM"
        },
        {
            "source": "PpLF-5jxp",
            "sourceHandle": "2",
            "target": "ELn0kcc-1",
            "targetHandle": null,
            "id": "hTaDcPw24"
        },
        {
            "source": "yMWso-uZa",
            "sourceHandle": "1",
            "target": "j5dOGi9zz",
            "targetHandle": null,
            "id": "6Hrh7vbfW"
        },
        {
            "source": "7azuiVML9",
            "sourceHandle": "1",
            "target": "EpMxr2UuE",
            "targetHandle": null,
            "id": "S_36mCXnL"
        }
    ]
}); };
exports.details = details;
