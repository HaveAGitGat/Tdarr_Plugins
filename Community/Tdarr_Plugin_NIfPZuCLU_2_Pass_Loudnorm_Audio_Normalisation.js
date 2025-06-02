/* eslint-disable no-unused-vars, no-await-in-loop */
module.exports.dependencies = ['axios@0.27.2'];

// PLugin runs multipass loudnorm filter
// first run gets the required details and stores for the next pass
// second pass applies the values

// stages
// Determined Loudnorm Values
// Applying Normalisation
// Normalisation Complete

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_NIfPZuCLU_2_Pass_Loudnorm_Audio_Normalisation',
  Stage: 'Pre-processing',
  Name: '2 Pass Loudnorm Volume Normalisation',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `PLEASE READ FULL DESCRIPTION BEFORE USE
  Uses multiple passes to normalise audio streams of videos using loudnorm.
The first pass will create an log file in the same directory as the video.
Second pass will apply the values determined in the first pass to the file.
Output will be MKV to allow metadata to be added for tracking normalisation stage.`,
  Version: '0.1',
  Tags: 'pre-processing,ffmpeg,configurable',

  Inputs: [
    // (Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
    {
      name: 'i',
      type: 'string',
      defaultValue: '-23.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `"i" value used in loudnorm pass \\n
              defaults to -23.0`,
    },
    {
      name: 'lra',
      type: 'string',
      defaultValue: '7.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Desired lra value. \\n Defaults to 7.0  
            `,
    },
    {
      name: 'tp',
      type: 'string',
      defaultValue: '-2.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Desired "tp" value. \\n Defaults to -2.0 
              `,
    },

    {
      name: 'serverIp',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the IP address of the server if plugin having trouble connecting.',
    },
    {
      name: 'serverPort',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the port number of the server if plugin having trouble connecting.',
    },
  ],
});

const parseJobName = (text) => {
  const parts0 = text.split('.txt');
  const parts1 = parts0[0].split('()');
  return {
    jobId: parts1[3],
    start: Number(parts1[4]),
  };
};

const getloudNormValues = async (inputs, response, file) => {
  // {
  // eslint-disable-next-line import/no-unresolved,import/no-extraneous-dependencies
  const axios = require('axios');

  const serverIp = inputs.serverIp ? inputs.serverIp : process.env.serverIp;
  const serverPort = inputs.serverPort ? inputs.serverPort : process.env.serverPort;
  const serverUrl = `http://${serverIp}:${serverPort}`;
  let loudNormValues = false;
  let tries = 0;
  let error = false;
  while (tries < 15) {
    try {
      tries += 1;
      // wait for job report to be updated by server,
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const logFilesReq = await axios.post(`${serverUrl}/api/v2/list-footprintId-reports`, {
        data: {
          footprintId: file.footprintId,
        },
      });

      if (logFilesReq.status !== 200) {
        throw new Error('Failed to get log files, please rerun');
      }

      let logFiles = logFilesReq.data;

      logFiles = logFiles.sort((a, b) => {
        const joba = parseJobName(a);
        const jobb = parseJobName(b);
        return jobb.start - joba.start;
      });

      const latestJob = logFiles[0];

      const reportReq = await axios.post(`${serverUrl}/api/v2/read-job-file`, {
        data: {
          footprintId: file.footprintId,
          jobId: parseJobName(latestJob).jobId,
          jobFileId: latestJob,
        },
      });

      if (reportReq.status !== 200) {
        throw new Error('Failed to get read latest log file, please rerun');
      }

      const report = reportReq.data.text;
      const lines = report.split('\n');

      let idx = -1;

      // get last index of Parsed_loudnorm
      lines.forEach((line, i) => {
        if (line.includes('Parsed_loudnorm')) {
          idx = i;
        }
      });

      if (idx === -1) {
        throw new Error('Failed to find loudnorm in report, please rerun');
      }

      const loudNormDataArr = [];

      for (let i = (idx + 1); i < lines.length; i += 1) {
        const lineArr = lines[i].split(' ');
        lineArr.shift();
        loudNormDataArr.push(lineArr.join(' '));
        if (lines[i].includes('}')) {
          break;
        }
      }

      loudNormValues = JSON.parse(loudNormDataArr.join(''));
      break;
    } catch (err) {
      response.infoLog += err;
      error = err;
    }
  }

  if (loudNormValues === false && error) {
    throw new Error(error);
  }

  return loudNormValues;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  // Must return this object at some point
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    infoLog: '',
  };

  response.infoLog += '';

  const probeData = file.ffProbeData;

  // setup required varibles
  let loudNorm_i = -23.0;
  let lra = 7.0;
  let tp = -2.0;

  // create local varibles for inputs
  if (inputs !== undefined) {
    if (inputs.i !== undefined) loudNorm_i = inputs.i;
    if (inputs.lra !== undefined) lra = inputs.lra;
    if (inputs.tp !== undefined) tp = inputs.tp;
  }

  // check for previous pass tags
  if (!probeData?.format?.tags?.NORMALISATIONSTAGE) {
    // no metadata found first pass is required
    response.infoLog += 'Searching for required normalisation values. \n';
    response.infoLog += 'Normalisation first pass processing \n';

    // Do the first pass, output the log to the out file and use a secondary output for an unchanged file to
    // allow Tdarr to track, Set metadata stage
    response.preset = `<io>-af loudnorm=I=${loudNorm_i}:LRA=${lra}:TP=${tp}:print_format=json`
    + ' -f null NUL -map 0 -c copy -metadata NORMALISATIONSTAGE=FirstPassComplete';
    response.FFmpegMode = true;
    response.processFile = true;
    return response;
  } if (
    probeData.format.tags.NORMALISATIONSTAGE === 'FirstPassComplete'
  ) {
    const loudNormValues = await getloudNormValues(inputs, response, file);

    response.infoLog += `Loudnorm first pass values returned:  \n${JSON.stringify(loudNormValues)}`;

    // use parsed values in second pass
    response.preset = `-y<io>-af loudnorm=print_format=summary:linear=true:I=${loudNorm_i}:LRA=${lra}:TP=${tp}:`
      + `measured_i=${loudNormValues.input_i}:`
      + `measured_lra=${loudNormValues.input_lra}:`
      + `measured_tp=${loudNormValues.input_tp}:`
      + `measured_thresh=${loudNormValues.input_thresh}:offset=${loudNormValues.target_offset} `
      + '-c:a aac -b:a 192k -c:s copy -c:v copy -metadata NORMALISATIONSTAGE=Complete';
    response.FFmpegMode = true;
    response.processFile = true;
    response.infoLog += 'Normalisation pass processing \n';
    return response;
  } if (probeData.format.tags.NORMALISATIONSTAGE === 'Complete') {
    response.infoLog += 'File is already marked as normalised \n';
    return response;
  }
  // what is this tag?
  throw new Error(`Unknown normalisation stage tag: \n${probeData.format.tags.NORMALISATIONSTAGE}`);
};

module.exports.details = details;
module.exports.plugin = plugin;
