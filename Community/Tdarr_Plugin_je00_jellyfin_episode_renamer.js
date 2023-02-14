/* eslint-disable */

// tdarrSkipTest
const details = () => {
    return {
        id: "Tdarr_Plugin_je00_jellyfin_episode_renamer",
        Stage: "Post-processing",
        Name: "Rename show episodes for Jellyfin",
        Type: "Video",
        Operation: "Transcode",
        Description: `This plugin renames files if they contain a sequence with [Ss]\d\d[Ee]\d\d to Episode SXXEXX.container`,
        Version: "1.00",
        Tags: "post-processing",
        Inputs: []
    };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
        const lib = require('../methods/lib')();
        // eslint-disable-next-line no-unused-vars,no-param-reassign
        inputs = lib.loadDefaultValues(inputs, details);
        try {
            const fs = require("fs");
            const pathOld = file._id;
            console.log(file._id)
            console.log(file.file)

            let temp = file._id.toString().split(".");
            const container = "." + temp[temp.length - 1]

            //split path into filename and directory
            temp = file._id.toString().split("/")
            let fileNameOld = temp[temp.length - 1]
            const path = pathOld.replace(fileNameOld, "")
            fileNameOld = fileNameOld.toUpperCase()

            //create pattern matching for episode syntax and already formatted files
            const match = fileNameOld.search(/S\d\dE\d\d/gm)
            const jellyfinPattern = fileNameOld.search(/Episode S\d\dE\d\d\./gm)

            if (match > -1 && jellyfinPattern === -1) {
                const episodeString = fileNameOld.substring(match, match + 6);
                const newPath = path + "Episode " + episodeString + container;
                file._id = newPath;
                file.file = newPath;
            }

            const response = {
                file,
                removeFromDB: false,
                updateDB: false,
            };

            if (pathOld !== file._id) {
                // if (fs.existsSync(file._id)
                fs.renameSync(pathOld, file._id);
                console.log('Episode name has been changed from ' + pathOld + ' to ' + file._id)
                response.updateDB = true;
            } else
                console.log('File is not discernible as an episode or is already in the correct jellyfin format')
            return response;
        } catch (err) {
            console.log(err);
        }
    }
;


module.exports.details = details;
module.exports.plugin = plugin;
