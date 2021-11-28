module.exports.dependencies = [
    "axios",
    "path-extra",
    "touch",
];

module.exports.details = function details() {
    return {
        id: "Tdarr_Plugin_z80t_keep_original_date",
        Stage: "Post-processing",
        Name: "Keep original file dates and times after transcoding",
        Type: "Video",
        Operation: "",
        Description: `This plugin copies the original file dates and times to the transcoded file \n\n`,
        Version: "1.10",
        Link: "",
        Tags: "post-processing,dates,date",
        Inputs: [{
                name: "server",
                tooltip: `IP address or hostname of the server assigned to this node, will be used for API requests.  If you are running nodes within Docker you should use the server IP address rather than the name.

      \\nExample:\\n
       tdarrserver

      \\nExample:\\n
       192.168.1.100`
            }, {
                name: "extensions",
                tooltip: `When files are trans-coded the file extension may change, enter a list of extensions to try and match the original file with in the database after trans-coding. Default is the list of container types from library settings. The list will be searched in order and the extension of the original file will always be checked first before the list is used.

      \\nExample:\\n
       mkv,mp4,avi`
            },
            {
                name: "log",
                tooltip: `Write log entries to console.log. Default is false.

      \\nExample:\\n
       true`
            }
        ]
    };
};

module.exports.plugin = async function plugin(file, librarySettings, inputs) {

    var responseData = {
        file,
        removeFromDB: false,
        updateDB: false,
        infoLog: ""
    };

    try {

        if (inputs.server == undefined || inputs.server.trim() === "") {
            responseData.infoLog += "Tdarr server name/IP not configured in library transcode options\n";
            return responseData;
        }
        var fs = require("fs");
        var path = require("path");
        var axios = require("axios");
        var touch = require("touch");

        log("Waiting 5 seconds...");

        var extensions = inputs.extensions;
        if (extensions == undefined || extensions.trim() === "") {
            extensions = librarySettings.containerFilter;
        }
        extensions = extensions.split(",");

        await new Promise(resolve => setTimeout(resolve, 5000));
        var response = await getFileData(file._id, extensions, inputs.server);

        if (response.data.length > 0) {
            log("Changing date...");
            touch.sync(file._id, {time: Date.parse(response.data[0].statSync.mtime), force: true})
			log("Done.");
            responseData.infoLog += "File timestamps updated or match original file\n";
            return responseData;
        }
        responseData.infoLog += "Could not find file using API using " + inputs.server + "\n";
        return responseData;

    } catch (err) {
        log(err);
    }

    async function getFileData(file, extensions, server) {
        var path = require("path-extra");
        var originalExtension = path.extname(file).split(".")[1];
        if (extensions.indexOf(originalExtension) > -1) {
            extensions.splice(extensions.indexOf(originalExtension), 1);
        }
        extensions.unshift(originalExtension);
        var httpResponse = null;
        for (let ext in extensions) {
            filename = path.replaceExt(file, "." + extensions[ext]);
            log("Fetching file object for " + filename + "...");
            httpResponse = await axios.post("http://" + server + ":8265/api/v2/search-db", {
                "data": {
                    "string": filename,
                    "lessThanGB": 10000,
                    "greaterThanGB": 0
                }
            });

            if (httpResponse.status == 200) {
                if (httpResponse.data.length > 0) {
                    log("Got response for " + filename);
                    return httpResponse;
                } else {
                    log("Response for " + filename + " is empty");
                }
            } else {
                log("API request for " + file + " failed.");
            }
        }
        log("Could not get file info from API, giving up.");
        return httpResponse;
    }

    function log(msg) {
        if (inputs.log === "true") {
            console.log(msg);
        }
    }
};
