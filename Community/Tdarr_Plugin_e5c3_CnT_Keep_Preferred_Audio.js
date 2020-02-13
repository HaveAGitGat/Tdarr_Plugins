const { exec } = require('child_process');
const fs = require('fs');

function details() {
    return {
        id: "Tdarr_Plugin_e5c3_CnT_Keep_Preferred_Audio",
        Name: "Keep Preffered Audio",
        Type: "Video",
        Operation: "Remove Audio",
        Description: "Plugin that checks for unwanted audio, per 1.104 beta you can change the languages yourself from within Tdarr!\nUntill you enter a value it keep english tracks by default.\nUndefined languages are kept to prevent videos without sound.\nIf you would like to keep track of the languages you have for each file you can use the 'special' option.\nCreated by @control#0405",
        Version: "1.1",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_e5c3_CnT_Remove_non_English_Audio.js",
        Tags: 'pre-processing,ffmpeg,audio only,configurable',
        Inputs: [
            {
                name: 'languages',
                tooltip: `Desired Languages you would like to keep, language format has to be according to the iso-639-2 standard: https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes\\nExample:\\n eng,dut`
            },
            {
                name: 'special',
                tooltip: `This is if you want a specific language to be logged to a file in your Tdarr documents folder.\nIt will add the name of the file that is being processed if this language(s) has been found.\nThe file is created the first time it finds a file with the language. \nThe languages don't have to be in "languages". \\nExample:\\n eng,dut `
            }
        ]
    };
}

function plugin(file, librarySettings, inputs, otherArguments) {
    if (inputs.languages == "") {
        var languages = ["eng", "en"]; // These languages should be kept, named according to ISO 639-2 language scheme
    } else {
        var languages = inputs.languages.split(','); // These languages should be kept, named according to ISO 639-2 language scheme
    }
    if (inputs.special !== null) {
        var special = inputs.special.split(',');
    }
    if (languages.length >= special.length) {
        var { length } = languages;
    } else {
        var { length } = special;
    }
    console.log(languages);
    var transcode = 0; // If this becomes '1' it will be transcoded
    var sourcename = file.meta.FileName.substring(0, file.meta.FileName.lastIndexOf(".")); // Filename without extension
    var specialcheck = ``; // Contains the txt string if special language was found
    var wanted = 0;
    var audio = 0;

    // Default response
    var response = {
        processFile: false,
        preset: `, -map 0:v`,
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: false,
        reQueueAfter: false,
        infoLog: 'Removing unwanted audio...\n'
    };

    for (i = 0; i < file.ffProbeData.streams.length; i++) {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
            // Check for non-english tracks
            if (file.ffProbeData.streams[i].tags.language) {
                if (typeof file.ffProbeData.streams[i].tags.language !== 'undefined') {
                    for (l = 0; l < length; l++) {
                        if (file.ffProbeData.streams[i].tags.language == special[l]) {
                            if (!fs.existsSync(otherArguments.homePath + `/Tdarr/special_audio_${special[l]}.txt`)) { // Create txt file if it doesn't exist yet
                                exec(`echo "${sourcename}" >> ${otherArguments.homePath}/Tdarr/special_audio_${special[l]}.txt`); // First file will be added and file is created
                                console.log(`added to txt: ` + sourcename);
                            } else {
                                specialcheck = fs.readFileSync(otherArguments.homePath + `/Tdarr/special_audio_${special[l]}.txt`).toString(); // Create string from existing file
                                if (!specialcheck.includes(sourcename)) { // Only add the filename if it wasn't added already
                                    exec(`echo "${sourcename}" >> ${otherArguments.homePath}/Tdarr/special_audio_${special[l]}.txt`);
                                    console.log(`added to txt: ` + sourcename);
                                }
                            }

                            response.preset += ` -map 0:${i}`;
                            response.infoLog += `Found special ${special[l]}: ${i}\n`;
                            wanted++;
                            break;
                        } else if (file.ffProbeData.streams[i].tags.language == languages[l]) {
                            response.preset += ` -map 0:${i}`;
                            response.infoLog += `Found wanted ${languages[l]}: ${i}\n`;
                            wanted++;
                            break;
                        }
                    }
                } else {
                    response.preset += ` -map 0:${i}`;
                    response.infoLog += `Added undefined: ${i}\n`;
                    wanted++;
                }
            } else {
                response.preset += ` -map 0:${i}`;
                response.infoLog += `Added undefined: ${i}\n`;
                wanted++;
            }

            audio++;
        }
    }

    if (audio > wanted && wanted > 1) {
        transcode = 1;
    }

    if (transcode == 1) {
        response.infoLog += `Found unwanted audio\nIt will be removed\n`;
        response.processFile = true;
        response.FFmpegMode = true;
        response.preset += ` -map 0:s? -c copy`;
        response.reQueueAfter = true;
    } else {
        response.infoLog += `No unwanted audio found!\n`;
    }

    return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
