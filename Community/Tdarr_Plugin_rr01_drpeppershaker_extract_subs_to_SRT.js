// tdarrSkipTest
const details = () => ({
    id: 'Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT',
    Stage: 'Pre-processing',
    Name: 'drpeppershaker Extract embedded subtitles and optionally remove them',
    Type: 'Video',
    Operation: 'Transcode',
    Description: 'This plugin extracts embedded subs (one per language) in one pass inside Tdarr and will optionally remove them. \n\n '
        + 'All processes happen within Tdarr without the use of any exec() functions, which lets the progress bar '
        + 'report the status correctly. AND all subtitles are extracted in one pass, which is much faster than '
        + 'other options.',
    // Created by drpeppershaker with help from reddit user /u/jakejones48, lots of
    // improvements made after looking at "Tdarr_Plugin_078d" by HaveAGitGat.
    Version: '1.04',
    Tags: 'pre-processing,subtitle only,ffmpeg,configurable',
    Inputs: [
        {
            name: 'remove_subs',
            type: 'boolean',
            defaultValue: false,
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: `Do you want to remove subtitles after they are  extracted?
        
        \\nExample:\\n
        
        true
        
        \\nExample:\\n
        
        false
        `
        },
        {
            name: "ignored_subtitle_codecs",
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text'
            },
            tooltip: `Specifiy the codecs to ignore. Main purpose is to avoid extracting image-based subtitles.
                \\nExample:\\n
                hdmv_pgs_subtitle
                \\nExample:\\n
                dvd_subtitle,hdmv_pgs_subtitle`,
        },
        {
            name: 'overwrite_existing_file_subs',
            type: 'boolean',
            defaultValue: false,
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: `If a subtitle file with the same name is already present, do you want the extracted sub to be written over it ? If set to 'false' the extraction while be skipped.
        
        \\nExample:\\n
        
        true
        
        \\nExample:\\n
        
        false
        `
        },
        {
            name: 'rename_264_to_265',
            type: 'boolean',
            defaultValue: false,
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: `Specify if renaming should be handled in the srt files extracted. If yes 264 file be replaced by 264 and AVC will be replaced by HEVC.
                 \\nExample:\\n
                 true
    
                 \\nExample:\\n
                 false`,
        },
        {
            name: 'debug',
            type: 'boolean',
            defaultValue: false,
            inputUI: {
                type: 'dropdown',
                options: [
                    'false',
                    'true',
                ],
            },
            tooltip: `Specify if debug messages should be added to the response info.
                 \\nExample:\\n
                 true
    
                 \\nExample:\\n
                 false`,
        }
    ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')(); const fs = require('fs');
    // eslint-disable-next-line no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    // Must return this object at some point in the function else plugin will fail.
    const response = {
        processFile: true,
        preset: '',
        container: `.${file.container}`,
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: false,
        infoLog: '',
    };

    const getStringInput = (stringInput) => stringInput?.toLowerCase() || '';
    const printDebugInput = (input) => {
        const value = Object.values(input)[0];
        return value ? ` ${Object.keys(input)[0]} ${value};` : '';
    };
    const isForcedSubtitleStream = (stream) => {
        const title = getStringInput(stream.tags?.title);
        return title.includes('forced') || title.includes('forcés') || title.includes('forces');
    }
    const isSDHSubtitleStream = (stream) => {
        const title = getStringInput(stream.tags?.title);
        return title.includes('cc') || title.includes('sdh');
    }
    const isDescriptiveSubtitleStream = (stream) => {
        const title = getStringInput(stream.tags?.title);
        return title.includes('commentary') || title.includes('description');
    }

    const removeSubs = inputs.remove_subs;
    const ignoredSubtitleCodecs = getStringInput(inputs.ignored_subtitle_codecs).split(",");
    const overwriteExistingFileSubs = inputs.overwrite_existing_file_subs;
    const rename264To265 = inputs.rename_264_to_265;
    const debug = inputs.debug;
    if (debug)
        response.infoLog += `[DEBUG] Params:${printDebugInput({ removeSubs })}${printDebugInput({ ignoredSubtitleCodecs })} \n`

    const subsArr = file.ffProbeData.streams
        .filter((row) =>
            // filter subtitles streams
            row.codec_type === 'subtitle'
            // filter subtitles streams with an ignored codec
            && !ignoredSubtitleCodecs.includes(getStringInput(row.codec_name)));
    if (subsArr.length === 0) {
        response.infoLog += 'No subs in file to extract!\n';
        response.processFile = false;
        return response;
    }
    if (debug) response.infoLog += `[DEBUG] Found ${subsArr.length} subtitle streams : ${subsArr.map(subStream => subStream.index).join(", ")} \n`;
    response.infoLog += 'Found subs to extract!\n';

    let command = '-y <io>';
    for (let i = 0; i < subsArr.length; i += 1) {
        const subStream = subsArr[i];
        let title = getStringInput(subStream.tags?.title || 'no title');
        let lang = getStringInput(subStream.tags?.language)
            + (isForcedSubtitleStream(subStream) ? '.forced'
                : (isSDHSubtitleStream(subStream) ? '.sdh' : ''));
        if (debug) response.infoLog += `[DEBUG] Stream ${subStream.index} ${title} will be used for ${lang}.srt \n`;

        const { originalLibraryFile } = otherArguments;
        let subsFile = ((originalLibraryFile && originalLibraryFile.file) ? originalLibraryFile.file : file.file)
        if (rename264To265)
            subsFile = subsFile
                .replace("264", "265")
                .replace("AVC", "HEVC");

        subsFile = subsFile.split('.');
        subsFile[subsFile.length - 2] += `.${lang}`;
        subsFile[subsFile.length - 1] = 'srt';
        subsFile = subsFile.join('.');

        if (fs.existsSync(`${subsFile}`) && !overwriteExistingFileSubs)
            response.infoLog += `${lang}.srt already exists. Skipping!\n`;
        else if (isDescriptiveSubtitleStream(subStream))
            response.infoLog += `Stream ${i} is a ${title} track. Skipping!\n`;
        else {
            if (fs.existsSync(`${subsFile}`) && overwriteExistingFileSubs) {
                if (debug) response.infoLog += `[DEBUG] ${lang}.srt already exists. Deleting! \n`;
                fs.unlinkSync(`${subsFile}`);
            }
            response.infoLog += `Extracting ${lang}.srt\n`;
            command += ` -map 0:${subStream.index} "${subsFile}"`;
        }
    }

    if (command === '-y <io>') {
        response.infoLog += 'All subs already extracted!\n';
        if (!removeSubs) {
            response.processFile = false;
            return response;
        }
    }

    response.preset = command
        + (removeSubs ?
            ' -map 0 -map -0:s -c copy'
            : ' -map 0 -c copy');

    return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
