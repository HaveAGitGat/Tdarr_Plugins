const fs = require('fs');
const execSync = require('child_process').execSync;

function details() {
    return {
        id: "Tdarr_Plugin_e5c3_CnT_Remove_Letterbox",
        Stage: "Pre-processing",
        Name: "Remove letterbox",
        Type: "Video",
        Operation:"Transcode",
        Description: `Uses iiDrakeii's filter, and crops video files when letterboxing is detected.\nThis uses the FFMPEG NVENC transcoding(hw).\nIf a file is 4K it will be scaled down to 1080p.\nNow with user definable bitrates!(since 1.104 beta)\nCreated by @control#0405`,
        Version: "1.4",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_e5c3_CnT_Remove_Letterbox.js",
        Inputs: [
            {
            name: 'bitrate',
            tooltip: `Desired bitrate for a 1080p video, minimum transcode size is based of this too!\\n 720p will be half of 1080p, 480p will be half of 720p.\\nThe default is '3000', this value is based of movies.\\nI would suggest 1500-2000 for series.\\nExample:\\n3000`
            },
            {
            name: 'container',
            tooltip: `Enter the output container of the new file.\\n Default: .mkv\\nExample:\\n.mkv`
            },
        ],
        Tags:'pre-processing,video only,ffmpeg,configurable',
    }
}

function plugin(file, librarySettings, inputs, otherArguments) {
    if (inputs.bitrate == "" || inputs.special == 'undefined') {
        var min_bitrate = 6600;
        var avg_rate = 3000;
        var max_rate = 6000;
    } else {
        var min_bitrate = inputs.bitrate*2.2;
        var avg_rate = inputs.bitrate;
        var max_rate = inputs.bitrate*2;
    }

    var source = file.meta.SourceFile; //source file
    var stats = fs.statSync(source);
    var size = stats["size"]/1000000000;
        size = size.toFixed(2);
    var decoder = decoder_string(file); //decoder, before the input
    var encoder = encoder_string_full(file, highres(file), crop_decider(file, create_crop_values(file).crop_height).crop, avg_rate, max_rate); //encoder 
    var process = 0; //decides if it should be processed

    //default values that will be returned
    var response = {
        processFile: false,
        preset: '',
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: ''
    }

    if (inputs.container !== undefined) {
        response.container = inputs.container;
        console.log(`Changed container to: ` + inputs.container);
    }
    
    var returns = {
        create_crop: create_crop_values(file),
        crop: crop_decider(file, create_crop_values(file).crop_height),
        size: size_check(file, min_bitrate)
    }

    var log = {
        size: returns.size.log,
        hevc: ``,
        resolution: ``,
        crop: returns.crop.log,
        createcrop: returns.create_crop.log
    }

    //filters
    if (size_check(file, min_bitrate).size == 1) {
        if (hevc(file) == 1) {
            log.hevc = `☑ - Video is not HEVC \n`;
            process = 1;
        } else {
            log.hevc += "☒ - File is already in HEVC \n"
        }

        if (highres(file) == 1) {
            process = 1;
            log.resolution += `☑ - Resolution > 1080p.\n File will be transcoded to 1080p \n`;
        } else {
            log.resolution += `☒ - Resolution <= 1080p \n`;
        }

        if (crop_decider(file, create_crop_values(file).crop_height).crop != "0") {
            process = 1;
        }
    }

    response.infoLog += log.createcrop + 
                        log.crop + 
                        log.resolution + 
                        log.size + 
                        log.hevc;
    response.preset = `${decoder}, -map 0:v:0 -map 0:a -map 0:s? ${encoder}`

    //change response
    if (process == 1) {
        response.processFile = true;
        response.infoLog += `File will be processed\n`;
    } else if (file.forceProcessing === true) {
        response.processFile = true;
        response.infoLog += `Force processing!\n`;
    } else if (response.container !== `.` + file.container) {
        response.infoLog += `Container is not correct\nMuxing to ${response.container}!\n`;
        response.preset = `${decoder}, -c copy`;
        response.processFile = true;
    } else {
        response.infoLog += `Processing not necessary\n`;
    }
    
    return response;
}

function highres(file) {
    //if file is larger than 1080p it should be transcoded
    if (file.meta.ImageWidth > 1920) {
        return 1;
    } else {
        return 0;
    }
}

function create_crop_values(file) {
    var source = file.meta.SourceFile; //source file
    var dir = file.meta.Directory; //source directory
    var sourcename = file.meta.FileName.substring(0, file.meta.FileName.lastIndexOf(".")); //filename without extension
    var cropfile = `${dir}/${sourcename}.txt`; //location and name of the crop file
    var returns = {
        crop_height: 0, //return value for this function, required for crop_decider
        log: ``
    }

    //create crop value
    if (!fs.existsSync(`${cropfile}`)) {
        returns.log += `Creating crop values...\n`;
        execSync(otherArguments.ffmpegPath + ` -ss 300 -i \"${source}\" -frames:v 240 -vf cropdetect -f null - 2>&1 | awk \'/crop/ { print $NF }\' | tail -240 > \"${cropfile}\"`);
        execSync(otherArguments.ffmpegPath + ` -ss 1200 -i \"${source}\" -frames:v 240 -vf cropdetect -f null - 2>&1 | awk \'/crop/ { print $NF }\' | tail -240 >> \"${cropfile}\"`);
    } else {
        returns.log += `Crop values already exist\n`;
    }
    
    //get data from copvalue.txt
    var data = fs.readFileSync(`${cropfile}`).toString().split("\n");  //full data from cropvalue.txt
    
    //get height of the supposed cropped video
    //var crop_height = parseInt(data[0].substring(10, 14));
    for (var c = 0; c < data.length; c++) {
        if (parseInt(data[c].substring(10, 14)) > returns.crop_height) {
            returns.crop_height = parseInt(data[c].substring(10, 14));
            returns.log += `New cropheight: ${parseInt(data[c].substring(10, 14))}\n`; 
        }
    }
    return returns;
}

function hevc(file) {
    //check if the file is already hevc, it will not be transcoded if true
    if (file.ffProbeData.streams[0].codec_name) {
        if ("hevc".toLowerCase().includes(file.ffProbeData.streams[0].codec_name.toLowerCase())) {
            return 0;
        } else {
            return 1;
        }
    }
}

function decoder_string(file) {
    var decoder = ``; //decoder, before the input

    //use the correct decoder
    if (file.video_codec_name == 'h263') {
        decoder = `-c:v h263_cuvid`
    }
    else if (file.video_codec_name == 'h264') {
        if (file.ffProbeData.streams[0].profile != 'High 10') { //Remove HW Decoding for High 10 Profile
            decoder = `-c:v h264_cuvid`
        }
    }
    else if (file.video_codec_name == 'mjpeg') {
       decoder = `c:v mjpeg_cuvid`
    }
    else if (file.video_codec_name == 'mpeg1') {
        decoder = `-c:v mpeg1_cuvid`
    }
    else if (file.video_codec_name == 'mpeg2') {
        decoder = `-c:v mpeg2_cuvid`
    }
    else if (file.video_codec_name == 'vc1') {
        decoder = `-c:v vc1_cuvid`
    }
    else if (file.video_codec_name == 'vp8') {
        decoder = `-c:v vp8_cuvid`
    }
    else if (file.video_codec_name == 'vp9') {
        decoder = `-c:v vp9_cuvid`
    }
    
    return decoder;
}

function crop_decider(file, crop_height) {
    var returns = {
        crop: `0`, //sets the crop filter
        log: ``,
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        if (file.ffProbeData.streams[i].width !== undefined) {
            var imageWidth = file.ffProbeData.streams[i].width;
            var imageHeight = file.ffProbeData.streams[i].height;
            break;
        }    
    }
    
    var min_crop = parseInt(imageHeight*.98); //if the crop value is larger than this the file won't be cropped
    
    //tree for resolution : quality
    if (imageWidth >= 1300) { //file will be encoded if the resolution is 1080p, or greater (it will be downscaled)
        //crop only if it is a larger crop than 1%;
        if (crop_height < min_crop) {
            var crop_hdis = parseInt((imageHeight-crop_height)/2);
            if (crop_height >= 790) {
                returns.crop = `-filter:0 crop=${imageWidth}:${crop_height}:0:${crop_hdis}`;
                returns.log += `☑ - crop is larger than 1%\n`;
            }
        } else {
            returns.log += `☒ - Crop is not necessary\n`;
        }
    } else if(imageWidth < 1300 && file.meta.ImageWidth >= 770) { 
        //crop only if it is a larger crop than 1%;
        if (crop_height < min_crop) {
            var crop_hdis = parseInt((imageHeight-crop_height)/2);
            if (crop_height >= 530) {
                returns.crop = `-filter:0 crop=${imageWidth}:${crop_height}:0:${crop_hdis}`;
                returns.log += `☑ - crop is larger than 1%\n`;
            }
        } else {
            returns.log += `☒ - Crop is not necessary\n`;
        }
    } else if(imageWidth < 770) { //file won't be cropped at this resolution
        returns.log += `No crop: Resolution < 720p\n`;
    }

    return returns;
}

function size_check(file, min_bitrate) {
    var duration = file.meta.Duration; //duration of video in seconds
    var source = file.meta.SourceFile; //source file
    var stats = fs.statSync(source);
    var size = stats["size"]/1000000000;
        size = size.toFixed(2);
    var returns = {
        size: 0,
        log: ``
    } 

    //tree for resolution : quality
    if (file.video_resolution === "1080p" || file.video_resolution === "4KUHD") { //file will be encoded if the resolution is 1080p, or greater (it will be downscaled)
        var min_transcode_size = (min_bitrate * duration * 0.125)/1000000; //minimum size in GB for transcode
            min_transcode_size = min_transcode_size.toFixed(2);

        //check if file is large enough for transcode
        if (size >= (min_bitrate * duration * 0.125)/1000000) {
            returns.log += `☑ - ${size}GB > ${min_transcode_size}GB\n`;
            returns.size = 1; 
        } else {
            returns.log += `☒ - ${size}GB < ${min_transcode_size}GB\n`;
        }
    } else if(file.video_resolution === "720p") { //file will be encoded if the resolution is 720p
        var min_transcode_size = ((min_bitrate/2) * duration * 0.125)/1000000; //minimum size in GB for transcode
            min_transcode_size = min_transcode_size.toFixed(2);

        //check if file is large enough for transcode
        if (size >= ((min_bitrate/2) * duration * 0.125)/1000000) {
            returns.log += `☑ - ${size}GB > ${min_transcode_size}GB\n`;
            returns.size = 1; 
        } else {
            returns.log += `☒ - ${size}GB < ${min_transcode_size}GB\n`;
        }
    } else if(file.video_resolution === "480p" || file.video_resolution === "576p") { //file will be encoded if the resolution is 480p or 576p
        var min_transcode_size = ((min_bitrate/4) * duration * 0.125)/1000000; //minimum size in GB for transcode
            min_transcode_size = min_transcode_size.toFixed(2);

        //check if file is large enough for transcode
        if (size >= ((min_bitrate/4) * duration * 0.125)/1000000) {
            returns.log += `☑ - ${size}GB > ${min_transcode_size}GB\n`;
            returns.size = 1; 
        } else {
            returns.log += `☒ - ${size}GB < ${min_transcode_size}GB\n`;
        }
    }

    return returns;
}

function error_fix(file) {
    var fix = {
        sub_codec: 0, //changes to 1 if unwanted codec is found
        muxing: 0
    }

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {

        //these subtitle codecs don't fit in a mkv container
        if (file.ffProbeData.streams[i].codec_name && file.ffProbeData.streams[i].codec_type) {
            if (file.ffProbeData.streams[i].codec_name.toLowerCase() == "eia_608" || file.ffProbeData.streams[i].codec_name.toLowerCase() == "mov_text" && file.ffProbeData.streams[i].codec_type.toLowerCase.includes("sub") && response.container == '.mkv') {
                fix.sub_codec = 1;
            }

            //mitigate TrueHD audio causing Too many packets error
            if (file.ffProbeData.streams[i].codec_name.toLowerCase() == "truehd" || file.ffProbeData.streams[i].codec_name.toLowerCase() == "dts" && file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" ) {
                fix.muxing = 1;
            }
        }
    }

    return fix;
}

function encoder_string(file, avg_rate, max_rate) {
    var encoder = ``; //encoder 
    var fix = error_fix(file);
    var sub = ``;

    //tree for resolution : quality
    if (file.video_resolution === "1080p" || file.video_resolution === "4KUHD") { //file will be encoded if the resolution is 1080p, or greater (it will be downscaled)
        encoder += ` -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 26 -b:v ${avg_rate}k -maxrate:v ${max_rate}k`; //-qp 26
    } else if(file.video_resolution === "720p") { //file will be encoded if the resolution is 720p
        encoder += ` -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 26 -b:v ${avg_rate/2}k -maxrate:v ${max_rate/2}k`; //-qp 28
    } else if(file.video_resolution === "480p" || file.video_resolution === "576p") { //file will be encoded if the resolution is 480p or 576p
        encoder += ` -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 26 -b:v ${avg_rate/4}k -maxrate:v ${max_rate/4}k`; //-qp 30
    }
    encoder += ` -c:v hevc_nvenc -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -dn`;

    if (fix.sub_codec == 1) {
        for (var i = 0; i < file.ffProbeData.streams.length; i++) {
            if (file.ffProbeData.streams[i].codec_name) {
                if (file.ffProbeData.streams[i].codec_name.toLowerCase() == "eia_608" || file.ffProbeData.streams[i].codec_name.toLowerCase() == "mov_text" && file.ffProbeData.streams[i].codec_type.toLowerCase().includes("sub")) {
                    sub += ` -c:${i} ass`; 
                } else {
                    if (file.ffProbeData.streams[i].codec_type) {
                        if (file.ffProbeData.streams[i].codec_type.toLowerCase().includes("sub")) {
                            sub += ` -c:${i} copy`;
                        }
                    }
                }
            }
        }
    } else {
        sub = ` -c:s copy`
    }

    if (fix.muxing == 1) {
        encoder += ` -max_muxing_queue_size 2048`;
    }

    return encoder + ` -c:a copy` + sub;
}

function encoder_string_full(file, highres, crop, avg_rate, max_rate) {
    var encoder = encoder_string(file, avg_rate, max_rate);

    console.log(`crop filter: ` +  crop)

    if (highres == 1 && crop != "0") {
        return crop + `,scale=-1:1920 ` + encoder;
    } else if (highres == 1) {
        return `-filter:0 scale=-1:1920 ` + encoder;
    } else if (crop != "0") {
        return crop + encoder;
    } else {
        return encoder;
    }
}

module.exports.details = details;
module.exports.plugin = plugin;
