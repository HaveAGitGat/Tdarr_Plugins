"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: "Arithmetic Flow Variable",
    description: "Apply an arithmetic calculation on a Flow Variable.",
    style: {
        borderColor: "green",
    },
    tags: "",
    isStartPlugin: false,
    pType: "",
    requiresVersion: "2.11.01",
    sidebarPosition: 1,
    icon: "",
    inputs: [
        {
            label: "Variable",
            name: "variable",
            type: "string",
            defaultValue: "",
            inputUI: {
                type: "text",
            },
            tooltip: "Variable to set.\n      \n      \\nExample\\n\n      transcodeStage\n      ",
        },
        {
            label: "Operation",
            name: "operation",
            type: "string",
            defaultValue: "",
            inputUI: {
                type: "dropdown",
                options: ["+", "-", "*", "/"],
            },
            tooltip: "Operation to perform on the variable",
        },
        {
            label: "Quantity",
            name: "quantity",
            type: "string",
            defaultValue: "",
            inputUI: {
                type: "text",
            },
            tooltip: "Value to set.\n\n      \\nExample\\n\n      1\n      ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: "Continue to next plugin",
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require("../../../../../methods/lib")();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var variable = String(args.inputs.variable).trim();
    var operation = String(args.inputs.operation).trim();
    var quantity = parseInt(String(args.inputs.quantity).trim(), 10);
    var value = parseInt(args.variables.user[variable], 10);
    args.jobLog("Applying the operation ".concat(operation, " ").concat(quantity, " to ").concat(variable, " of value ").concat(value));
    switch (operation) {
        case "+":
            // eslint-disable-next-line no-param-reassign
            args.variables.user[variable] = String(value + quantity);
            break;
        case "-":
            // eslint-disable-next-line no-param-reassign
            args.variables.user[variable] = String(value - quantity);
            break;
        case "*":
            // eslint-disable-next-line no-param-reassign
            args.variables.user[variable] = String(value * quantity);
            break;
        case "/":
            // eslint-disable-next-line no-param-reassign
            args.variables.user[variable] = String(value / quantity);
            break;
        default:
            throw new Error("The operation ".concat(operation, " is invalid"));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
