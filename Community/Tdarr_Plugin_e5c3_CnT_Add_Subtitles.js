const fs = require('fs');
const iso6392 = require('/home/Tdarr/Documents/node_modules/iso-639-2');

function details() {
    return {
      id: "Tdarr_Plugin_e5c3_CnT_Add_Subtitles",
      Name: "Add subtitles to MKV files",
      Type: "Video",
      Operation:"Remux",
      Description: `Add subtitles. READ THIS!! You must run "npm install iso-639-2" in the folder "/home/Tdarr/Documents" for this plugin to work. This is a plugin that will check for subtitles, they should be named according to the ISO 639-2 language code.`,
      Version: "1.00",
      Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_e5c3_CnT_Add_Subtitles.js",
    }
}

function plugin(file) {
    var i = 0; //int for counting lang[position]
    var sub = 0; //becomes first subtitle stream
    var lang = iso6392; //languages to check against
    var path = file.meta.Directory; //path of media folder
    var exist = 0; //if the language exists should be added this becomes 1
    var new_subs = 0 //count the new subs
    var added_subs = 0; //counts the amount of subs that have been mapped
    var preset_import = '';
    var preset_meta = '';

    
    //default response
    var response = {
        processFile: false, 
        preset: `,`,
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: false,
        reQueueAfter: false,
        infoLog: `Testing for subtitles...\nPath: ${path}\n`,
    }

    //find first subtitle stream
    while (file.ffProbeData.streams[sub].codec_type.toLowerCase() != "subtitle") {
        sub++
    }
    response.infoLog += `The first subtitle stream is ${sub}\n`

    for (i = 0; i < lang.length; i++) {
        //check if srt exists in folder
        if (fs.existsSync(`${path}/${lang[i].iso6392B}.srt`)) {
            response.infoLog += `Found subtitle ${lang[i].name}\n`

            //check if language already exists
            for (sub_stream = sub; sub_stream < file.ffProbeData.streams.length; sub_stream++) {
                response.infoLog += `does ${lang[i].name} exist in stream ${sub_stream}?\n`
                if (file.ffProbeData.streams[sub_stream].tags.language.toLowerCase() == lang[i].iso6392B) {
                    response.infoLog += `YES\n`
                    exist = 1;
                } else {
                    response.infoLog += `NO\n`
                }
            }
            
            //add if it hasn't found the language
            if (exist != 1) {
                preset_import += ` -sub_charenc "UTF-8" -f srt -i "${path}/${lang[i].iso6392B}.srt"`
                preset_meta += ` -metadata:s:s:${new_subs} language=${lang[i].iso6392B}`
                new_subs++
            }
        } else {
            response.infoLog += `did not find sub ${lang[i].iso6392B}.srt\n`
        }
        exist = 0;
    }

    response.infoLog += `${new_subs} new subs will be added\n`
    response.preset += ` ${preset_import}${preset_meta} -map 0:v -map 0:a`
    
    //map new subs
    while (added_subs < new_subs) {
        added_subs++
        response.preset += ` -map ${added_subs}:s`
    }

    //if new subs have been found they will be added
    if (new_subs > 0) {
        response.FFmpegMode = true;
        response.processFile = true;
        response.reQueueAfter = true;
        response.preset += ` -map 0:s -c copy`
    } else {
        response.infoLog += `No new subtitle languages were found\n`
    }

    response.infoLog += `The ffmpeg string is: ${response.preset}\n`

    return response
}

module.exports.details = details;
module.exports.plugin = plugin;
