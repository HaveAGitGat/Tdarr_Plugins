/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */

import { IflowTemplate } from '../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = () :IflowTemplate => ({
  "name": "Chapter 7: Using an Output Folder",
  "description": "Chapter 7: Using an Output Folder",
  "tags": "",
  "flowPlugins": [
    {
      "name": "Input File",
      "sourceRepo": "Community",
      "pluginName": "inputFile",
      "version": "1.0.0",
      "id": "y4lqcdrho",
      "position": {
        "x": 657.6098846576496,
        "y": 83.73457282843094
      }
    },
    {
      "name": "Check Video Codec",
      "sourceRepo": "Community",
      "pluginName": "checkVideoCodec",
      "version": "1.0.0",
      "id": "x4UqtuCK9",
      "position": {
        "x": 546.5579603766718,
        "y": 179.82684381124744
      }
    },
    {
      "name": "Begin Command",
      "sourceRepo": "Community",
      "pluginName": "ffmpegCommandStart",
      "version": "1.0.0",
      "id": "6a0HyfVUa",
      "position": {
        "x": 394.21161179985006,
        "y": 264.2702484509714
      }
    },
    {
      "name": "Execute",
      "sourceRepo": "Community",
      "pluginName": "ffmpegCommandExecute",
      "version": "1.0.0",
      "id": "OBbLCZ8SO",
      "position": {
        "x": 395.9527129264425,
        "y": 467.9790802622644
      }
    },
    {
      "name": "Set Video Encoder",
      "sourceRepo": "Community",
      "pluginName": "ffmpegCommandSetVideoEncoder",
      "version": "1.0.0",
      "id": "nvhiecc42",
      "position": {
        "x": 395.95271292644225,
        "y": 360.03081041354505
      }
    },
    {
      "name": "Move To Directory",
      "sourceRepo": "Community",
      "pluginName": "moveToDirectory",
      "version": "2.0.0",
      "id": "8ffv7PWIl",
      "position": {
        "x": 586.6032862882935,
        "y": 587.2445074338334
      },
      "inputsDB": {
        "outputDirectory": "/example"
      }
    },
    {
      "name": "By default, the final working file in the flow is what will be kept in the Tdarr database and will appear in the 'Transcode: Success/Not required' table. If the flow were to end here, the new file in the output folder would be kept in the Tdarr database.",
      "sourceRepo": "Community",
      "pluginName": "comment",
      "version": "1.0.0",
      "id": "XJEBW_sGy",
      "position": {
        "x": 792.5819966148043,
        "y": 513.4182522751619
      }
    },
    {
      "name": "Set Original File",
      "sourceRepo": "Community",
      "pluginName": "setOriginalFile",
      "version": "1.0.0",
      "id": "X4K2UoPuU",
      "position": {
        "x": 587.1019377136648,
        "y": 787.596766284271
      }
    },
    {
      "name": "To have the original file be kept in the Tdarr database, use the 'Set Original File' plugin which will set the working file to the original file.",
      "sourceRepo": "Community",
      "pluginName": "comment",
      "version": "1.0.0",
      "id": "yXP0EZrMk",
      "position": {
        "x": 777.1019377136646,
        "y": 787.596766284271
      }
    }
  ],
  "flowEdges": [
    {
      "source": "y4lqcdrho",
      "sourceHandle": "1",
      "target": "x4UqtuCK9",
      "targetHandle": null,
      "id": "c6kYE6bDM"
    },
    {
      "source": "x4UqtuCK9",
      "sourceHandle": "1",
      "target": "8ffv7PWIl",
      "targetHandle": null,
      "id": "odwp-30JQ"
    },
    {
      "source": "x4UqtuCK9",
      "sourceHandle": "2",
      "target": "6a0HyfVUa",
      "targetHandle": null,
      "id": "87bCwwur4"
    },
    {
      "source": "6a0HyfVUa",
      "sourceHandle": "1",
      "target": "nvhiecc42",
      "targetHandle": null,
      "id": "kYgiFcdHk"
    },
    {
      "source": "nvhiecc42",
      "sourceHandle": "1",
      "target": "OBbLCZ8SO",
      "targetHandle": null,
      "id": "guA5aTucK"
    },
    {
      "source": "OBbLCZ8SO",
      "sourceHandle": "1",
      "target": "8ffv7PWIl",
      "targetHandle": null,
      "id": "PgL3EQtsQ"
    },
    {
      "source": "8ffv7PWIl",
      "sourceHandle": "1",
      "target": "X4K2UoPuU",
      "targetHandle": null,
      "id": "JX7tzmso3"
    }
  ]
});

export {
  details,
};
