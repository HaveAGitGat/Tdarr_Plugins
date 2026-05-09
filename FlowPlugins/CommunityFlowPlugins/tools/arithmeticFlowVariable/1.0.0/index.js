"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var details = function () { return ({
    name: 'Arithmetic Flow Variable',
    description: 'Apply an arithmetic calculation on a flow variable.',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: 1,
    icon: 'faCalculator',
    inputs: [
        {
            label: 'Variable',
            name: 'variable',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the name of an existing flow variable containing a numeric value to perform arithmetic on.\n      The variable must exist and contain a valid number.\n\n      \\nExample\\n\n      {{{args.variables.user.transcodeStage}}}\n      ",
        },
        {
            label: 'Operation',
            name: 'operation',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'dropdown',
                options: ['+', '-', '*', '/'],
            },
            tooltip: "Select the arithmetic operation to apply to the variable.\n\n      + : Add the quantity to the variable\n      - : Subtract the quantity from the variable\n      * : Multiply the variable by the quantity\n      / : Divide the variable by the quantity (quantity cannot be 0)",
        },
        {
            label: 'Quantity',
            name: 'quantity',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the numeric value to use in the arithmetic operation.\n      Must be a valid number. Cannot be 0 when using division.\n\n      \\nExample\\n\n      1\n\n      \\nExample\\n\n      5.5\n\n      \\nExample\\n\n      -10\n      ",
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    // Get original plugin inputs from thisPlugin.inputsDB
    var inputsOriginal = args.thisPlugin.inputsDB;
    // Extract variable path from the original template string
    var variableTemplate = String(inputsOriginal === null || inputsOriginal === void 0 ? void 0 : inputsOriginal.variable).trim();
    var variableMatch = variableTemplate.match(/\{\{\{(?:args|baseArgs)\.([\w.]+)\}\}\}/);
    if (!variableMatch) {
        throw new Error("Variable template \"".concat(variableTemplate, "\" is invalid. Expected format: {{{args.path.to.variable}}}"));
    }
    var variablePath = variableMatch[1]; // e.g., "variables.user.existingVar"
    var pathParts = variablePath.split('.');
    var variable = String(args.inputs.variable).trim();
    var operation = String(args.inputs.operation).trim();
    var quantity = parseFloat(String(args.inputs.quantity).trim());
    var value = parseFloat(variable);
    // Validate numeric values
    if (Number.isNaN(quantity)) {
        throw new Error("Quantity \"".concat(args.inputs.quantity, "\" is not a valid number"));
    }
    if (Number.isNaN(value)) {
        throw new Error("Variable \"".concat(variableTemplate, "\" is not a valid number"));
    }
    // Check for division by zero
    if (operation === '/' && quantity === 0) {
        throw new Error('Division by zero is not allowed');
    }
    args.jobLog("Applying the operation ".concat(operation, " ").concat(quantity, " to ").concat(variableTemplate, " of value ").concat(value));
    // Helper to set value at dynamic path
    var setValueAtPath = function (obj, path, val) {
        var current = obj;
        for (var i = 0; i < path.length - 1; i += 1) {
            // @ts-expect-error dynamic path
            if (current[path[i]] === undefined || current[path[i]] === null) {
                throw new Error("Path \"".concat(path.slice(0, i + 1).join('.'), "\" does not exist in args object"));
            }
            // @ts-expect-error dynamic path
            current = current[path[i]];
        }
        // @ts-expect-error dynamic path
        current[path[path.length - 1]] = val; // eslint-disable-line no-param-reassign
    };
    var result;
    switch (operation) {
        case '+':
            result = value + quantity;
            setValueAtPath(args, pathParts, String(result));
            break;
        case '-':
            result = value - quantity;
            setValueAtPath(args, pathParts, String(result));
            break;
        case '*':
            result = value * quantity;
            setValueAtPath(args, pathParts, String(result));
            break;
        case '/':
            result = value / quantity;
            setValueAtPath(args, pathParts, String(result));
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
