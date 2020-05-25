//////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Author: JarBinks
//  Date: 05/21/2020
//
//  This is my attempt to create an all in one routine that will maintain my library in optimal format !!!!FOR MY REQUIREMENTS!!!!
//      Chances are very good you will need to make some changes to this routine and it's partner in order to make it work for you
//      Chances are also very good you will need to run linux commands and learn about ffmpeg, vaapi, Tdarr and this script
//
//  With that out of the way...Tdarr is awesome because it allowed me to create data driven code that makes my library the best it could be.
//      Thanks to everyone involved. Especially HaveAGitGat and Migz whos existing code and assistance were invaluable
//
//  My belief is that given enough information about the video file an optimal configuration can be determined specific to that file
//      This is based on what my goals are and uses external programs to gather as much useful information as possible to make decisions
//      There is a lot that goes into the gather and analysis part because:
//          It is the basis of the decisions and "garbage in, garbage out"
//          The video files are far from perfect when we get them and we need to make sure we learn as much as possible
//
//  The script adds metatags to the media files to control processing, or better yet not doing extra processing on the same file
//      This is especially useful when resetting Tdarr because each file gets touched again, so this expedites a full library scan
//      Tdarr does not seem to handle when a plugin code takes a while to run so all effort has been made minimize time within the plugin code
//          This is especially noticeable on a library reset and these scripts because of the extra time spent analyzing the media files
//
//  (TODO: If the file name has non standard characters in it some calls to external programs will fail, I have seen it in about 0.2% of files)
//
//  Video:  (Only one video stream is used!!)
//      The script computes a desired bitrate based on the following equation
//      (videoheight * videowidth * videoFPS) * targetcodeccompression
//      The first 3 give a raw number of bits that the stream requires, however with encoding there is a certain amount of acceptable loss, this is targetcodeccompression
//      This number is pretty low for hevc. I have found 0.055 to be about the norm.
//      This means that for hevc only 5.5% of the raw bitrate is necessary to produce some decent results and actually I have used, and seen, as low as 3.5%
//
//      If the source video is less than this rate the script will either:
//          Copy the existing stream, if the codec is hevc
//          Transcode the stream to hevc using 80% of the original streams bitrate
//              It could probably be less but if the source is of low bitrate we don’t want to compromise too much on the transcode
//
//      If the source media bitrate is close, within 10%, of the target bitrate and the codec is hevc, it will copy instead of transcode to preserve quality
//
//      The script will do an on chip transcode, meaning the decode and encode is all done on chip, except for mpeg4 which must be decoded on the CPU
//
//      (TODO: Videos with a framerate higher than a threshold, lets say 30, should be changed)
//
//  Audio:  (Only one audio stream is used!!)
//      The script will choose one audio stream in the file that has:
//          The desired language
//          The highest channel count
//      If the language is not set on the audio track it assumes it is in the desired language
//
//      The audio bit rate is set to a threshold, currently 64K, * number channels in AAC.  This seems to give decent results
//
//      If the source audio is less than this rate the script will either:
//          Copy the existing stream, if the codec is aac
//          Transcode the stream to aac using 100% of the original streams bitrate
//              It could probably be less but if the source is of low bitrate but, we don’t want to compromise too much on the transcode
//
//  Subtitles:
//      All are copied (They usually take up little space so I keep them)
//      Any that are in mov_text will be converted to srt
//
//  Chapters:
//      If chapters are found the script keeps them unless...
//          Any chapter start time is a negative number (Yes I have seen it)
//          Any duplicate start times are found
//
//      (TODO: incomplete chapter info gets added to or removed...I have seen 2 chapters in the beginning and then nothing)
//
//      The second routine will add chapters at set intervals to any file that has no chapters
//
//  Metadata:
//      Global metadata is cleared, I.E. title
//      Stream specific metadata is copied
//
//  Some requirements: (You should really really really really read this!!!)
//!!!!! Docker on linux !!!!!
//      Intel QSV compatible processor, I run it on an i5-9400 and I know earlier models have no HEVC capability or produce lessor results
//
//  First off the Matching pair:
//      Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile (JB - QSV(vaapi), H265, AAC, MKV, bitrate optimized)
//      Tdarr_Plugin_JB69_JBHEVCQSZ_PostFix (JB - MKV Stats, Chapters, Audio Language)
//
//  The order I run them in:
//      Tdarr_Plugin_lmg1_Reorder_Streams  //I am not sure this is necessary but I have not tested it but it seems like a good idea
//      Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile (JB - H265, AAC, MKV, bitrate optimized)
//      Tdarr_Plugin_JB69_JBHEVCQSZ_PostFix (JB - MKV Stats, Chapters, Audio Language)
//
//  I am running the docker image provided for Tdarr, however there are some additions that must be added in order for the script to run
//      This is to add mediainfo and mkvtoolnix because these are used to get more media info and update the file without running a transcode
//
//  Here is my docker config (I am running compose so yours might be a little different)
//    Tdarr:
//      image: haveagitgat/tdarr_aio:qsv
//      container_name: tdarr
//      restart: unless-stopped
//      network_mode: host
//    ports:
//      - "8265:8265"
//    environment:
//      - PUID=${PUID} # default user id, defined in .env
//      - PGID=${PGID} # default group id, defined in .env
//      - TZ=${TZ} # timezone, defined in .env
//    devices:
//      - /dev/dri:/dev/dri
//    volumes:
//      - "${ROOT}/complete:/home/Tdarr/Media:rw"
//      - /transtemp:/transtemp
//      - "${ROOT}/config/Tdarr:/home/Tdarr/Documents/Tdarr:rw"
//      - "/etc/localtime:/etc/localtime:ro"
//
//  I then connect to the docker container by using the following command
//      sudo docker exec -it tdarr /bin/bash
//
//  Here is the script that I run after the docker container is up and running (This requires a couple of (y)es'es to complete)
//      sudo apt-get install wget
//      sudo wget https://mediaarea.net/repo/deb/repo-mediaarea_1.0-12_all.deb && sudo dpkg -i repo-mediaarea_1.0-12_all.deb && sudo apt-get update
//      sudo apt-get install mediainfo
//
//      sudo wget -q -O - https://mkvtoolnix.download/gpg-pub-moritzbunkus.txt | sudo apt-key add -
//      sudo sh -c 'echo "deb https://mkvtoolnix.download/ubuntu/ bionic main" >> /etc/apt/sources.list.d/bunkus.org.list'
//      sudo sh -c 'echo "deb-src https://mkvtoolnix.download/ubuntu/ bionic main" >> /etc/apt/sources.list.d/bunkus.org.list'
//      sudo apt update
//      sudo apt install mkvtoolnix
//
//////////////////////////////////////////////////////////////////////////////////////////////////////

function details() {
    return {
        id: "Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile",
        Stage: "Pre-processing",
        Name: "JB - QSV(vaapi), H265, AAC, MKV, bitrate optimized",
        Type: "Video",
        Operation: "Transcode",
        Description: "***You should not use this*** until you read the comments at the top of the code and understand how it works **this does alot** and is 1 of 2 routines you should to run **Part 1** \n",
        Version: "1.0",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile.js",

        Tags: "3rd party,pre-processing,ffmpeg,video,audio,qsv h265,aac"
    }
}

function plugin(file, librarySettings, inputs, otherArguments) {

    var response = {
        processFile: false,
        preset: "",
        container: ".mkv",
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: ""
    }

    var currentfilename = file._id.replace(/'/g, "'\"'\"'");

    //Settings
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    var intStatsDays = 21; //If the stats date on the file, usually for mkv only, are older than this it will first update them

    var targetvideocodec = "hevc"; //This is the basis of the routine, if you want to change it you probably want to use a different script
    var maxvideoheight = 1080;  //Any thing over this size, I.E. 4K, will be reduced to this
    var targetcodeccompression = .055;  //This effects the target bitrate by assuming a compresion ratio
    var targetreductionforcodecswitchonly = .8; //When a video codec change happens and the source bitrate is lower than optimal, we still lower the bitrate by this since hevc is ok with a lower rate

    //Since videos can have many widths and heights we need to convert to pixels (WxH) to understand what we are dealing with and set a minimal optimal bitrate to not go below
    var minvideopixels4K = 6500000;
    var minvideorate4K = 8500000;

    var minvideopixels2K = 1500000;
    var minvideorate2K = 2400000;

    var minvideopixelsHD = 750000;
    var minvideorateHD = 1100000;

    var minvideorateSD = 450000;

    var targetaudiocodec = "aac";  //Desired Audio Coded, if you change this it will might require code changes
    var targetaudiolanguage = "eng"; //Desired Audio Language
    var targetaudiobitrateperchannel = 64000;  //64K per channel gives you the good lossy quality out of AAC
    var targetaudiochannels = 6; //Any thing above this number of channels will be reduced to it, because I cannot listen to it
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    var proc = require('child_process');
    var bolStatsAreCurrent = false;

    //Run MediaInfo and load the results it into an object
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    response.infoLog += "Getting Media Info.\n";
    var objMedInfo = "";
    objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentfilename + '" --output=JSON').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    //    response.processFile = false;
    //    response.infoLog += objMedInfo + " \n";
    //    return response;

    //response.infoLog += `HomePath: ${JSON.stringify(otherArguments, null, 4)}\n`;
    //response.infoLog += `FIID: ${file._id}\n`;
    //response.infoLog += `IPID: ${inputs._id}\n`;
    //response.infoLog += `FIDB: ${JSON.stringify(file, null, 4)}\n`;
    //response.infoLog += `CacheDir: ${librarySettings.cache}\n`;
    //response.infoLog += `filename: ${require('crypto').createHash('md5').update(file._id).digest("hex")}\n`;
    //response.infoLog += `MediaInfo: ${JSON.stringify(objMedInfo, null, 4)}\n`;
    //response.infoLog += `FFProbeInfo: ${JSON.stringify(objFFProbeInfo, null, 4)}\n`;

    //response.processFile = false;
    //return response;

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== "video") {
        response.processFile = false;
        response.infoLog += "File is not a video. Exiting \n";
        return response;
    }

    //If the file has already been processed we dont need to do more
    if (file.container == "mkv" && (objMedInfo.media.track[0].extra != undefined && objMedInfo.media.track[0].extra.JBDONEVERSION != undefined && objMedInfo.media.track[0].extra.JBDONEVERSION == "1")) {
        response.processFile = false;
        response.infoLog += "File already Processed! \n";
        return response;
    }

    //If the existing container is mkv there is a possbility the stats were not updated during any previous transcode, lets make sure
    if (file.container == "mkv") {
        var datStats = Date.parse(new Date(70, 1).toISOString());
        if (file.ffProbeData.streams[0].tags != undefined && file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] != undefined) {
            datStats =  Date.parse(file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] + " GMT");
        }

        if (objMedInfo.media.track[0].extra != undefined && objMedInfo.media.track[0].extra.JBDONEDATE != undefined) {
            var JBDate = Date.parse(objMedInfo.media.track[0].extra.JBDONEDATE);
        
            response.infoLog += `JBDate: ${JBDate}, StatsDate: ${datStats}\n`;
            if (datStats >= JBDate) {
                bolStatsAreCurrent = true;
            }
        } else {
            var statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate()- intStatsDays)).toISOString());

            response.infoLog += `StatsThres: ${statsThres}, StatsDate: ${datStats}\n`;
            if (datStats >= statsThres) {
                bolStatsAreCurrent = true;
            }
        }

        if (!bolStatsAreCurrent) {
            response.infoLog += "Stats need to be updated! \n";
            output = proc.execSync('mkvpropedit --add-track-statistics-tags "' + currentfilename + '"');
            response.infoLog += "Getting Media Info, again!\n";
            objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentfilename + '" --output=JSON').toString());
        }
    }

    //Run ffprobe with full info and load the results it into an object
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    response.infoLog += "Getting FFProbe Info.\n";
    var objFFProbeInfo = "";
    objFFProbeInfo = JSON.parse(proc.execSync('ffprobe -v error -print_format json -show_format -show_streams -show_chapters "' + currentfilename + '"').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    //Logic Controls
    var bolscaleVideo = false;
    var boltranscodeVideo = false;
    var optimalbitrate = 0;
    var videonewwidth = 0;
    var boluse10bit = true;
    var boltranscodeSoftwareDecode = false;

    var audionewchannels = 0;
    var boltranscodeAudio = false;
    var boldownmixAudio = false;

    var boldosubs = false;
    var boldosubsconvert = false;

    var boldochapters = true;

    // Set up required variables
    var videoIdx = -1;
    var videoInxFirst = -1;
    var audioIdx = -1;
    var audioIdxOther = -1;

    var strstreamType = "";
   
    // Go through each stream in the file.
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {

        strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

        //Looking For Video
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        // Check if stream is a video.
        if (videoIdx == -1 && strstreamType == "video") {
            videoIdx = i;
            videoInxFirst = i;

            var videoheight = Number(file.ffProbeData.streams[i].height);
            var videowidth = Number(file.ffProbeData.streams[i].width);
            var videoFPS = Number(objMedInfo.media.track[i + 1].FrameRate);
            var videoBR = Number(objMedInfo.media.track[i + 1].BitRate);

            //Lets see if we need to scal down the video size
            if (videoheight > maxvideoheight) {
                bolscaleVideo = true;
                videonewwidth = (maxvideoheight / videoheight) * videowidth;
                response.infoLog += 'Video Resolution, ' + videowidth + 'x' + videoheight + ', need to convert to ' + videonewwidth + 'x' + maxvideoheight +' \n';
                videoheight = maxvideoheight;
                videowidth = videonewwidth;
            }

            //Figure out the desired bitrate
            optimalvideobitrate = Math.floor((videoheight * videowidth * videoFPS) * targetcodeccompression);

            response.infoLog += 'Video stream ' + i + ' ' + Math.floor(objFFProbeInfo.format.duration / 60) + ':' + file.ffProbeData.streams[i].codec_name + ':' + videowidth + 'x' + videoheight + 'x' + videoFPS + ':' + videoBR + 'bps \n';

            //We need to check for a minimum bitrate
            if ((videoheight * videowidth) > minvideopixels4K && optimalvideobitrate < minvideopixels4K) {
                response.infoLog += 'Video Bitrate calulcated for 4K, ' + optimalvideobitrate + ', is below minimum, ' + minvideopixels4K +' \n';
                optimalvideobitrate = minvideorate4K;
            } else if ((videoheight * videowidth) > minvideopixels2K && optimalvideobitrate < minvideorate2K) {
                response.infoLog += 'Video Bitrate calulcated for 2K, ' + optimalvideobitrate + ', is below minimum, ' + minvideorate2K + ' \n';
                optimalvideobitrate = minvideorate2K;
            } else if ((videoheight * videowidth) > minvideopixelsHD && optimalvideobitrate <  minvideorateHD) {
                response.infoLog += 'Video Bitrate calulcated for HD, ' + optimalvideobitrate + ', is below minimum, ' + minvideorateHD + ' \n';
                optimalvideobitrate = minvideorateHD;
            } else if (optimalvideobitrate <  minvideorateSD) {
                response.infoLog += 'Video Bitrate calulcated for SD, ' + optimalvideobitrate + ', is below minimum, ' + minvideorateSD +' \n';
                optimalvideobitrate = minvideorateSD;
            }

            //Check if it is already hvec, if not then we must transcode
            if (file.ffProbeData.streams[i].codec_name != targetvideocodec) {
                boltranscodeVideo = true;
                response.infoLog += 'Video existing Codex is ' + file.ffProbeData.streams[i].codec_name + ', need to convert to ' + targetvideocodec + ' \n';
                
                if (file.ffProbeData.streams[i].codec_name == "mpeg4") {
                    boltranscodeSoftwareDecode = true;
                    response.infoLog += 'Video existing Codex is ' + file.ffProbeData.streams[i].codec_name + ', need to decode with software codec \n';
                }
            }

            //If the source bitrate is more than 10% above our target bitrate we should transcode
            if (videoBR > (optimalvideobitrate * 1.1)) {
                boltranscodeVideo = true;
                response.infoLog += 'Video existing Bitrate, ' + videoBR + ', is not within 10% of target bitrate, ' + optimalvideobitrate + ', using optimal \n';
            }

            //If the source bitrate is less than our target bitrate we should not ever go up
            if (videoBR < optimalvideobitrate * 1.2) {   //Is the existing rate close, within 20%, so we want to be careful when we transcode, we might loose quality
                //if (file.ffProbeData.streams[i].codec_name == targetvideocodec) {
                //    response.infoLog += 'Video existing bitrate, ' + videoBR + ', is close to target bitrate, ' + optimalvideobitrate + ', using existing \n';
                //    optimalvideobitrate = videoBR;
                //} else 
                if (file.ffProbeData.streams[i].codec_name != targetvideocodec) {
                    response.infoLog += 'Video existing bitrate, ' + videoBR + ', is close to, or lower than, target bitrate, ' + optimalvideobitrate + ', with a codec change, using " + Math.floor(targetreductionforcodecswitchonly * 100) + "% of existing \n';
                    optimalvideobitrate = videoBR * targetreductionforcodecswitchonly;
                    boltranscodeVideo = true;
                } else {
                    response.infoLog += 'Video existing bitrate, ' + videoBR + ', is close to, or lower than, target bitrate, ' + optimalvideobitrate + ', using existing stream \n';
                    optimalvideobitrate = videoBR;
                    boltranscodeVideo = false;
                }
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////

        //Looking For Audio
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        if (strstreamType == "audio") {
            //response.processFile = false;
            //response.infoLog += i + ":" + file.ffProbeData.streams[i].tags.language + " \n";
            //audioIdxFirst = i;

            if (file.ffProbeData.streams[i].tags != undefined && file.ffProbeData.streams[i].tags.language == targetaudiolanguage) {
                response.infoLog += 'Audio stream ' + i + ':' +  targetaudiolanguage + ':' + file.ffProbeData.streams[i].channels + ':' + objMedInfo.media.track[i + 1].BitRate + 'bps\n';
                if (audioIdx = -1 ) {
                    audioIdx = i;
                } else if (file.ffProbeData.streams[i].channels > file.ffProbeData.streams[audioIdx].channels) {
                    audioIdx = i;
                }
            } else {
                response.infoLog += 'Audio stream ' + i + ':unknown:' + file.ffProbeData.streams[i].channels + ':' + objMedInfo.media.track[i + 1].BitRate + 'bps\n';
                if (audioIdxOther = -1 ) {
                    audioIdxOther = i;
                } else if (file.ffProbeData.streams[i].channels > file.ffProbeData.streams[audioIdxOther].channels) {
                    audioIdxOther = i;
                }
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////

        //Looking For Subtitles
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        if (!boldosubs && (strstreamType == "text" || strstreamType == "subtitle")) {
            boldosubs = true;
            if (file.ffProbeData.streams[i].codec_name == "mov_text") {
                boldosubsconvert = true;
                response.infoLog += 'SubTitles Found (mov_text), will convert \n';
            }  else {
                response.infoLog += 'SubTitles Found, will copy \n';
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////
    }

    // Go through chpaters in the file looking for badness
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    for (var i = 0; i < objFFProbeInfo.chapters.length; i++) {

        //Bad start times
        if (objFFProbeInfo.chapters[i].start_time < 0) {
            boldochapters = false;
            break;   //Dont need to continue because we know they are bad
        }

        //Duplicate start times
        for (var x = 0; i < objFFProbeInfo.chapters.length; i++) {
            if (i != x && objFFProbeInfo.chapters[i].start_time == objFFProbeInfo.chapters[x].start_time) {
                boldochapters = false;
                break;   //Dont need to continue because we know they are bad
            }
        }
    }

    //Audio Decision section
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    if (audioIdx == -1) {
        if (audioIdxOther != -1) {
            response.infoLog += 'Assuming Other Audio Track !! \n';
            audioIdx = audioIdxOther;
        } else {
            response.processFile = false;
            response.infoLog += 'No Audio Track !! \n';
            return response;
        }
    }

    var audioBR = Number(objMedInfo.media.track[audioIdx + 1].BitRate);

    if (file.ffProbeData.streams[audioIdx].channels > targetaudiochannels) {
        boldownmixAudio = true;
        audionewchannels = targetaudiochannels;
        response.infoLog += 'Audio existing Channels, ' + file.ffProbeData.streams[audioIdx].channels + ', is higher than target, ' + targetaudiochannels + ' \n';
    } else {
        audionewchannels = file.ffProbeData.streams[audioIdx].channels;
    }

    var optimalaudiobitrate = audionewchannels * targetaudiobitrateperchannel;

    //Now what are we going todo with the audio part
    if (audioBR > (optimalaudiobitrate * 1.1)) {
        boltranscodeAudio = true;
        response.infoLog += 'Audio existing BitRate, ' + audioBR + ', is higher than target, ' + optimalaudiobitrate + ' \n';
    }

    //If the audio codec is not what we want then we shoudl transcode
    if (file.ffProbeData.streams[audioIdx].codec_name != targetaudiocodec) {
        boltranscodeAudio = true;
        response.infoLog += 'Audio Codec, ' + file.ffProbeData.streams[audioIdx].codec_name + ', is different than target, ' + targetaudiocodec + ' \n';
    }

    //If the source bitrate is less than out target bitrate we should not ever go up
    if (audioBR < optimalaudiobitrate) {
        response.infoLog += 'Audio existing BitRate, ' + audioBR + ', is lower than taget, ' + optimalaudiobitrate + ', using existing \n';
        optimalaudiobitrate = audioBR;
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    // lets assemble our ffmpeg command
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    var strtrancodebasehw = " -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ";
    var strtrancodebasesw = " -vaapi_device /dev/dri/renderD128 ";
    var strtranscodevideomapping = " <io> -map 0:{0} ";
    var strtranscodevideocopy = " -c:v:0 copy ";
    var strtranscodevideotranscoding = " -c:v:0 hevc_vaapi ";
    var strtranscodevideooptions = ' -vf "{0}" ';  //Used to make the output 10bit, I think the quotes need to be this way for ffmpeg
    var strtranscodevideoscaling = "w=-1:h=1080";  //Used when video is above our target of 1080
    var strtranscodevideoformathw = "scale_vaapi=";  //Used to make the output 10bit
    var strtranscodevideoformat = "format={0}";  //Used to make the output 10bit
    var strtranscodevideo10bit = "p010";  //Used to make the output 10bit
    var strtranscodevideoswdecode = "hwupload";  //Used to make it use software decode if necessary
    var strtranscodevideobitrate = " -b:v {0} ";  //Used when video is above our target of 1080
    var strtranscodeaudiomapping = " -map 0:{0} ";
    var strtranscodeaudiocopy = " -c:a:0 copy ";
    var strtranscodeaudiotranscoding = " -c:a:0 ${targetaudiocodec} -b:a {0} ";
    var strtranscodeaudiodownmixing = " -ac {0} ";
    var strtranscodesubs = " -map 0:s -scodec copy ";
    var strtranscodesubsconvert = " -map 0:s -c:s srt ";
    var strtranscodemetadata = " -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE={0} ";
    var strtranscodechapters = " -map_chapters {0} ";

    var strtranscodefileoptions = " ";

    var strFFcmd = "";
    if (boltranscodeVideo) {
        if (boltranscodeSoftwareDecode) {
            strFFcmd += strtrancodebasesw;
        } else {
            strFFcmd += strtrancodebasehw;
        }
    }
    strFFcmd += strtranscodevideomapping.replace("{0}",videoIdx);
    if (boltranscodeVideo) {
        strFFcmd += strtranscodevideotranscoding;

        if (bolscaleVideo || boluse10bit || boltranscodeSoftwareDecode) {
            var stroptions = "";
            var strformat = "";
            if (bolscaleVideo) {
                stroptions += strtranscodevideoscaling;
            }
            if (boluse10bit) {
                if (strformat.length > 0) {
                    strformat += "=";
                }
                strformat += strtranscodevideo10bit;
            }
            if (boltranscodeSoftwareDecode) {
                if (strformat.length > 0) {
                    strformat += ",";
                }
                strformat += strtranscodevideoswdecode;
            }
            if (strformat.length > 0) {
                if (stroptions.length > 0) {
                    stroptions += ",";
                }
                stroptions += strtranscodevideoformat.replace("{0}",strformat);
            }

            if (boltranscodeSoftwareDecode) {
                strFFcmd += strtranscodevideooptions.replace("{0}",stroptions);
            } else {
                strFFcmd += strtranscodevideooptions.replace("{0}",strtranscodevideoformathw + stroptions);
            }

        }
        strFFcmd += strtranscodevideobitrate.replace("{0}",optimalvideobitrate);

    } else {
        strFFcmd += strtranscodevideocopy;
    }

    strFFcmd += strtranscodeaudiomapping.replace("{0}",audioIdx);
    if (boltranscodeAudio) {
        strFFcmd += strtranscodeaudiotranscoding.replace("{0}",optimalaudiobitrate).replace("${targetaudiocodec}",targetaudiocodec);
    } else {
        strFFcmd += strtranscodeaudiocopy;
    }
    if (boldownmixAudio) {
        strFFcmd += strtranscodeaudiodownmixing.replace("{0}",audionewchannels);
    }
    if (boldosubs) {
        if (boldosubsconvert) {
            strFFcmd += strtranscodesubsconvert;
        } else {
            strFFcmd += strtranscodesubs;
        }
    }

    strFFcmd += strtranscodemetadata.replace("{0}",new Date().toISOString());
    if (boldochapters) {
        strFFcmd += strtranscodechapters.replace("{0}","0");
    } else {
        strFFcmd += strtranscodechapters.replace("{0}","-1");
    }

    strFFcmd += strtranscodefileoptions;
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    response.infoLog += strFFcmd + '\n';

    response.preset += strFFcmd;
    response.processFile = true;
    response.infoLog += 'File needs work. Transcoding. \n';
    return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
