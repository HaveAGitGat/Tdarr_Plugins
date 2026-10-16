"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
exports.plugin = exports.details = void 0;

const details = function () {
    return {
        name: 'Radarr Release Group Setter',
        description: 'Sets the release group to "tdarr" in Radarr for a movie based on its filename.',
        style: {
            borderColor: '#6efefc',
        },
        tags: 'metadata, radarr',
        isStartPlugin: false,
        pType: '',
        requiresVersion: '2.17.01',
        sidebarPosition: -1,
        icon: '',
        inputs: [
            {
                name: 'radarrApiKey',
                type: 'text',
                tooltip: 'The API key for Radarr.',
            },
            {
                name: 'radarrUrl',
                type: 'text',
                defaultValue: 'http://localhost:7878',
                tooltip: 'The URL for Radarr, including http:// and the port if necessary.',
            },
        ],
        outputs: [
            {
                number: 1,
                tooltip: 'Continue to next plugin',
            },
        ],
    };
};
exports.details = details;

const plugin = async function (args) {
    const lib = require('../../../../../methods/lib')();
    const axios = args.deps.axios;
    args.inputs = lib.loadDefaultValues(args.inputs, details);

    const radarrApiKey = args.inputs.radarrApiKey;
    const radarrUrl = args.inputs.radarrUrl;

    const extension = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
    const filenameWithoutExtension = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
    const filename = `${filenameWithoutExtension}.${extension}`;
    args.jobLog(`Filename: "${filename}"`);

    try {
        // Search for the movie using the filename
        const searchUrl = `${radarrUrl}/api/v3/movie/lookup?term=${encodeURIComponent(filename)}&apikey=${radarrApiKey}`;
        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.data.length === 0 || !searchResponse.data[0].movieFile) {
            throw new Error('No matching movie file found in Radarr.');
        }

        const movieFile = searchResponse.data[0].movieFile;

        if (movieFile.relativePath !== filename) {
            throw new Error('Found movie file does not match input filename.');
        }

        // Set releaseGroup to "tdarr"
        const updatedMovieFile = {
            ...movieFile,
            releaseGroup: "tdarr",
        };

        await axios.put(`${radarrUrl}/api/v3/moviefile/${movieFile.id}?apikey=${radarrApiKey}`, updatedMovieFile, {
            headers: { 'Content-Type': 'application/json' },
        });

        args.jobLog(`Release group set to "tdarr" for movie file ID: ${movieFile.id}.`);
    } catch (error) {
        args.jobLog(`Error updating release group: ${error.message}`);
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }

    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;