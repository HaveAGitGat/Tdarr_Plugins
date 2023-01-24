/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
    id: 'Tdarr_Plugin_00uw_filter_by_filename',
    Stage: 'Pre-processing',
    Name: 'Filter - Filter by filename',
    Type: 'Video',
    Operation: 'Filter',
    Description: `This plugin allows you to filter by filename.`,
    Version: '1.00',
    Tags: 'filter',
    Inputs: [{
        name: 'filter_tag',
        type: 'string',
        defaultValue: '',
        inputUI: {
            type: 'text',
        },
        tooltip: `Enter a comma separated list of words to be processed.\n
        \nExample\n
        trailer, featurette, short\n
        \nExample\n
        -trailer, -featurette, -short\n
        \nExample\n
        KRaLiMaRKo,EPSiLON,CtrlHD\n
        \nExample\n
        AC3 5.1,DTS-HD MA 7.1,AC3 2.0\n`,
    },{
        name: 'filter_skip',
        type: 'boolean',
        defaultValue: 'true',
        inputUI: {
            type: 'dropdown',
            options: [
                'true',
                'false',
            ],
        },
        tooltip: `Choose whether to skip or process files with these words.`
    }],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    // eslint-disable-next-line no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    const response = {
        processFile: false,
        infoLog: '',
    };

    if(inputs.filter_tag === "") {
        response.infoLog += "No tags found for filter, skipping."
        return response;
    }

    var filename = otherArguments.originalLibraryFile.file.toLowerCase();
    var filter_tag = inputs.filter_tag.toLowerCase().split(",");

    for (let i = 0; i < filter_tag.length; i++) {
        let tag = filter_tag[i].trim();
        if(filename.includes(tag)){
            response.infoLog += `Filename matches tag ${tag}`;
            if(inputs.filter_skip) {
                response.infoLog += `, Skipping.\n`;
                return response;
            }
            response.infoLog += `, Processing.\n`;
            response.processFile = true;
            return response;
        }
    }
    
    response.infoLog += `Filename does not match tag ${tag}`;

    if(inputs.filter_skip) {
        response.infoLog += `, Skipping.\n`;
        return response;
    }
    response.infoLog += `, Processing.\n`;
    response.processFile = true;
    return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
