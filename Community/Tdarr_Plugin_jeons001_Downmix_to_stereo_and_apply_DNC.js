// List any npm dependencies which the plugin needs, they will be auto installed when the plugin runs:
module.exports.dependencies = [
    'import-fresh',
];

module.exports.details = function details() {
    return {
        id: 'Tdarr_Plugin_jeons001_Downmix_to_stereo_and_apply_DNC',
        Stage: 'Pre-processing', 
        Name: 'Downmix & Dynamic range compression',
        Type: 'Video',
        Operation: 'Transcode',
        Description: 'Downmixes surround to stereo AND applies dynamic range compression. Files already in stereo will be skipped \n\n',
        Version: '1.00',
        Link: 'https://github.com/HaveAGitGat/Tdarr_Plugin_aaaa_Pre_Proc_Example',
        Tags: 'ffmpeg', 

        Inputs: [
            
        ],
    };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
    const importFresh = require('import-fresh');

    const response = {
        processFile: false, 
        preset: '', 
        handBrakeMode: false, 
        FFmpegMode: false,
        reQueueAfter: true,
        infoLog: '', 
        file,
        removeFromDB: false, 
        updateDB: false, 
    };

    response.container = `.${file.container}`;
    response.FFmpegMode = true;

    for (let index = 0; index < file.ffProbeData.streams.length; index++) {
        const stream = file.ffProbeData.streams[index];
        if (stream.codec_type === "audio" && stream.channels && stream.channels > 3) {
            console.log('stream.channels isXX ' + stream.channels);
            response.preset = '-sn <io> -vcodec copy -scodec copy -acodec aac -af "dynaudnorm,pan=stereo|FL < 1.0*FL + 0.707*FC + 0.707*BL|FR < 1.0*FR + 0.707*FC + 0.707*BR"';
            response.processFile = true;
            response.infoLog = "Didn't find file to be in stereo... Downmixing and applying DRC!";
            return response;
        }

    }

    return response;
};

module.exports.onTranscodeSuccess = function onTranscodeSuccess(
    file,
    librarySettings,
    inputs,
) {
    console.log(
        'Downmix and DNC success!',
    );

    const response = {
        file,
        removeFromDB: false,
        updateDB: false,
    };

    return response;
};

module.exports.onTranscodeError = function onTranscodeError(
    file,
    librarySettings,
    inputs,
) {
    console.log('Downmix and DNC failed');

    const response = {
        file,
        removeFromDB: false,
        updateDB: false,
    };

    return response;
};