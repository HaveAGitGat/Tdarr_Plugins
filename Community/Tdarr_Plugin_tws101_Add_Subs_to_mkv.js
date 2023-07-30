const details = () => ({
  id: 'Tdarr_Plugin_tws101_Add_Subs_to_mkv',
  Stage: 'Pre-processing',
  Name: 'tws101 - Add Subs to mkv',
  Type: 'Video',
  Operation: 'Transcode',
  Description: ` Add Subtitles of chosen language tag to MKV. One tag only, Source files must be MKV and SRT.  All files must be in the same directory.
  Naming must be source.mkv and source.eng.srt where source is the same name and eng is the chosen language. If source.eng.srt is not found source.en.srt will be used instead.`,
  //    Created by tws101 
  //    Release Version 1.10
  Version: '1.10',
  Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
  Inputs: [
    {
      name: "language",
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Choose language tag to insert into the mkv'
        + ' Case-insensitive. Three letter tag and one tag only.',
    },
    {
      name: 'include_forced',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Forced subtitles will also be added, required naming is source.eng.forced.srt, this example assumes chosen tag is eng.`,
    },
    {
      name: 'include_sdh',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Sdh subtitles will also be added, required naming is source.eng.sdh.srt, this example assumes chosen tag is eng.`,
    },
    {
      name: 'include_cc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Sdh subtitles will also be added, required naming is source.eng.cc.srt, this example assumes chosen tag is eng.`,
    },
  ],
});

// #region Helper Classes/Modules

/**
 * Handles logging in a standardised way.
 */
class Log {
  constructor() {
    this.entries = [];
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  Add(entry) {
    this.entries.push(entry);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddSuccess(entry) {
    this.entries.push(`☑ ${entry}`);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddError(entry) {
    this.entries.push(`☒ ${entry}`);
  }

  /**
   * Returns the log lines separated by new line delimiter.
   */
  GetLogData() {
    return this.entries.join("\n");
  }
}

/**
 * Handles the storage of FFmpeg configuration.
 */
class Configurator {
  constructor(defaultOutputSettings = null) {
    this.shouldProcess = false;
    this.outputSettings = defaultOutputSettings || [];
    this.inputSettings = [];
  }

  AddInputSetting(configuration) {
    this.inputSettings.push(configuration);
  }

  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }

  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }

  RemoveOutputSetting(configuration) {
    const index = this.outputSettings.indexOf(configuration);

    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }

  GetOutputSettings() {
    return this.outputSettings.join(" ");
  }

  GetInputSettings() {
    return this.inputSettings.join(" ");
  }
}

// #endregion

// #region Plugin Methods

/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}  

/**
 * Keep all Video.    Map ALL  "-map 0"   Map Video  "-map 0:v"    Copy Video  "-c:v copy"
 */
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(["-map 0"]);
  return configuration;
}

/**
 * Keep all audio   Map Audio "-map 0:a"  Copy Audio  "-c:a copy"
 */
function buildAudioConfiguration(inputs, file, logger) {
  const configuration = new Configurator([""]);
  return configuration;
}

/**
 * Keep all subtitles  Map subs "-map 0:s?" Map Data "-map 0:d?" Map Attachments "-map 0:t?"   Copy Subs  "-c:s copy"     Copy all "-c copy"
 */
function buildSubtitleConfiguration(inputs, file, logger, otherArguments) {
  const configuration = new Configurator([""]);
  const fs = require("fs");
  const languages = require('@cospired/i18n-iso-languages');

  // Setup Required Variables
  const processLanguage = inputs.language.toLowerCase();
  const processLanguage2 = languages.alpha3BToAlpha2(processLanguage);
  const { originalLibraryFile } = otherArguments;
  let embeddedsubs = 0;
  let boolhavemain = false;
  let boolhaveforced = false;
  let boolhavesdh = false;
  let boolhavecc = false;

  //Loop through the streams
  function subProcess(stream, id) {
    embeddedsubs++;
    let lang = '';
    let title = '';
    let codec = '';
    if (stream.tags !== undefined) {
      if (stream.tags.language !== undefined) {
        lang = stream.tags.language.toLowerCase();
      }
      if (stream.tags.title !== undefined) {
        title = stream.tags.title.toLowerCase();
      }
    }
    if (stream.codec_name !== undefined) {
      codec = stream.codec_name.toLowerCase();
    }

    // Ignore these codecs
    if (codec !== 'subrip') {
      return;
    }

    // Ignore languages we dont want
    if (processLanguage !== lang && processLanguage2 !== lang) {
      return;
    }

    // Check these titles
    if (processLanguage === lang || processLanguage2 === lang) {
      if (stream.disposition.forced || (title.includes('forced'))) {
        boolhaveforced = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} forced disposition`);
        return;
      } else if (stream.disposition.sdh || (title.includes('sdh'))) {
        boolhavesdh = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} sdh disposition`);
        return;
      } else if (stream.disposition.cc || (title.includes('cc'))) {
        boolhavecc = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} cc disposition`);
        return;
      } else if (stream.disposition.commentary || stream.disposition.description
        || (title.includes('commentary')) || (title.includes('description'))) {
        return;
      } else if (stream.disposition.lyrics
        || (title.includes('signs')) || (title.includes('songs'))) {
        return;
      } else {
        boolhavemain = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} `);
        return;
      }
    }
  }

  loopOverStreamsOfType(file, "subtitle", subProcess);

  //Determine what we are needing
  let getforced = false;
  let getsdh = false;
  let getcc = false;
  if (inputs.include_forced === true) {
    getforced = true;
  }
  if (inputs.include_sdh === true) {
    getsdh = true;
  }
  if (inputs.include_cc === true) {
    getcc = true;
  }

  //Check if all Good
  let convert = false;
  if (boolhavemain === false) {
    convert = true;
  }
  if (getforced === true) {
    if (boolhaveforced === false) {
      convert = true;
    }
  }
  if (getsdh === true) {
    if (boolhavesdh === false) {
      convert = true;
    }
  }
  if (getcc === true) {
    if (boolhavecc === false) {
      convert = true;
    }
  }
  if (convert === false) {
    return configuration;
  }

  logger.AddError(`Did not find all requested ${processLanguage} streams with subrip codec, looking for srt.`);

  //Setup Variable to Trasnscode
  let boolfoundmainsrt = false;
  let boolfoundforcedsrt = false;
  let boolfoundsdhsrt = false;
  let boolfoundccsrt = false;
  const dispmain = '';
  const dispforced = '.forced';
  const dispsdh = '.sdh';
  const dispcc = '.cc';

  function buildsrtfile(lang, disposition) {
    let srtfile = "";
    if (originalLibraryFile && originalLibraryFile.file) {
      srtfile = originalLibraryFile.file;
    } else {
      srtfile = file.file;
    }
    srtfile = srtfile.split(".");
    srtfile[srtfile.length - 2] += `.${lang}${disposition}`;
    srtfile[srtfile.length - 1] = "srt";
    srtfile = srtfile.join(".");
    return srtfile;
  }

  const mainsubfile = buildsrtfile(processLanguage, dispmain);
  const mainaltsubfile = buildsrtfile(processLanguage2, dispmain);
  const forcedsubfile = buildsrtfile(processLanguage, dispforced);
  const forcedaltsubfile = buildsrtfile(processLanguage2, dispforced);
  const sdhsubfile = buildsrtfile(processLanguage, dispsdh);
  const sdhaltsubfile = buildsrtfile(processLanguage2, dispsdh);
  const ccsubfile = buildsrtfile(processLanguage, dispcc);
  const ccaltsubfile = buildsrtfile(processLanguage2, dispcc);

  //Check to make sure srt exists
  function findsrtfile(subfile, altsubfile) {
    if (fs.existsSync(`${subfile}`)) {
      return subfile;
    } else if (fs.existsSync(`${altsubfile}`)) {
      return altsubfile;
    }
  }

  const mainchosensubsfile = findsrtfile(mainsubfile, mainaltsubfile);
  if (mainchosensubsfile != null) {
    boolfoundmainsrt = true;
  }
  const forcedchosensubsfile = findsrtfile(forcedsubfile, forcedaltsubfile);
  if (forcedchosensubsfile != null) {
    boolfoundforcedsrt = true;
  }
  const sdhchosensubsfile = findsrtfile(sdhsubfile, sdhaltsubfile);
  if (sdhchosensubsfile != null) {
    boolfoundsdhsrt = true;
  }
  const ccchosensubsfile = findsrtfile(ccsubfile, ccaltsubfile);
  if (ccchosensubsfile != null) {
    boolfoundccsrt = true;
  }

  //Trascode
  let subindex = 1;
  const trantitlepmain = 'default';
  const logdispmain = 'disposition default';
  const trantitleforced = 'forced';
  const logdispforced = 'disposition forced';
  const trantitlesdh = 'sdh';
  const logdispsdh = 'disposition sdh';
  const trantitlecc = 'cc';
  const logdispcc = 'disposition cc';

  function transcode(chosensubsfile, title, displog) {
    logger.AddError(`Adding SRT ${chosensubsfile} to MKV ${displog}`);
    let disposition = title;
    if (disposition === 'sdh' || disposition === 'cc') {
      disposition = 'hearing_impaired';
    }
    configuration.AddInputSetting(` -sub_charenc "UTF-8" -f srt -i "${chosensubsfile}"`);
    configuration.AddOutputSetting(
      ` -map ${subindex}:s -metadata:s:s:${embeddedsubs} language=${processLanguage} -metadata:s:s:${embeddedsubs} title=${title} -disposition:s:${embeddedsubs} ${disposition}`
      );
    embeddedsubs++;
    subindex++;
  }

  if (boolfoundmainsrt === true) {
    transcode(mainchosensubsfile, trantitlepmain, logdispmain);
  }
  if (boolfoundforcedsrt === true && getforced === true) {
    transcode(forcedchosensubsfile, trantitleforced, logdispforced);
  }
  if (boolfoundsdhsrt === true && getsdh === true) {
    transcode(sdhchosensubsfile, trantitlesdh, logdispsdh);
  }
  if (boolfoundccsrt === true && getcc === true) {
    transcode(ccchosensubsfile, trantitlecc, logdispcc);
  }

  return configuration;
}

// #end region

// #Final Region
// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
// eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  const logger = new Log();

  // Begin Abort Section

  // Verify video
  if (file.fileMedium !== 'video') {
    logger.AddError("File is not a video.");
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  // Verify MKV
  if (file.container !== 'mkv') {
    logger.AddError("File is not an MKV.");
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }
  
  // End Abort Section

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger, otherArguments);

  response.preset = `${videoSettings.GetInputSettings()},${subtitleSettings.GetInputSettings()} ${videoSettings.GetOutputSettings()}`
  response.preset += ` ${audioSettings.GetOutputSettings()}`
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`
  response.preset += ` -c copy`;

  response.processFile =
    subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("No need to process file");
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
