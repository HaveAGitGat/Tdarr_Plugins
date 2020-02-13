function details() {
    return {
        id: "Tdarr_Plugin_MC93_Migz6OrderStreams",
        Stage: "Pre-processing",
        Name: "Migz-Organize Streams",
        Type: "Streams",
        Operation: "Organize",
        Description: `[TESTING]Organizes streams into Video first, then Audio (2ch, 6ch, 8ch) and finally Subtitles. \n\n`,
        Version: "1.00",
        Link: "",
        Tags: 'pre-processing,ffmpeg,'
    };
}

function plugin(file) {
    var response = {
        processFile: false,
        preset: '',
        container: '.' + file.container,
        handBrakeMode: false,
        FFmpegMode: true,
        infoLog: ''
    };

    var ffmpegCommandInsert = '';
    var videoIdx = 0;
    var audioIdx = 0;
    var audio2Idx = 0;
    var audio6Idx = 0;
    var audio8Idx = 0;
    var subtitleIdx = 0;
    var convert = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
                if (audioIdx != "0" || subtitleIdx != "0") {
                    convert = true;
                    response.infoLog += "☒ Video not first. \n";
                }
                videoIdx++;
            }

            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
                if (subtitleIdx != "0") {
                    convert = true;
                    response.infoLog += "☒ Audio not first. \n";
                }
                audioIdx++;
                if (file.ffProbeData.streams[i].channels == "2") {
                    if (audio6Idx != "0" || audio8Idx != "0") {
                        convert = true;
                        response.infoLog += "☒ Audio 2ch not first. \n";
                    }
                    audio2Idx++;
                }
                if (file.ffProbeData.streams[i].channels == "6") {
                    if (audio8Idx != "0") {
                        convert = true;
                        response.infoLog += "☒ Audio 6ch not second. \n";
                    }
                    audio6Idx++;
                }
                if (file.ffProbeData.streams[i].channels == "8") {
                    audio8Idx++;
                    response.infoLog += "☒ Audio 8ch not last. \n";
                }
            }

            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
                subtitleIdx++;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video" && file.ffProbeData.streams[i].codec_name.toLowerCase() != "mjpeg") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels == "2") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels == "6") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels == "8") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels != "2" && file.ffProbeData.streams[i].channels != "6" && file.ffProbeData.streams[i].channels != "8") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
                ffmpegCommandInsert += `-map 0:${i} `;
            }
        } catch (err) {
            console.error(JSON.stringify(err));
        }
    }

    if (convert == true) {
        response.processFile = true;
        response.preset = `,${ffmpegCommandInsert} -c copy`;
        response.reQueueAfter = true;
        response.infoLog += "☒ Streams are out of order, reorganizing streams. Video, Audio, Subtitles. \n";
    } else {
        response.infoLog += "☑ Streams are in expected order. \n ";
        response.processFile = false;
    }
    return response;

}
module.exports.details = details;
module.exports.plugin = plugin;
