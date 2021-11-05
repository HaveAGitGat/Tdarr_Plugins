module.exports.details = function details() {
    return {
        id: 'Tdarr_Plugin_jeons001_Downmix_to_stereo_and_apply_DRC',
        Stage: 'Pre-processing',
        Name: 'Downmix & Dynamic range compression',
        Type: 'Audio',
        Operation: 'Transcode',
        Description: 'Downmixes surround to stereo AND applies dynamic range compression. Files already in stereo will be skipped \n\n',
        Version: '1.00',
        Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_jeons001_Downmix_to_stereo_and_apply_DRC.js',
        Tags: 'ffmpeg',

        Inputs: [],
    };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
    const response = {
        processFile: false,
        preset: '',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '',
        file,
        removeFromDB: false,
        updateDB: false,
        container: `.${file.container}`
    };

    for (let index = 0; index < file.ffProbeData.streams.length; index++) {
        const stream = file.ffProbeData.streams[index];
        if (stream.codec_type === "audio" && stream.channels && stream.channels > 3) {
            response.preset = '-sn <io> -vcodec copy -scodec copy -acodec aac -af "dynaudnorm,pan=stereo|FL < 1.0*FL + 0.707*FC + 0.707*BL|FR < 1.0*FR + 0.707*FC + 0.707*BR"';
            response.processFile = true;
            response.infoLog = "Didn't find file to be in stereo... Downmixing and applying DRC!";
            return response;
        }

    }

    return response;
};