
//PLugin runs multipass loudnorm filter
//first run gets the required details and stores for the next pass
//second pass applies the values

//stages
// Determined Loudnorm Values
// Applying Normalisation
// Normalisation Complete


//setup global vars

var secondPass = false;
var logOutFile = '';

var fs = require('fs');
var path = require('path');
if (fs.existsSync(path.join(process.cwd(), '/npm'))) {
    var rootModules = path.join(process.cwd(), '/npm/node_modules/')
} else {
    var rootModules = ''
}

const importFresh = require(rootModules + 'import-fresh');
const library = importFresh('../methods/library.js')

const ffprobePath = require(rootModules + 'ffprobe-static').path;

module.exports.details = function details() {
    return {
        id: "Tdarr_Plugin_NIfPZuCLU_2_Pass_Loudnorm_Audio_Normalisation",
        Name: "2 Pass Loudnorm Volume Normalisation",
        Type: "Video",
        Operation: "Transcode",
        Description: "PLEASE READ FULL DESCRIPTION BEFORE USE \n Uses multiple passes to normalise audio streams of videos using loudnorm.\n\n The first pass will create an log file in the same directory as the video.\nSecond pass will apply the values determined in the first pass to the file.\nOutput will be MKV to allow metadata to be added for tracking normalisation stage.",
        Version: "0.1",
        Link: "",
        Tags: "pre-processing,ffmpeg,configurable",

        Inputs: [
            //(Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
            {
                name: "i",
                tooltip: `\"I\" value used in loudnorm pass \n
              defaults to -23.0`, //Each line following `Example:` will be clearly formatted. \\n used for line breaks
            },
            {
                name: "lra",
                tooltip: `Desired lra value. \n Defaults to 7.0  
            `,
            },
            {
                name: "tp",
                tooltip: `Desired \"tp\" value. \n Defaults to -2.0 
              `,
            },
            {
                name: "offset",
                tooltip: `Desired "offset" value. \n Defaults to 0.0  
              `,
            },
        ],
    }
}

module.exports.plugin = function plugin(file, librarySettings, inputs) {

    //Must return this object at some point
    var response = {
        processFile: false,
        preset: '',
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '',

    }

    response.infoLog += ""
    //grab the current file being processed and make an out file for the ffmpeg log
    let currentfilename = file._id;
    logOutFile = currentfilename.substr(0, currentfilename.lastIndexOf(".")) + ".out"
    console.log("Log out file: " + logOutFile)

    //get an updated version of the file for checking metadata
    var probeData = JSON.parse(require("child_process").execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${currentfilename}"`).toString())

    //setup required varibles
    var loudNorm_i = -23.0
    var lra = 7.0
    var tp = -2.0
    var offset = 0.0

    //create local varibles for inputs
    if (inputs !== undefined) {
        if (inputs.i !== undefined) loudNorm_i = inputs.i
        if (inputs.lra !== undefined) lra = inputs.lra
        if (inputs.tp !== undefined) tp = inputs.tp
        if (inputs.offset !== undefined) offset = inputs.offset
    }


    //check for previous pass tags

    if (typeof probeData.format === "undefined" || typeof probeData.format.tags.NORMALISATIONSTAGE === "undefined" || probeData.format.tags.NORMALISATIONSTAGE === "" || file.forceProcessing === true) {

        //no metadata found first pass is required
        console.log("Searching for audio normailisation values")
        response.infoLog += "Searching for required normalisation values. \n"
        var loudNormInfo = "";

        //Do the first pass, output the log to the out file and use a secondary output for an unchanged file to allow Tdarr to track, Set metadata stage
        response.preset = `<io>-af loudnorm=I=${loudNorm_i}:LRA=${lra}:TP=${tp}:print_format=json -f null NUL -map 0 -c copy -metadata NORMALISATIONSTAGE="FirstPassComplete" 2>"${logOutFile}"`
        response.container = '.mkv'
        response.handBrakeMode = false
        response.FFmpegMode = true
        response.reQueueAfter = true;
        response.processFile = true
        response.infoLog += "Normalisation first pass processing \n"
        return response
    }
    if (probeData.format.tags.NORMALISATIONSTAGE === "FirstPassComplete") {

        //ensure previous out file exists
        if (fs.existsSync(logOutFile)) {
            secondPass = true;
            loudNormInfo = fs.readFileSync(logOutFile).toString();

            //grab the json from the out file
            var startIndex = loudNormInfo.lastIndexOf("{");
            var endIndex = loudNormInfo.lastIndexOf("}");

            var outValues = loudNormInfo.toString().substr(startIndex, endIndex)

            response.infoLog += "Loudnorm first pass values returned:  \n" + outValues

            //parse the JSON
            var loudNormValues = JSON.parse(outValues)
            
            //use parsed values in second pass
            response.preset = `-y<io>-af loudnorm=print_format=summary:linear=true:I=${loudNorm_i}:LRA=${lra}:TP=${tp}:measured_i=${loudNormValues.input_i}:measured_lra=${loudNormValues.input_lra}:measured_tp=${loudNormValues.input_tp}:measured_thresh=${loudNormValues.input_thresh}:offset=${loudNormValues.target_offset} -c:a aac -b:a 192k -c:s copy -c:v copy -metadata NORMALISATIONSTAGE="Complete"`
            response.container = '.mkv'
            response.handBrakeMode = false
            response.FFmpegMode = true
            response.reQueueAfter = true;
            response.processFile = true
            response.infoLog += "Normalisation pass processing \n"
            return response
        } else {
            response.infoLog += "Previous log output file is missing. Please rerun with force processing to regenerate."
            response.processFile = false;
            return response

        }
    }
    if(probeData.format.tags.NORMALISATIONSTAGE === "Complete"){
        response.processFile = false;
        response.infoLog += "File is already marked as normalised \n"
        return response
    } else {
        //what is this tag?
        response.processFile = false;
        response.infoLog += "Unknown normalisation stage tag: \n" + probeData.format.tags.NORMALISATIONSTAGE
        return response
    }


}

module.exports.onTranscodeSuccess = function onTranscodeSuccess(
    file,
    librarySettings,
    inputs
) {

    var response = {
        file,
        removeFromDB: false,
        updateDB: true,
    };
    if (secondPass) {
        response.infoLog += "Audio normalisation complete. \n"
        //remove old out file
        if (fs.existsSync(logOutFile)) {
            fs.unlinkSync(logOutFile);
        }
        return response;
    }
    else {
        response.infoLog += "Audio normalisation first pass complete. \n"
        return response;
    }
};

module.exports.onTranscodeError = function onTranscodeError(
    file,
    librarySettings,
    inputs
) {
    console.log("Failed to normalise audio");

    //Optional response if you need to modify database
    var response = {
        file,
        removeFromDB: false,
        updateDB: false,
    };

    return response;
};

