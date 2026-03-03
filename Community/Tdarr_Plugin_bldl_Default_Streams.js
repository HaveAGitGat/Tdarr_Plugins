/* eslint-disable */
const details = () => {
    return {
        id: 'Tdarr_Plugin_bldl_Default_Streams',
        Stage: 'Pre-processing',
        Name: 'Set first Audio and Subtitles Streams as default',
        Type: 'Audio',
        Operation: 'Transcode',
        Description: `This plugin will set the first audio and subtitle stream to be the default one.`,
        Version: '1.0',
        Tags: 'ffmpeg,configurable',

        Inputs: [
            {
                name: 'default_audio',
                type: 'boolean',
                defaultValue: true,
                inputUI: {
                    type: 'dropdown',
                    options: ['false', 'true'],
                },
                tooltip: `Make first audio stream the default one.`,
            },
            {
                name: 'default_subtitle',
                type: 'boolean',
                defaultValue: true,
                inputUI: {
                    type: 'dropdown',
                    options: ['false', 'true'],
                },
                tooltip: `Make first subtitle stream the default one.`,
            },
        ],
    };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    var response = {
        processFile: false,
        preset: '',
        container: '.' + file.container,
        handBrakeMode: false,
        FFmpegMode: true,
        infoLog: '',
    };

    var shouldProcess = false;
    var ffmpegCommandInsert = '';

    const default_stream = (stream_type) => {
        const streams = file.ffProbeData.streams.filter((stream) => stream.codec_type.toLowerCase() === stream_type);
        const n_defaults = streams.filter((stream) => stream.disposition.default === 1).length;
        if (streams.length > 0 && (n_defaults > 1 || streams[0].disposition.default === 0)) {
            shouldProcess = true;
            if (n_defaults > 1) {
                response.infoLog += `☒ Multiple ${stream_type} streams detected. \n`;
            }
            if (streams[0].disposition.default === 0) {
                response.infoLog += `☒ First ${stream_type} stream is not set to default. value set: \n`;
            }
            for (let i = 0; i < streams.length; i++) {
                const disposition = i === 0 ? 'default' : '0';
                ffmpegCommandInsert += `-disposition:${streams[i].index} ${disposition} `;
            }
        } else {
            response.infoLog += `☒ ${stream_type} stream is already set to default. Skipping. \n`;
        }
    };

    if (inputs.default_audio) {
        default_stream('audio');
    }

    if (inputs.default_subtitle) {
        default_stream('subtitle');
    }

    if (shouldProcess) {
        response.processFile = true;
        response.reQueueAfter = true;
        response.preset = `,-map 0 -c copy ${ffmpegCommandInsert}`;
        response.infoLog += '☒ Setting streams to default. Remove default from all other streams. \n';
    } else {
        response.infoLog += '☒ All streams already set to default. Skipping execution. \n';
        response.processFile = false;
    }
    return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
