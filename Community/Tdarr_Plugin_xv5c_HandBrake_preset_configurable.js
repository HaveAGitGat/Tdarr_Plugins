const details = () => ({
    id: "Tdarr_Plugin_xv5c_HandBrake_preset_configurable",
    Name: "■ Løøt ■ HandBrake preset configurable h.265 to h.265 possible with this plugin",
    Type: "Video",
    Operation: "Transcode",
    Description: "◆◆◆WARNING THIS PLUGIN IF NOT SETUP RIGHT WILL FAIL◆◆◆ First, If you have set hevc_2_hevc to true just know that metadata comment called dontProcess gets added to the video. If you need to transcode again you must remove the metadata comment dontProcess from the file Use vlc to remove metadata dontProcess comment. You also need to open a video in handbrake. Then, set up a preset, when you get it like you want hit save the preset. Choose a name, you will need it later. Right before you save your preset. Make sure your audio and subtitles are set up correctly you will see the options by clicking on selection behavior. When done, hit save. On the top right you will see presets hit manage presets, select your preset and on the top right again options, export selected. Make sure your preset uses h.x265. Keep eye on the dos looking black boxes look for error messages. The most common error is  [WARN] Tdarr_Node - Tdarr ALERT: NO OUTPUT FILE PRODUCED. That meana you have a typeo in the handbreak_preset or the handbreak_preset_name. Remember, anything but a handbrake profile will not work. Use vlc to remove metadata dontProcess comment after fixing the typo.",
    Version: '1.0',
    Link: "",
    Tags: 'pre-processing,handbrake,preset,configurable,h265,hevc to hevc, x265 to x265, h.265 to h.265',
    Inputs: [{
        name: 'container',
        type: 'string',
        defaultValue: 'MKV',
        inputUI: {
            type: 'dropdown',
            options: [
                'MKV',
                'MP4',
                'AVI',
            ],
        },
        tooltip: `Specify output container of file.
                  \\n Only mkv,mp4, and avi are supported by this plugin!
                  \\n mkv is recommended.
                    \\nExample:\\n
                    mkv

                    \\nExample:\\n
                    mp4`,
    }, {
        name: 'handbrake_preset',
        type: 'string',
        defaultValue: 'Replace This!!!',
        inputUI: {
            type: 'text',
        },
        tooltip: `◆◆◆REQUIRED!!!◆◆◆ Needs the location of the exported Handbrake preset.\\n
        \\n☠It will not run with out it!☠ \\n
        Pay special attention to the direction of the slashes!\\n
        \\nExample:\\n
        C:/Presets/Full1080p-Fast.json`,
    }, {
        name: 'handbrake_preset_name',
        type: 'string',
        defaultValue: 'Replace This!!!',
        inputUI: {
            type: 'text',
        },
        tooltip: `◆◆◆REQUIRED!!!◆◆◆ Needs the name of the exported Handbrake preset.\\n
        ☠It will not run with out it!☠`,
    },
        {
            name: 'hevc_2_hevc',
            type: 'boolean',
            defaultValue: true,
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: `◆Do you want to be able transcode HEVC to HEVC (h.265)? Default is True.
                    \\n◆If True all codecs will be processed!
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
        },
    ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const importFresh = require('import-fresh');
    const library = importFresh('../methods/library.js');

    // Must return this object at some point
    const response = {
        processFile: false,
        preset: '',
        container: `.${inputs.container.toLowerCase()}`,
        handbrakeMode: false,
        ffmpegMode: true,
        reQueueAfter: true,
        infoLog: '',

    }

    function errCheck(err) {
        response.infoLog += err;
        console.log(err);
        response.processFile = false;
        throw new Error(err)

    }

    function transcodeVideo(log) {
        response.preset = `--preset-import-file "${inputs.handbrake_preset.trim()}" -Z "${inputs.handbrake_preset_name.trim()}"`;
        response.container = `.${inputs.container.toLowerCase()}`;
        response.handbrakeMode = true;
        response.ffmpegMode = false;
        response.processFile = true;
        response.infoLog += log;
        console.log(log)
        return response;

    }

    // I know a function for a shorter console.log looks lazy but Im disabled and can only type with one hand.
    function log(message) {
        console.log(message)

    }

    if (inputs.handbrake_preset === '' && inputs.handbrake_preset_name === '') {
        return errCheck(`Both handbrake_preset and handbrake_preset_name were both blank!!! Exiting`);

    } else if (inputs.handbrake_preset === '') {
        return errCheck('You need a valid preset path for this plugin to work!! Exiting');

    } else if (inputs.handbrake_preset_name === '') {
        return errCheck('You need a valid preset name for this plugin to work!! Exiting');

    } else if (inputs.handbrake_preset === 'Replace This!!!' && inputs.handbrake_preset_name === 'Replace This!!!') {
        return errCheck('You need a valid preset path for this plugin to work! and a preset name! Exiting');

    } else if (inputs.handbrake_preset === 'Replace This!!!') {
        return errCheck('You need a valid preset path for this plugin to work! Exiting');

    } else if (inputs.handbrake_preset_name === 'Replace This!!!') {
        return errCheck('You need a valid preset name for this plugin to work! Exiting');

      // Check if file is a video. If it isn't then exit plugin.
    } else if (file.fileMedium !== 'video') {
        return errCheck('File is not a video. Skipping transcode!');
    }

    if (inputs.container.toLowerCase() != 'mp4' && inputs.container.toLowerCase() != 'avi' && inputs.container.toLowerCase() != 'mkv') {
        log(`This is a ${inputs.container} Container!!`)
        return errCheck('Container is not correct!!! Needs to be a mp4,avi, or mkv. Plugin will stop now')

    }

    if (inputs.hevc_2_hevc === true) {

        // Check to prevent inf loop.
        if(file.mediaInfo.track[0].Comment === 'dontProcess') {
            log('This video has been done before. skipping transcode!');
            response.processFile = false;
            return response;

        }

        log(file.ffProbeData.format.filename)
        // Needed for execSync to work
        const exec = require('child_process');

        // Adds the metadata - dontProcess to the video for the check above to prevent inf loop.
        // Copys the video to the cache folder to avoid ffmpeg transcode in place error.
        exec.execSync(`ffmpeg -i ${file.ffProbeData.format.filename} -map 0 -metadata comment=dontProcess -c copy -y ${librarySettings.cache}/${file.meta.FileName}`);

        // Moves the file back.
        exec.execSync(`ffmpeg -i ${librarySettings.cache}/${file.meta.FileName} -map 0 -c copy -y ${file.ffProbeData.format.filename}`);
        log("dontProcess Metadata written");
        return transcodeVideo('Video is being transcoded!');

    } else {

        // This code was borrowed from Migz-Transcode Using CPU & FFMPEG and modified.
        if (file.ffProbeData.streams[0].codec_name === 'hevc' || file.ffProbeData.streams[0].codec_name === 'vp9' && file.container.toLowerCase() === `${inputs.container.toLowerCase()}`) {
            log('Video is all ready a hevc or vp9. skipping transcode!');
            response.processFile = false;
            return response;

        }

        // Check if codec of stream is hevc or vp9
        // AND check if file.container does NOT match inputs.container.
        // If so remux file.
        if (file.ffProbeData.streams[0].codec_name === 'hevc' || file.ffProbeData.streams[0].codec_name === 'vp9' && file.container.toLowerCase() !== `${inputs.container.toLowerCase()}`) {
            return transcodeVideo(`Video is hevc or vp9 but is not in ${inputs.container} container remuxing. `);
        }
        return transcodeVideo('Video is being transcoded!');
    }

}


module.exports.details = details;
module.exports.plugin = plugin;