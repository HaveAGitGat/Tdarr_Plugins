module.exports.dependencies = [
    'touch',
];

// tdarrSkipTest
const details = () => ({
    id: 'Tdarr_Plugin_AC_Keep_Dates',
    Stage: 'Post-processing',
    Name: 'Keep original file time.',
    Type: 'Video',
    Operation: 'Transcode',
    Description: 'This plugin copies the original file datetime to the new transcoded file. This plugin should be last one to run.',
    Version: '1.0',
    Tags: 'action,post-processing,dates,date',
    Inputs: [],
});

const plugin = async (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    inputs = lib.loadDefaultValues(inputs, details);
    const touch = require('touch');
    const response = {
        processFile: false,
        infoLog: '',
    };

    try {
        if (true === !('originalLibraryFile' in otherArguments)) {
            response.infoLog += `☒ Could not access original file data possbily the file is new and didn't get transcoded.\n`;
            response.infoLog += `File: ${JSON.stringify(file)}\n`;
            response.infoLog += `otherArguments: ${JSON.stringify(otherArguments)}\n`;
            response.infoLog += `librarySettings: ${JSON.stringify(librarySettings)}\n`;
            return response;
        }

        const old_cTime = new Date(otherArguments.originalLibraryFile.statSync.ctimeMs);
        const old_mTime = new Date(otherArguments.originalLibraryFile.statSync.mtimeMs);
        const old_time = old_cTime > old_mTime ? old_mTime : old_cTime;

        const new_cTime = new Date(file.statSync.ctimeMs);
        const new_mTime = new Date(file.statSync.mtimeMs);
        const new_time = new_mTime > new_cTime ? new_cTime : new_mTime

        if (old_time >= new_time) {
            response.infoLog += '☒ Not updating File Timestamp orginal file time is older or the same as new one.\n';
            response.infoLog += `Orignal File Date: ${old_time.toString()}\n`;
            response.infoLog += `New File Date: ${new_time.toString()}\n`;
            return response;
        }

        response.infoLog += '☑ Updating File Timestamp:\n';
        response.infoLog += `☑ From: ${new_time.toString()}\n`;
        response.infoLog += `☑ To: ${old_time.toString()}\n`;

        touch.sync(file._id, {
            time: old_time,
            force: true
        });

        response.infoLog += `☑ File timestamps updated to match original file.\n`;
    } catch (err) {
        response.infoLog += `☒ ERROR: ${err.message}\n`;
    }

    return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
