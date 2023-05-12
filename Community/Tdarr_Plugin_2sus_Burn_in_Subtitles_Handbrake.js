/* eslint-disable */
const details = () => ({
    id: "Tdarr_Plugin_2sus_Burn_in_Subtitles_Handbrake",
    Stage: "Pre-processing",
    Name: "2sus Burn in Subtitles Handbrake",
    Type: "Subtitle",
    Operation: "Transcode",
    Description: 'This plugin can burn in subtitles based on audio track language \n\n',
    Version: "0.01",
    Tags: "pre-processing,handbrake,subtitles only,configurable",
    Inputs: [
        {
            name: 'handbrake_preset',
            type: 'string',
            defaultValue: 'Fast 1080p30',
            inputUI: {
                type: 'text',
            },
            tooltip: `Name of the handbrake preset that will be used. \n\n
            
            \\nCommon Presets:
            \\nHQ 1080p30 Surround     if you want surround
            \\nH.264 MKV 1080p30       if you want mkv
            \\nFast 1080p30            if you want mp4
            `
        },
        {
            name: 'extra_args',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text'
            },
            tooltip: `Extra handbrake args to add to the end of the command.`
        },
        {
            name: 'output_container',
            type: 'string',
            defaultValue: '.mp4',
            inputUI: {
                type: 'text'
            },
            tooltip: `Container the output file will be in. Leave blank to leave container unchanged\n\n
            
            Common Containers:
            mkv
            mp4
            `
        },
        {
            name: 'audio_lang',
            type: 'string',
            defaultValue: 'jpn',
            inputUI: {
                type: 'text',
            },
            tooltip: `Specify the audio language subs should be burned in for. If ONLY this language is present, burn in subs.`,
        },
        {
            name: 'sub_lang',
            type: 'string',
            defaultValue: 'eng,und',
            inputUI: {
                type: 'text',
            },
            tooltip: `Specify the language of subtitles to burn in. If a comma separated list, burn in the first matching subtitle\n\n
            
            Example: eng,und    burn in first matching eng subs. If none, burn in first matching und subs
            `,
        },
    ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {

    const lib = require('../methods/lib')();
    // eslint-disable-next-line no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    //Must return this object

    var response = {
        processFile: false,
        preset: "",
        container: `${file.container}`,
        handBrakeMode: true,
        FFmpegMode: false,
        reQueueAfter: false,
        infoLog: "",
    };

    if (
        inputs.handbrake_preset === undefined ||
        inputs.audio_lang === undefined ||
        inputs.sub_lang === undefined
    ) {
        response.processFile = false;
        response.infoLog += "☒ Inputs not entered! \n";
        return response;
    }

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== 'video') {
        // eslint-disable-next-line no-console
        console.log('File is not video');
        response.infoLog += '☒ File is not video \n';
        response.processFile = false;
        return response;
    }

    if(inputs.output_container){
        response.container = inputs.output_container;
    }

    // Set up required variables.
    const audio_lang = inputs.audio_lang;
    const sub_lang = inputs.sub_lang;

    let audio_streams = new Set();     // Find all audio streams
    let possible_sub_streams = [];  // Find possible subtitle streams to burn in
    // let audio_streams = [];
    for(let i=0; i<file.ffProbeData.streams.length; i++){
        let stream = file.ffProbeData.streams[i]
        try{
            if (stream.codec_type.toLowerCase() === 'audio'){
                audio_streams.add(stream.tags.language.toLowerCase())
            }

            if(stream.codec_type.toLowerCase() === 'subtitle' && sub_lang.includes(stream.tags.language.toLowerCase())){
                possible_sub_streams.push(i)
            }
        }catch(err){
            //Err
        }
    }

    // if(audio_streams.length != 1){
    if(audio_streams.size != 1){
        response.infoLog += `☒More than 1 audio language found. Skipping this plugin. \n`;
        response.processFile = false;
        return response;
    }

    // check if audio is alone
    // if(audio_streams[0] !== audio_lang){
    if(!audio_streams.has(audio_lang)){
        response.infoLog += `☒Audio stream is alone, but not in the configured language. Skipping this plugin. \n`;
        response.processFile = false;
        return response;
    }

    if(possible_sub_streams.length == 0){
        response.infoLog += `☒No subtitles eligible for burn-in found. Skipping this plugin. \n`;
        response.processFile = false;
        return response;
    }

    // --preset="H.264 MKV 1080p30" --subtitle-burned --first-subtitle --subtitle-lang-list 'eng'

    response.processFile = true;
    response.preset = `--preset "${inputs.handbrake_preset}" --subtitle-burned --first-subtitle --subtitle-lang-list "${inputs.sub_lang}" ${inputs.extra_args}`;

    response.reQueueAfter = true;
    response.infoLog += `✅Burning in subtitle stream 0:s:${possible_sub_streams[0]}.`
    return response;
};




module.exports.details = details;
module.exports.plugin = plugin;