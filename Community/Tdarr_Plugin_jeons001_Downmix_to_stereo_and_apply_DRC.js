module.exports.details = function details() {
    return {
        id: 'Tdarr_Plugin_jeons001_Downmix_to_stereo_and_apply_DRC',
        Stage: 'Pre-processing',
        Name: 'Downmix & Dynamic range compression',
        Type: 'Audio',
        Operation: 'Transcode',
        Description: 'Downmixes surround to AAC stereo AND applies dynamic range compression. Files already in stereo or with multiple audio tracks will be skipped \n\n',
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

    let audioStreams = 0;
    let surroundTrackFound = false;

    for (let index = 0; index < file.ffProbeData.streams.length; index++) {
        const stream = file.ffProbeData.streams[index];
        if (stream.codec_type === "audio") {
            audioStreams++;
        }

        if (stream.codec_type === "audio" && stream.channels && stream.channels > 3) {
            surroundTrackFound = true;
        }
    }

    if (audioStreams > 1) {
        response.infoLog = "File has more than 1 audio track - not processing";
        return response;
    }

    if (!surroundTrackFound) {
        response.infoLog = "File has no surround tracks - not processing";
        return response;
    }

    if (surroundTrackFound && audioStreams === 1) {
        response.preset = '-sn <io> -vcodec copy -scodec copy -acodec aac -filter:a "dynaudnorm,pan=stereo|FL < 1.0*FL + 0.707*FC + 0.707*BL|FR < 1.0*FR + 0.707*FC + 0.707*BR"';
        response.processFile = true;
        response.infoLog = "File matches requirements for processing. Downmixing and applying DRC!";
        return response;
    }

    return response;
};