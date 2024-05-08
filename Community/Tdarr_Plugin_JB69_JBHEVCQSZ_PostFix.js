/* eslint-disable */
//////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Author: JarBinks, Zachg99, Jeff47
//  Date: 04/11/2021
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
//      (videoheight * videowidth * videoFPS) * targetcodeccompression//
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
//  I am running the docker image provided for Tdarr
//
//  Here is my docker config (I am running compose so yours might be a little different)
//    tdarr_server:
//      container_name: tdarr_server
//      image: haveagitgat/tdarr:latest
//      privileged: true
//      restart: unless-stopped
//      environment:
//        - PUID=${PUID} # default user id, defined in .env
//        - PGID=${PGID} # default group id, defined in .env
//        - TZ=${TZ} # timezone, defined in .env
//        - serverIP=tdarr_server #using internal docker networking. This should at least work when the nodes are on the same docker compose as the server
//        - serverPort=8266
//        - webUIPort=8265
//      volumes:
//        - ${ROOT}/tdarr/server:/app/server/Tdarr # Tdarr server files
//        - ${ROOT}/tdarr/configs:/app/configs # config files - can be same as NODE (unless separate server)
//        - ${ROOT}/tdarr/logs:/app/logs # Tdarr log files
//        - ${ROOT}/tdarr/cache:/temp # Cache folder, Should be same path mapped on NODE
//        - ${ROOT}/tdarr/testmedia:/home/Tdarr/testmedia # Should be same path mapped on NODE if using a test folder
//        - ${ROOT}/tdarr/scripts:/home/Tdarr/scripts # my random way of saving script files
//        - /volume1/video:/media # video library Should be same path mapped on NODE
//      ports:
//        - 8265:8265 #Exposed to access webui externally
//        - 8266:8266 #Exposed to allow external nodes to reach the server
//      logging:
//        options:
//          max-size: "2m"
//          max-file: "3"
//
//    tdarr_node:
//      container_name: tdarr_node
//      image: haveagitgat/tdarr_node:latest
//      privileged: true
//      restart: unless-stopped
//      devices:
//        - /dev/dri:/dev/dri
//      environment:
//        - PUID=${PUID} # default user id, defined in .env
//        - PGID=${PGID} # default group id, defined in .env
//        - TZ=${TZ} # timezone, defined in .env
//        - serverIP=192.168.x.x #container name of the server, should be modified if server is on another machine
//        - serverPort=8266
//        - nodeID=TDARRNODE_2
//        - nodeIP=192.168.x.x #container name of the node
//        - nodePort=9267 #not exposed via a "ports: " setting as the server/node communication is done on the internal docker network and can communicate on all ports
//      volumes:
//        - ${ROOT}/tdarr/configs:/app/configs # config files - can be same as server (unless separate server)
//        - ${ROOT}/tdarr/logs:/app/logs # config files - can be same as server (unless separate server)
//        - ${ROOT}/tdarr/testmedia:/home/Tdarr/testmedia # Should be same path mapped on server if using a test folder
//        - ${ROOT}/tdarr/scripts:/home/Tdarr/scripts # my random way of saving script files
//        - ${ROOT}/tdarr/cache:/temp # Cache folder, Should be same path mapped on server
//        - /mnt/video:/media # video library Should be same path mapped on server
//      ports:
//        - 9267:9267
//      logging:
//        options:
//          max-size: "2m"
//          max-file: "3"
//
//////////////////////////////////////////////////////////////////////////////////////////////////////

// tdarrSkipTest
const details = () => {
    return {
        id: "Tdarr_Plugin_JB69_JBHEVCQSZ_PostFix",
        Stage: "Pre-processing",
        Name: "JB - MKV Stats, Chapters, Audio Language",
        Type: "Video",
        Operation: "Transcode",
        Description: "***You should not use this*** until you read the comments at the top of the code and understand how it works **this does alot** and is 2 of 2 routines you should to run **Part 2** \n",
        Version: "2.0",
        Tags: "post-processing,ffmpeg,video",
        Inputs:[]
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

    var response = {
        processFile: false,
        preset: "",
        container: ".mkv",
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: false,
        infoLog: ""
    }

    var currentfilename = file._id; //.replace(/'/g, "'\"'\"'");

    var intStatsDays = 45;
    var bolHasChapters = false;
    var bolAudioIsEng = false;
    var bolStatsAreCurrent = false;

    //Since this uses mkvpropedit, we need to check the file is an mkv before proceeding
    if (file._id.substr(file._id.length - 3) != "mkv") {
        response.infoLog += "Not an MKV file.\n";
        return response;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //response.infoLog += "Getting Media Info.\n";
    //var objMedInfo = "";
    //objMedInfo = JSON.parse(require("child_process").execSync('mediainfo "' + currentfilename + '" --output=JSON').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    if (file.mediaInfo.track[0].extra == undefined || file.mediaInfo.track[0].extra.JBDONEVERSION == undefined || file.mediaInfo.track[0].extra.JBDONEVERSION != "1") {
        response.infoLog += "File not processed by first routine! \n";
        return response;
    }

    //Run ffprobe with full info and load the results it into an object
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //response.infoLog += "Getting FFProbe Info.\n";
    //var objFFProbeInfo = "";
    //objFFProbeInfo = JSON.parse(require("child_process").execSync('ffprobe -v error -print_format json -show_format -show_streams -show_chapters "' + currentfilename + '"').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    var datStats = Date.parse(new Date(70, 1).toISOString())
    if (file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] != undefined) {
        datStats =  Date.parse(file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] + " GMT")
    }

	//Not processing chapters for now
    //if (objFFProbeInfo.chapters.length != 0) {
    //    bolHasChapters = true
    //} else {
    //    response.infoLog += "No Chapters! \n"
    //}

    if (file.ffProbeData.streams[1].tags != undefined && file.ffProbeData.streams[1].tags.language != undefined && file.ffProbeData.streams[1].tags.language == "eng") {
        bolAudioIsEng = true;
    } else {
        response.infoLog += "Audio not marked as English! \n";
    }

    if (file.mediaInfo.track[0].extra.JBDONEDATE != undefined) {
        var JBDate = Date.parse(file.mediaInfo.track[0].extra.JBDONEDATE);
    
        response.infoLog += "JBDate:" + JBDate + ", StatsDate:" + datStats + "\n";
        if (datStats >= JBDate) {
            bolStatsAreCurrent = true;
        }
    } else {
        var statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate()- intStatsDays)).toISOString());

        response.infoLog += "StatsThres: " + statsThres + ", StatsDate: " + datStats + "\n";
        if (datStats >= statsThres) {
            bolStatsAreCurrent = true;
        }
    }

    if (!bolStatsAreCurrent) {
        response.infoLog += "Stats need to be updated! \n";
    }

    if (bolAudioIsEng && bolHasChapters && bolStatsAreCurrent) {
        return response;
    }

    //response.infoLog += "FIDB: " + JSON.stringify(file) + "\n";
    //return response;

    var boldoChapters = false;
    var chapterlengthlong = 600;
    var strChapterFile;
    var strChapterFileLoc;

    //If no chapters then we want to add
    if (!bolHasChapters) {
        response.infoLog += "Building Chapter file.\n";

        boldoChapters = true;
        strChapterFile = "";
        var intChapNum = 0;
        var strChapNum = "";

        let duration = 0;
        if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
            duration = parseFloat(file.ffProbeData?.format?.duration)
        } else {
            duration = file.meta.Duration
        }

        for (var i = 0; i < duration; i += chapterlengthlong) {
            intChapNum += 1;
            strChapNum = String(intChapNum).padStart(2, '0');

            var timeString = new Date(i * 1000).toISOString().substr(11, 12);

            strChapterFile += "CHAPTER" + strChapNum + "=" + timeString + "\n";
            strChapterFile += "CHAPTER" + strChapNum + "NAME=CHAPTER " + intChapNum + "\n";
        }

        //We should add a chapter 1 sec before the end
        intChapNum += 1;
        strChapNum = String(intChapNum).padStart(2, "0");

 
        var timeString = new Date((Math.floor(duration) - 1) * 1000).toISOString().substr(11, 12);

        strChapterFile += "CHAPTER" + strChapNum + "=" + timeString + "\n";
        strChapterFile += "CHAPTER" + strChapNum + "NAME=CHAPTER " + intChapNum + "\n";

        strChapterFileLoc = librarySettings.cache + "/" + require("crypto").createHash("md5").update(file._id).digest("hex") + ".txt";

        require('fs').writeFileSync(strChapterFileLoc, strChapterFile);
    }

    var strmkvpropeditcommand = "mkvpropedit --add-track-statistics-tags --edit track:a1 --set language=en";
    if (boldoChapters) {
        strmkvpropeditcommand += ' --chapters "' + strChapterFileLoc + '"';
    }
    strmkvpropeditcommand += ' "' + currentfilename + '"';
    //strmkvpropeditcommand += " | tee " + librarySettings.cache + "/mkvpropeditout.txt";

    response.infoLog += "Ready to run\n";
    response.infoLog += strmkvpropeditcommand + "\n";
    
    var output = "";
    var proc = require("child_process");

    try {
        output = proc.execSync(strmkvpropeditcommand);
    } catch(err) {
        output += err;
    }

    //response.infoLog += "output: " + output + "\n";
    
    if (boldoChapters) {
        require("fs").unlinkSync(strChapterFileLoc);
    }

    return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
