/* eslint-disable */


// tdarrSkipTest
const details = () => {
    return {
        id: "Tdarr_Plugin_O8O0dCTlb_Set_File_Permissions_For_UnRaid",
        Stage: 'Pre-processing',
        Name: "Set File Permissions For UnRaid",
        Type: "Video",
        Operation: "Transcode",
        Description: "Sets file permissions using chown nobody:users to prevent lock from root. Use at end of stack. ",
        Version: "",
        Tags: "post-processing",
        Inputs:[],
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

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

    if ((true) || file.forceProcessing === true) {

        require("child_process").execSync(`chown nobody:users "${file._id}"`)
        response.preset = ''
        response.container = '.mkv'
        response.handBrakeMode = false
        response.FFmpegMode = true
        response.reQueueAfter = true;
        response.processFile = false
        response.infoLog += "File permissions set \n"
        return response
    }
}


module.exports.details = details;
module.exports.plugin = plugin;