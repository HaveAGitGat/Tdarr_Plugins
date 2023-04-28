/* eslint-disable no-await-in-loop */
// tdarrSkipTest
module.exports.dependencies = ['@cospired/i18n-iso-languages'];
const details = () => ({
  id: "Tdarr_Plugin_townsste_Add_Subtitles",
  Stage: "Pre-processing",
  Name: "Add subtitles to MKV files",
  Type: "Subtitle",
  Operation: 'Transcode',
  Description: `This plugin will add srt and vobsub (.sub & .idx) files to an mkv file and then rename and 
    optionally delete the subtitles that are in your media directory along side the video file.\\n
	Sutitles can be named according to the ISO 639-1 (en) or ISO 639-2 (eng) language code.\\n
	Supports forced and SDH naming.\\n
	A subtitle can look like: [mkv file name]eng.forced.srt, [mkv file name]en.srt, [mkv file name]en.sdh.srt.\\n`,
  Version: "1.0",
  Tags: "pre-processing,ffmpeg,subtitle only,configurable",
  Inputs: [/*{
      name: "subtitle_language_temp",
      type: 'string',
      defaultValue:'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter subtitle language you would like to add in ISO 639-1 or 639-2 format .\\n Default: eng\\nExample:\\neng`,
    },*/
  {
	  name: "subtitle_language",
      type: 'string',
      defaultValue:'eng',
      inputUI: {
          type: 'dropdown',
          options: [
            'aar','abk','ave','afr','aka','amh','arg','ara','asm','ava','aym','aze','bak','bel','bul','bih',
			'bis','bam','ben','bod','bre','bos','cat','che','cha','cos','cre','ces','chu','chv','cym','dan',
			'deu','div','dzo','ewe','ell','eng','epo','spa','est','eus','fas','ful','fin','fij','fao','fra',
			'fry','gle','gla','glg','grn','guj','glv','hau','heb','hin','hmo','hrv','hat','hun','hye','her',
			'ina','ind','ile','ibo','iii','ipk','ido','isl','ita','iku','jpn','jav','kat','kon','kik','kua',
			'kaz','kal','khm','kan','kor','kau','kas','kur','kom','cor','kir','lat','ltz','lug','lim','lin',
			'lao','lit','lub','lav','mlg','mah','mri','mkd','mal','mon','mar','msa','mlt','mya','nau','nob',
			'nde','nep','ndo','nld','nno','nor','nbl','nav','nya','oci','oji','orm','ori','oss','pan','pli',
			'pol','pus','por','que','roh','run','ron','rus','kin','san','srd','snd','sme','sag','sin','slk',
			'slv','smo','sna','som','sqi','srp','ssw','sot','sun','swe','swa','tam','tel','tgk','tha','tir',
			'tuk','tgl','tsn','ton','tur','tso','tat','twi','tah','uig','ukr','urd','uzb','ven','vie','vol',
			'wln','wol','xho','yid','yor','zha','zho','zul',

          ],
        },
      tooltip: `Enter subtitle language you would like to add.\\n Default: eng\\nExample:\\neng`,
  },
	
  {
	  name: "subtitle_remove",
      type: 'boolean',
      defaultValue:'false',
      inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
      tooltip: `Select whether to remove or keep along side subtitles`,
  },
  ],
});
const response = {
    processFile: false,
	container: ".mkv",
	preset: '<io>',
	presetImport: '',
	presetMeta: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles... \n`,
  };

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const fs = require("fs");
  const path = require('path');
  const languages = require("@cospired/i18n-iso-languages");
  
  // FLAGS
  var found_subtitle_stream = 0;
  var sub_location = 0; //becomes first subtitle stream
  var new_subs = 0; //count the new subs
  var added_subs = 0; //counts the amount of subs that have been mapped

  // FS
  const media = otherArguments?.originalLibraryFile?.file || file?.ffProbeData?.format?.filename;
  const mediaDir = path.parse(media).dir;
  const filename = path.parse(media).name;
  
  // Convert to ISO 639-1 to 639-2
  const language = inputs.subtitle_language.toLowerCase();
  let langISO = null;
  const langISO1 = languages.alpha3TToAlpha2(language);
  const langISO2 = language;
  
  /*
  let langISO1 = null;
  let langISO2 = null;
  
  // Check valid code
  if (languages.isValid(language)){
	  if (language.trim().length == 2){
		langISO1 = language;
		langISO2 = languages.alpha2ToAlpha3T(language);
	  }
	  else {
		langISO2 = language;
		// If the original language is Chinese 'chi' iso-language expects 'zh'.
	    langISO1 = inputs.subtitle_language.toLowerCase() === 'chi' ? 'zh' : languages.alpha3TToAlpha2(language);
	  }   
  } else {
	response.infoLog += '☒Cancelling plugin. Plugin language not a valid code.\n';
    return response;
  }
  */
  
  // Check availiable subs
  const isForced = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.forced.srt`)) ? true : 
				   (fs.existsSync(`${mediaDir}/${filename}.${langISO2}.forced.srt`)) ? true : 
				   false;
  const isNormal = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.srt`)) ? true : 
				   (fs.existsSync(`${mediaDir}/${filename}.${langISO2}.srt`)) ? true :
				   false;
  const isSDH = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.sdh.srt`)) ? true : 
				(fs.existsSync(`${mediaDir}/${filename}.${langISO2}.sdh.srt`)) ? true :
				false;
  const isVobsub = (fs.existsSync(`${mediaDir}/${filename}.sub`) && fs.existsSync(`${mediaDir}/${filename}.idx`)) ? true : 
				   false;

  /*				   
  // Check if subs found
  if (!isForced && !isNormal && !isSDH && !isVobsub) {
	response.infoLog += '☒Cancelling plugin. No valid subtitles found.\n';
    return response;
  }
 */

  // Check if in .mkv
  if (path.parse(file?.ffProbeData?.format?.filename).ext !== '.mkv') {
    response.infoLog += '☒Cancelling plugin. File is not mkv.\n';
    return response;
  }
 
  // find first subtitle stream location
  while (found_subtitle_stream == 0 && sub_location < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub_location].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub_location++;
    }
  }

  // FORCED SRT
  if (isForced){
	response.infoLog += `☑Found Forced Sub \n`;
	langISO = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.forced.srt`)) ? langISO1 : 
			  (fs.existsSync(`${mediaDir}/${filename}.${langISO2}.forced.srt`)) ? langISO2 : 
			  null;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.forced.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=FORCED -disposition:s:${new_subs} forced -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
    try {
	  fs.renameSync(`${mediaDir}/${filename}.${langISO}.forced.srt`, `${mediaDir}/${filename}.merge.${langISO}.forced.srt`, {
        overwrite: true,
      });
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  // remove sub
  else if ((fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.forced.srt`) || 
		    fs.existsSync(`${mediaDir}/${filename}.merge.${langISO2}.forced.srt`)) && 
			inputs.subtitle_remove){
      response.infoLog += `☑Removing Forced Sub \n`;
    try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO1}.forced.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
	try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO2}.forced.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  
  // NORMAL SRT
  if (isNormal){
	response.infoLog += `☑Found Sub \n`;
	langISO = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.srt`)) ? langISO1 : 
			  (fs.existsSync(`${mediaDir}/${filename}.${langISO2}.srt`)) ? langISO2 : 
			  null;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=${language.toUpperCase()} -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
    try {
	  fs.renameSync(`${mediaDir}/${filename}.${langISO}.srt`, `${mediaDir}/${filename}.merge.${langISO}.srt`, {
        overwrite: true,
      });
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  // remove sub
  else if ((fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.srt`) || 
		    fs.existsSync(`${mediaDir}/${filename}.merge.${langISO2}.srt`)) && 
			inputs.subtitle_remove){
	  response.infoLog += `☑Removing Sub \n`;
    try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO1}.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
	try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO2}.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }

  // SDH SRT
  if (isSDH){
	response.infoLog += `☑Found SDH Sub \n`;
	langISO = (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.sdh.srt`)) ? langISO1 : 
			  (fs.existsSync(`${mediaDir}/${filename}.${langISO2}.sdh.srt`)) ? langISO2 : 
			  null;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.sdh.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=SDH -disposition:s:${new_subs} hearing_impaired -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
    try {
	  fs.renameSync(`${mediaDir}/${filename}.${langISO}.sdh.srt`, `${mediaDir}/${filename}.merge.${langISO}.sdh.srt`, {
        overwrite: true,
      });
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  // remove sub
  else if ((fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.sdh.srt`) || 
		    fs.existsSync(`${mediaDir}/${filename}.merge.${langISO2}.sdh.srt`)) && 
			inputs.subtitle_remove){
      response.infoLog += `☑Removing SDH Sub \n`;
    try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO1}.sdh.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
	try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO2}.sdh.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  
  // VOBSUB
  if (fs.existsSync(`${mediaDir}/${filename}.sub`) && fs.existsSync(`${mediaDir}/${filename}.idx`)) {
	response.infoLog += `☑Found vobsub Sub \n`;
	response.presetImport += ` -f vobsub -sub_name "${mediaDir}/${filename}.merge.sub" -i "${mediaDir}/${filename}.merge.idx"`;
	new_subs++;
  // append
	fs.renameSync(`${mediaDir}/${filename}.sub`, `${mediaDir}/${filename}.merge.sub`);
	fs.renameSync(`${mediaDir}/${filename}.idx`, `${mediaDir}/${filename}.merge.idx`);
  }
  // remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.sub`) && fs.existsSync(`${mediaDir}/${filename}.merge.idx`) && inputs.subtitle_remove){
      response.infoLog += `☑Removing vobsub Sub Files \n`;
	try {
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.sub`);
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.idx`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }

  response.preset += response.presetImport + response.presetMeta + `-map 0:v -map 0:a`;

  // map new subs
  while (added_subs < new_subs) {
    added_subs++;
    response.preset += ` -map ${added_subs}:s`;
  }

  // if new subs have been found they will be added
  if (new_subs > 0) {
    response.FFmpegMode = true;
    response.processFile = true;
    response.reQueueAfter = true;
    if (found_subtitle_stream == 1) {
      response.preset += ` -map 0:s `;
    }
    response.preset += ` -c copy`;
    response.infoLog += `☑${new_subs} new subs will be added \n`;
  } else {
    response.infoLog += `☑No new subtitle languages were found \n`;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
