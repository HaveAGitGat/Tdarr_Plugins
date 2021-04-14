/* eslint-disable */
var fs = require('fs');
var path = require('path');
if (fs.existsSync(path.join(process.cwd(), '/npm'))) {
    var rootModules = path.join(process.cwd(), '/npm/node_modules/')
} else {
    var rootModules = ''
}

const importFresh = require(rootModules + 'import-fresh');
const library = importFresh('../methods/library.js')

module.exports.details = function details() {
    return {
        id: "Tdarr_Plugin_O8O0dCTlb_Set_File_Permissions_For_UnRaid",
        Name: "Set file permissions for UnRaid",
        Type: "Video",
        Operation: "Transcode",
        Description: "Sets file permissions using chown nobody:users to prevent lock from root. Use at end of stack. ",
        Version: "",
        Link: "",
        Tags: "post-processing"
    }
}

module.exports.plugin = function plugin(file) {

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
