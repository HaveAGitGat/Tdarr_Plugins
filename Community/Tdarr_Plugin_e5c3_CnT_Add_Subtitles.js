const fs = require('fs');
const {execSync} = require('child_process');

function details() {
    return {
        id: "Tdarr_Plugin_e5c3_CnT_Add_Subtitles",
        Name: "Add subtitles to MKV files",
        Type: "Video",
        Operation: "Remux",
        Description: `This plugin will check for subtitles, they should be named according to the ISO 639-2 language code.\nA subtitle could look like this: eng.srt\n If there are subtitles found they will be added with FFMPEG, if there are no subs of that language found.\n On first run node module iso-639-2 will be installed in the documents folder.\n Created by @control#0405`,
        Version: "1.3",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_e5c3_CnT_Add_Subtitles.js",
        Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
        Inputs: [
            {
                name: 'install_packages',
                tooltip: `Please change this to "yes", it allows the plugin to install the required nodemodule. (iso-639-2) \\nExample:\\n yes`
            }
        ]
    };
}

function plugin(file, librarySettings, inputs, otherArguments) {
    // Default response
    var response = {
        processFile: false,
        preset: `,`,
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: false,
        reQueueAfter: false,
        infoLog: `Searching new subtitles...\n`
    };

    if (inputs.install_packages == "yes") {
        if (!fs.existsSync(`${otherArguments.homePath}/Tdarr/node_modules/iso-639-2`)) {
            execSync(`cd ${otherArguments.homePath}/Tdarr \n npm install iso-639-2`);
        }
    } else {
        response.infoLog = `Please take a look at the input options\n A extra nodemodule is required.`;
        return response;
    }

    if (fs.existsSync(`/home/Tdarr/Documents/Tdarr/node_modules/iso-639-2`)) {
        var iso6392 = require('/home/Tdarr/Documents/Tdarr/node_modules/iso-639-2');
    } else {
        response.infoLog += `Nodemodule iso-639-2 isn't installed!\nTry Again`;
        return response;
    }

    var i = 0; // Int for counting lang[position]
    var found_subtitle_stream = 0;
    var sub = 0; // Becomes first subtitle stream
    var lang = iso6392; // Languages to check against
    var path = file.meta.Directory; // Path of media folder
    var exist = 0; // If the language exists should be added this becomes 1
    var new_subs = 0; // Count the new subs
    var added_subs = 0; // Counts the amount of subs that have been mapped
    var preset_import = '';
    var preset_meta = '';

    // Find first subtitle stream
    while (found_subtitle_stream == 0 && sub < file.ffProbeData.streams.length) {
        if (file.ffProbeData.streams[sub].codec_type.toLowerCase() == "subtitle") {
            found_subtitle_stream = 1;
        } else {
            sub++;
        }
    }

    response.infoLog += `Path: ${path}\n`;
    for (i = 0; i < lang.length; i++) {
        // Check if srt file exists in folder
        if (fs.existsSync(`${path}/${lang[i].iso6392B}.srt`)) {
            response.infoLog += `Found subtitle ${lang[i].name}.srt\n`;

            if (found_subtitle_stream == 1) {
                // Check if language already exists
                for (sub_stream = sub; sub_stream < file.ffProbeData.streams.length; sub_stream++) {
                    // Response.infoLog += `does ${lang[i].name} exist in stream ${sub_stream}?\n`
                    if (file.ffProbeData.streams[sub_stream].tags.language) {
                        if (file.ffProbeData.streams[sub_stream].tags.language.toLowerCase() == lang[i].iso6392B) {
                            // Response.infoLog += `YES\n`
                            exist = 1;
                            response.infoLog += `Language already exists in stream ${sub_stream}\n It will not be added\n`;
                        }
                    }
                }
            } else {
                exist = 0;
            }

            // Add if it hasn't found the language
            if (exist != 1) {
                preset_import += ` -sub_charenc "UTF-8" -f srt -i "${path}/${lang[i].iso6392B}.srt"`;
                preset_meta += ` -metadata:s:s:${new_subs} language=${lang[i].iso6392B}`;
                new_subs++;
            }
        }

        /*
         * Else {
         *     response.infoLog += `did not find sub ${lang[i].iso6392B}.srt\n`
         * }
         */
        exist = 0;
    }

    response.preset += ` ${preset_import}${preset_meta} -map 0:v -map 0:a`;

    // Map new subs
    while (added_subs < new_subs) {
        added_subs++;
        response.preset += ` -map ${added_subs}:s`;
    }

    // If new subs have been found they will be added
    if (new_subs > 0) {
        response.FFmpegMode = true;
        response.processFile = true;
        response.reQueueAfter = true;
        if (found_subtitle_stream == 1) {
            response.preset += ` -map 0:s `;
        }
        response.preset += ` -c copy`;
        response.infoLog += `${new_subs} new subs will be added\n`;
    } else {
        response.infoLog += `No new subtitle languages were found\n`;
    }

    // Response.infoLog += `The ffmpeg string is: ${response.preset}\n`

    return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
