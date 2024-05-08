/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */

import { IflowTemplate } from '../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = () :IflowTemplate => (
  {
    "name": "Chapter 4: Flow Errors Part 4 - Resetting Flow Errors",
    "description": "Chapter 4: Flow Errors Part 4 - Resetting Flow Errors",
    "tags": "",
    "flowPlugins": [
      {
        "name": "Input File",
        "sourceRepo": "Community",
        "pluginName": "inputFile",
        "version": "1.0.0",
        "id": "kc2oWbzdg",
        "position": {
          "x": 792.9115444209641,
          "y": 72.86840721125132
        }
      },
      {
        "name": "Begin Command",
        "sourceRepo": "Community",
        "pluginName": "ffmpegCommandStart",
        "version": "1.0.0",
        "id": "MttLdH9JH",
        "position": {
          "x": 656.7168106666427,
          "y": 259.68513570736866
        }
      },
      {
        "name": "Execute",
        "sourceRepo": "Community",
        "pluginName": "ffmpegCommandExecute",
        "version": "1.0.0",
        "id": "SUV-PcTXK",
        "position": {
          "x": 656.3361499796371,
          "y": 466.43606780911165
        }
      },
      {
        "name": "Set Video Encoder",
        "sourceRepo": "Community",
        "pluginName": "ffmpegCommandSetVideoEncoder",
        "version": "1.0.0",
        "id": "OZTQfLxQU",
        "position": {
          "x": 657.071898477293,
          "y": 356.04954686544056
        }
      },
      {
        "name": "Send Web Request",
        "sourceRepo": "Community",
        "pluginName": "webRequest",
        "version": "1.0.0",
        "id": "alp4lZYtu",
        "position": {
          "x": 939.7604719407238,
          "y": 380.4448835288041
        }
      },
      {
        "name": "Once a flow error occurs, even if subsequent plugins run successfully, the item will still be moved to the 'Transcode: Error/Cancelled' tab after the final plugin has finished, as would happen if the flow ended here.",
        "sourceRepo": "Community",
        "pluginName": "comment",
        "version": "1.0.0",
        "id": "uyAA1bj79",
        "position": {
          "x": 1114.7604719407238,
          "y": 318.4448835288041
        }
      },
      {
        "name": "Reset Flow Error",
        "sourceRepo": "Community",
        "pluginName": "resetFlowError",
        "version": "1.0.0",
        "id": "_DZqwYTaP",
        "position": {
          "x": 1005.7604719407236,
          "y": 547.4448835288041
        }
      },
      {
        "name": "HandBrake Custom Arguments",
        "sourceRepo": "Community",
        "pluginName": "handbrakeCustomArguments",
        "version": "1.0.0",
        "id": "pX08BTxw7",
        "position": {
          "x": 1126.7604719407238,
          "y": 697.4448835288041
        }
      },
      {
        "name": "Replace Original File",
        "sourceRepo": "Community",
        "pluginName": "replaceOriginalFile",
        "version": "1.0.0",
        "id": "0QGXt-4Zi",
        "position": {
          "x": 855.7604719407237,
          "y": 853.4448835288041
        }
      },
      {
        "name": "Use this plugin to reset the flow error status. You can then attempt a new way of processing the file",
        "sourceRepo": "Community",
        "pluginName": "comment",
        "version": "1.0.0",
        "id": "aWlDgeStq",
        "position": {
          "x": 1176.7604719407238,
          "y": 531.4448835288041
        }
      }
    ],
    "flowEdges": [
      {
        "source": "kc2oWbzdg",
        "sourceHandle": "1",
        "target": "MttLdH9JH",
        "targetHandle": null,
        "id": "T43cHyOAu"
      },
      {
        "source": "MttLdH9JH",
        "sourceHandle": "1",
        "target": "OZTQfLxQU",
        "targetHandle": null,
        "id": "jqX_8_fKY"
      },
      {
        "source": "OZTQfLxQU",
        "sourceHandle": "1",
        "target": "SUV-PcTXK",
        "targetHandle": null,
        "id": "-1tj4OiNV"
      },
      {
        "source": "OZTQfLxQU",
        "sourceHandle": "err1",
        "target": "alp4lZYtu",
        "targetHandle": null,
        "id": "LOQaBxuai"
      },
      {
        "source": "pX08BTxw7",
        "sourceHandle": "1",
        "target": "0QGXt-4Zi",
        "targetHandle": null,
        "id": "VMBnPqvzU"
      },
      {
        "source": "SUV-PcTXK",
        "sourceHandle": "1",
        "target": "0QGXt-4Zi",
        "targetHandle": null,
        "id": "wsDY8MYki"
      },
      {
        "source": "alp4lZYtu",
        "sourceHandle": "1",
        "target": "_DZqwYTaP",
        "targetHandle": null,
        "id": "g9tDFsL5p"
      },
      {
        "source": "_DZqwYTaP",
        "sourceHandle": "1",
        "target": "pX08BTxw7",
        "targetHandle": null,
        "id": "YwFpa-_YC"
      }
    ]
  }
);

export {
  details,
};
