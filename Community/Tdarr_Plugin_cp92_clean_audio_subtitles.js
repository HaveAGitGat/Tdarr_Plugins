/* eslint-disable no-await-in-loop */
module.exports.dependencies = ['axios@0.27.2', '@cospired/i18n-iso-languages'];
// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_cp92_clean_audio_subtitles',
  Stage: 'Pre-processing',
  Name: 'Clean audio and subtitle streams',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: `This plugin is a combination of other plugins to clean the audio and subtitle streams. No video transcoding happens here.
    For AUDIO streams, it will look for the original language in Radarr/Sonarr or TMDB to KEEP it, 
    it will also keep any additional audio stream based on the parameter audio_language (ISO-639-2), and it will remove the rest, including commentary audio stream.
    For SUBTITLE streams, it will keep subtitles based on the parameter subtitle_language (ISO-639-2) and remove based on the parameter subtitle_codecs (e.g. hdmv_pgs_subtitle). 
    If the subtitle_language is left empty, it will remove all subtitles. 
    If a subtitle is found with a codec specified in the parameter subtitle_codecs it will be removed regardless of the parameter subtitle_language.`,
  Version: '1.0',
  Tags: 'pre-processing,configurable,ffmpeg,audio,subtitle',
  Inputs: [
    {
        name: 'audio_language',
        type: 'string',
        defaultValue: '',
        inputUI: {
            type: 'text',
        },
        tooltip:
            'Input a comma separated list of ISO-639-2 languages. It will still keep English and undefined tracks.'
            + '(https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes 639-2 column)'
            + '\\n Example:\\n '
            + 'nld,nor',
    },
    {
        name: 'priority',
        type: 'string',
        defaultValue: 'Radarr',
        inputUI: {
            type: 'text',
        },
        tooltip:
            'Priority for either Radarr or Sonarr. Leaving it empty defaults to Radarr first.'
            + '\\n Example:\\n '
            + 'sonarr',
    },
    {
        name: 'api_key',
        type: 'string',
        defaultValue: '',
        inputUI: {
            type: 'text',
        },
        tooltip:
            'Input your TMDB api (v3) key here. (https://www.themoviedb.org/)',
    },
    {
        name: 'radarr_api_key',
        type: 'string',
        defaultValue: '',
        inputUI: {
            type: 'text',
        },
        tooltip: 'Input your Radarr api key here.',
    },
    {
        name: 'radarr_url',
        type: 'string',
        defaultValue: '192.168.1.2:7878',
        inputUI: {
            type: 'text',
        },
        tooltip:
            'Input your Radarr url here. (Without http://). Do include the port.'
            + '\\n Example:\\n '
            + '192.168.1.2:7878',
    },
    {
        name: 'sonarr_api_key',
        type: 'string',
        defaultValue: '',
        inputUI: {
            type: 'text',
        },
        tooltip: 'Input your Sonarr api key here.',
    },
    {
        name: 'sonarr_url',
        type: 'string',
        defaultValue: '192.168.1.2:8989',
        inputUI: {
            type: 'text',
        },
        tooltip:
            'Input your Sonarr url here. (Without http://). Do include the port.'
            + '\\n Example:\\n '
            + '192.168.1.2:8989',
    },
    {
        name: 'subtitle_language',
        type: 'string',
        defaultValue: 'eng',
        inputUI: {
            type: 'text',
        },
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep.
                        \\n Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                    \\n Example:\\n 
                    eng

                    \\n Example:\\n 
                    eng,jpn`,
    },
    {
        name: "subtitle_codecs",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify key words here for subtitle tracks you'd like to have removed. Will remove subtitles regardless of the subtitle language parameter.
                            \\n Example:\\n 
                             hdmv_pgs_subtitle
                             \\n Example:\\n 
                            hdmv_pgs_subtitle,dvd_subtitle`,
      }
  ],
});
const response = {
  processFile: false,
  preset: ', -map 0 ',
  container: '.',
  handBrakeMode: false,
  FFmpegMode: true,
  reQueueAfter: false,
  infoLog: '',
};

const processStreams = (result, file, user_langs, sub_codecs,sub_lang) => {
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  const tracks = {
    keep: [],
    keepSub: [],
    remove: [],
    remLangs: '',
    removeSub:[]
  };
  let streamIndex = 0;
  let substreamIndex = 0;
  // If the original language is pulled as Chinese 'cn' is used.  iso-language expects 'zh' for Chinese.
  const langsTemp = result.original_language === 'cn' ? 'zh' : result.original_language;

  let langs = [];
  let subtitle_codecs = [];
  let subtitle_langs = [];

  langs.push(languages.alpha2ToAlpha3B(langsTemp));

  // Some console reporting for clarification of what the plugin is using and reporting.
  response.infoLog += `Original language: ${langsTemp}, Using code: ${languages.alpha2ToAlpha3B( langsTemp,  )}\n `;

  if (user_langs) {
    for(const z of user_langs){
        if (!langs.includes(z)){
            langs.push(z);
        } 
    }
  }
  
  if (!langs.includes('eng')){
    langs.push('eng');
  } 

  if (sub_codecs) {
    subtitle_codecs = subtitle_codecs.concat(sub_codecs);
  }

  if (sub_lang) {
    subtitle_langs = subtitle_langs.concat(sub_lang);
  }

  response.infoLog += 'Keeping audio languages: ';
  // Print languages to UI
  langs.forEach((l) => {
    response.infoLog += `${languages.getName(l, 'en')}, `;
  });

  response.infoLog = `${response.infoLog.slice(0, -2)}\n `;

  response.infoLog += 'Removing subtitles based on codec: ';
  // Print languages to UI
  subtitle_codecs.forEach((l) => {
    response.infoLog += `${l}, `;
  });

  response.infoLog = `${response.infoLog.slice(0, -2)}\n `;

  response.infoLog += 'Keeping subtitles based on language: ';
  // Print languages to UI
  subtitle_langs.forEach((l) => {
    response.infoLog += `${l}, `;
  });

  response.infoLog = `${response.infoLog.slice(0, -2)}\n `;

  // eslint-disable-next-line no-restricted-syntax
  for (const stream of file.ffProbeData.streams) {
    if (stream.codec_type === 'audio') {

        if (langs.includes(stream.tags.language) && 
            stream.disposition.comment !== 1 &&
            !stream.tags.title.toLowerCase().includes("commentary")
            ) {
            
          tracks.keep.push(streamIndex);
        } else {
          tracks.remove.push(streamIndex);
          response.preset += `-map -0:a:${streamIndex} `;
          tracks.remLangs += `${languages.getName(stream.tags.language,'en',)}, `;
        }
        streamIndex += 1;

    }


    if (stream.codec_type === "subtitle"){
    
        if( !subtitle_langs.includes(stream.tags.language) ||
            subtitle_codecs.includes(stream.codec_name.toLowerCase()) ||
            stream.tags.title.toLowerCase().includes('commentary') || 
            stream.tags.title.toLowerCase().includes('description') || 
            stream.tags.title.toLowerCase().includes('sdh') 
            
        ) {
            response.preset += `-map -0:s:${substreamIndex} `;
            tracks.removeSub.push(substreamIndex);
            
        } else {
            tracks.keepSub.push(substreamIndex);
        }

        substreamIndex += 1;
    }

  }
  response.preset += ' -c copy ';
  return tracks;
};

const tmdbApi = async (filename, api_key, axios) => {
  let fileName;
  // If filename begins with tt, it's already an imdb id
  if (filename) {
    if (filename.slice(0, 2) === 'tt') {
      fileName = filename;
    } else {
      const idRegex = /(tt\d{7,8})/;
      const fileMatch = filename.match(idRegex);
      // eslint-disable-next-line prefer-destructuring
      if (fileMatch) fileName = fileMatch[1];
    }
  }

  if (fileName) {
    const result = await axios
      .get(
        `https://api.themoviedb.org/3/find/${fileName}?api_key=`
        + `${api_key}&language=en-US&external_source=imdb_id`,
      )
      .then((resp) => (resp.data.movie_results.length > 0
        ? resp.data.movie_results[0]
        : resp.data.tv_results[0]));

    if (!result) {
      response.infoLog += '☒No IMDB result was found. \n ';
    }
    return result;
  }
  return null;
};

// eslint-disable-next-line consistent-return
const parseArrResponse = (body, filePath, arr) => {
  // eslint-disable-next-line default-case
  switch (arr) {
    case 'radarr':
      return body.movie;
    case 'sonarr':
      return body.series;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved
  const axios = require('axios').default;

  response.container = `.${file.container}`;
  let prio = ['radarr', 'sonarr'];
  let radarrResult = null;
  let sonarrResult = null;
  let tmdbResult = null;

//validate if there is more than 1 audio stream, if not, no need to call the api
  if (file.ffProbeData.streams.filter((stream) => stream.codec_type.toLowerCase() === 'audio').length > 1){

    if (inputs.priority) {
        if (inputs.priority === 'sonarr') {
        prio = ['sonarr', 'radarr'];
        }
    }

    const fileNameEncoded = encodeURIComponent(file.meta.FileName);

    // eslint-disable-next-line no-restricted-syntax
    for (const arr of prio) {
        let imdbId;
        // eslint-disable-next-line default-case
        switch (arr) {
        case 'radarr':
            if (tmdbResult) break;
            if (inputs.radarr_api_key) {
            radarrResult = parseArrResponse(
                await axios
                .get(
                    `http://${inputs.radarr_url}/api/v3/parse?apikey=${inputs.radarr_api_key}&title=${fileNameEncoded}`
                )
                .then((resp) => resp.data),
                fileNameEncoded,
                'radarr',
            );

            if (radarrResult) {
                imdbId = radarrResult.imdbId;
                response.infoLog += `Grabbed ID (${imdbId}) from Radarr \n `;
                // eslint-disable-next-line import/no-unresolved
                const languages = require('@cospired/i18n-iso-languages');
                tmdbResult = { original_language: languages.getAlpha2Code(radarrResult.originalLanguage.name, 'en') };
            } else {
                response.infoLog += "Couldn't grab ID from Radarr \n ";
                imdbId = fileNameEncoded;
            }
            }
            break;
        case 'sonarr':
            if (tmdbResult) break;
            if (inputs.sonarr_api_key) {
                sonarrResult = parseArrResponse(
                    await axios.get(
                    `http://${inputs.sonarr_url}/api/v3/parse?apikey=${inputs.sonarr_api_key}&title=${fileNameEncoded}`
                    )
                    .then((resp) => resp.data),
                    file.meta.Directory,
                    'sonarr',
                );

                if (sonarrResult) {
                    imdbId = sonarrResult.imdbId;
                    response.infoLog += `Grabbed ID (${imdbId}) from Sonarr \n `;
                } else {
                    response.infoLog += "Couldn't grab ID from Sonarr \n ";
                    imdbId = fileNameEncoded;
                }
                tmdbResult = await tmdbApi(imdbId, inputs.api_key, axios);
                }
            }
    }
  } else {
    //if there is a single audio stream, get the language from ffprobe data
    const languages = require('@cospired/i18n-iso-languages');
    tmdbResult = { original_language: languages.alpha3BToAlpha2( `${(file.ffProbeData.streams.filter((stream) => stream.codec_type.toLowerCase() === 'audio').flatMap((stream) => stream.tags?.language)[0])}` ) };
    response.infoLog += `Single audio stream found: ${tmdbResult.original_language}. \n `;
  }

  if (tmdbResult) {
    const tracks = processStreams(
      tmdbResult,
      file,
      inputs.audio_language ? inputs.audio_language.split(',') : '',
      inputs.subtitle_codecs ? inputs.subtitle_codecs.split(",") : '',
      inputs.subtitle_language ? inputs.subtitle_language.split(",") : ''
    );

    if (tracks.remove.length > 0 || tracks.removeSub.length > 0) {
      if (tracks.keep.length > 0) {
        if (tracks.remove.length > 0){
            response.infoLog += `☑Removing ${tracks.remove.length} audio stream with languages: ${tracks.remLangs.slice( 0, -2, )}. \n `;
        }else{
            response.infoLog += `☑No audio stream to be removed. \n `;
        }

        if (tracks.removeSub.length > 0){
            response.infoLog += `☑Removing - ${tracks.removeSub.length} - subtitle stream. \n `;
        }else{
            response.infoLog += `☑No subtitle stream to be removed. \n `;
        }
        
        
        response.processFile = true;
        response.infoLog += '\n ';
      } else {
        response.infoLog += '☒Cancelling plugin otherwise all audio streams would be removed. \n ';
      }
    } else {
      response.infoLog += '☒No audio or subtitle streams to be removed. \n ';
    }
  } else {
    response.infoLog += "☒Couldn't find the IMDB id of this file. Skipping. \n ";
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
