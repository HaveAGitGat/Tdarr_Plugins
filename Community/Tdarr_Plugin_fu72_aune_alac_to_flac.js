function details() {
    return {
        id: "Tdarr_Plugin_fu72_aune_alac_to_flac",
        Stage: "Pre-processing",
        Name: "Aune - ALAC to Flac",
        Type: "Audio",
        Operation: "Transcode",
        Description: `[Contains built-in filter] This plugin transcodes all ALAC-tracks to FLAC. It ignores files that contains video streams and is made for music libraries.\n\n`,
        Version: "1.00",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_fu72_aune_alac_to_flac.js",
        Tags: "pre-processing,ffmpeg,audio only",
    };
}
  
function plugin(file) {
    //Must return this object

    var response = {
        processFile: false,
        preset: "",
        container: "." + file.container,
        handBrakeMode: false,
        FFmpegMode: false,
        reQueueAfter: false,
        infoLog: "",
    };
    
    // Mark video as false
    var video = false;
    // Check every information stream in the file
    for(var i = 0; i < file.ffProbeData.streams.length; i++) {
        // If one stream is video and the framerate is not '0/0', mark file as video
        if(file.ffProbeData.streams[i].codec_type.toLowerCase() == 'video' && file.ffProbeData.streams[i].avg_frame_rate.toLowerCase() !== "0/0") {
            video = true;
            break;
        }
    }

    // If file is video, do not process
    if (video) {
        console.log("File is a video.");
        response.infoLog += "☒File is a video!\n";
        response.processFile = false;

        return response;
    
    // If file is not video, check codec
    } else {
        // Initiate transcode boolean as false
        var transcode = false;

        // Check every stream for 'audio' type and 'alac' codec, and mark transcode as true
        for (var i = 0; i < file.ffProbeData.streams.length; i++) {
                if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
                    if(file.ffProbeData.streams[i].codec_name.toLowerCase() == "alac") {
                        transcode = true;
                        break;
                    }
                }
        }
        
        // Either transcode to FLAC (lossess) or ignore file
        if(transcode) {
            response.processFile = true;
            response.preset = ", -f flac";
            response.container = ".flac";
            response.handBrakeMode = false;
            response.FFmpegMode = true;
            response.reQueueAfter = true;
            response.infoLog += "☒Found ALAC codec!\n";
            return response;
        } else {
            response.processFile = false;
            response.infoLog += "☑No ALAC codec found!\n";
            return response;
        }
    }
}

module.exports.details = details;
module.exports.plugin = plugin;