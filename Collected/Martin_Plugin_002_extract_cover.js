const details = () => ({
    id: 'Martin_Plugin_002_extract_cover',
    Stage: 'Pre-processing',
    Name: 'Extract cover image if existing',
    Type: 'Video',
    Operation: 'Extraction',
    Description: 'If it exist, the cover image is extracted from the file and saved as a separate file. The video file is untouched.',
    Version: '1.0',
    Tags: 'pre-processing,configurable',
    Inputs: [
        {
            name: 'storage_path',
            type: 'string',
            inputUI: {
                type: 'text',
            },
            tooltip: 'The path to the storage folder',
        },
    ],
});


const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    inputs = lib.loadDefaultValues(inputs, details);

    const response = {
        file,
        removeFromDB: false,
        updateDB: false,
        processFile: false,
        infoLog: '',
    };

    const fs = require('fs');
    const path = require('path');
    const fileName = path.parse(otherArguments.originalLibraryFile.meta.FileName).name;
    const coverImagePath = path.join(inputs.storage_path, fileName + '.jpg');
    if (fs.existsSync(coverImagePath)) {
        response.infoLog += 'Cover image already extracted. Skipping.\n';
        return response;
    }


    for (const stream of file.ffProbeData.streams) {
        if (stream.disposition.attached_pic == 1) {
            response.processFile = true;
            response.preset = `<io>  -map 0:v -map -0:V -c copy "${coverImagePath}" -map 0 -c copy `;
            response.container = `.` + file.container;
            response.handBrakeMode = false;
            response.FFmpegMode = true;
            response.reQueueAfter = true;
            response.infoLog += 'Found cover image in file. Extracting it.\n';
            return response;
        }
    }

    response.infoLog += 'No cover image found in file. Skipping.\n';

    return response;
};


module.exports.details = details;
module.exports.plugin = plugin;