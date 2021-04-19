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
//      (videoheight * videowidth * videoFPS) * targetcodeccompression
//      The first 3 give a raw number of bits that the stream requires, however with encoding there is a certain amount of acceptable loss, this is targetcodeccompression
//      This number is pretty low for hevc. I have found 0.07 to be about the norm.
//      This means that for hevc only 7% of the raw bitrate is necessary to produce some decent results and actually I have used, and seen, as low as 3.5%
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
//      All are removed?? (TODO: ensure this is correct and mention the flag to keep them if desired)
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
        Version: "2.0",
        Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile.js",
        Tags: "pre-processing,ffmpeg,video,audio,qsv h265,aac"
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

    var currentfilename = file._id; //.replace(/'/g, "'\"'\"'");

    //Settings
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //Process Handling
    var intStatsDays = 21; //If the stats date on the file, usually for mkv only, are older than this it will first update them

    //Video
    var targetvideocodec = "hevc"; //This is the basis of the routine, if you want to change it you probably want to use a different script
    var boluse10bit = true;  //This will encode in 10 bit
    var targetframerate = 25;  //Any frame rate greater than this will be adjusted 
   
    var minsizedifffortranscode = 1.2 //If the existing bitrate is this much more than the target bitrate it is ok to transcode, otherwise there might not be enough extra to get decent quality
    var targetreductionforcodecswitchonly = 0.8; //When a video codec change happens and the source bitrate is lower than optimal, we still lower the bitrate by this since hevc is ok with a lower rate

    var maxvideoheight = 2160;  //Any thing over this size, I.E. 4K, will be reduced to this
    var targetcodeccompression = 0.08;  //This effects the target bitrate by assuming a compression ratio

    //Since videos can have many widths and heights we need to convert to pixels (WxH) to understand what we are dealing with and set a minimal optimal bitrate to not go below
    var minvideopixels4K = 6500000;
    var minvideorate4K = 8500000;

    var minvideopixels2K = 1500000;
    var minvideorate2K = 2400000;

    var minvideopixelsHD = 750000;
    var minvideorateHD = 1100000;

    var minvideorateSD = 450000;

    //Audio
    var targetaudiocodec = "aac";  //Desired Audio Coded, if you change this it will might require code changes
    var targetaudiolanguage = "eng"; //Desired Audio Language
    var targetaudiobitrateperchannel = 64000;  //64K per channel gives you the good lossy quality out of AAC
    var targetaudiochannels = 6; //Any thing above this number of channels will be reduced to it, because I cannot listen to it

    //Subtitles
    var bolIncludeSubs = true;
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    var proc = require("child_process");
    var bolStatsAreCurrent = false;

    //Run MediaInfo and load the results it into an object
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //response.infoLog += "Getting Media Info.\n";
    //var objMedInfo = "";
    //objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentfilename + '" --output=JSON').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    //Run ffprobe with full info and load the results it into an object
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //response.infoLog += "Getting FFProbe Info.\n";
    //var objFFProbeInfo = "";
    //objFFProbeInfo = JSON.parse(proc.execSync('ffprobe -v error -print_format json -show_format -show_streams -show_chapters "' + currentfilename + '"').toString());
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    //    response.processFile = false;
    //    response.infoLog += objMedInfo + " \n";
    //    return response;

    //response.infoLog += "HomePath:" + JSON.stringify(otherArguments, null, 4) + "\n";
    //response.infoLog += "FIID:" + file._id + "\n";
    //response.infoLog += "IPID:" + inputs._id + "\n";
    //response.infoLog += "FIDB:" + JSON.stringify(file, null, 4) + "\n";
    //response.infoLog += "CacheDir:" + librarySettings.cache + "\n";
    //response.infoLog += "filename:" + require("crypto").createHash("md5").update(file._id).digest("hex") + "\n";
    //response.infoLog += "MediaInfo:" + JSON.stringify(objMedInfo, null, 4) + "\n";
    //response.infoLog += "FFProbeInfo:" + JSON.stringify(objFFProbeInfo, null, 4) + "\n";
    //response.infoLog += "objFFProbeInfo:" + JSON.stringify(objFFProbeInfo, null, 4) + "\n";

    //response.processFile = false;
    //return response;

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== "video") {
        response.processFile = false;
        response.infoLog += "File is not a video. Exiting \n";
        return response;
    }

    //If the file has already been processed we dont need to do more
    if (file.container == "mkv" && (file.mediaInfo.track[0].extra != undefined && file.mediaInfo.track[0].extra.JBDONEVERSION != undefined && file.mediaInfo.track[0].extra.JBDONEVERSION == "1")) {
        response.processFile = false;
        response.infoLog += "File already Processed! \n";
        return response;
    }

    //If the existing container is mkv there is a possibility the stats were not updated during any previous transcode, lets make sure
    if (file.container == "mkv") {
        var datStats = Date.parse(new Date(70, 1).toISOString());
        if (file.ffProbeData.streams[0].tags != undefined && file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] != undefined) {
            datStats =  Date.parse(file.ffProbeData.streams[0].tags["_STATISTICS_WRITING_DATE_UTC-eng"] + " GMT");
        }

        if (file.mediaInfo.track[0].extra != undefined && file.mediaInfo.track[0].extra.JBDONEDATE != undefined) {
            var JBDate = Date.parse(file.mediaInfo.track[0].extra.JBDONEDATE);
        
            response.infoLog += "JBDate: " + JBDate + ", StatsDate: " + datStats + "\n";
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

            try {
                output = proc.execSync('mkvpropedit --add-track-statistics-tags "' + currentfilename + '"');
            } catch(err) {
                response.infoLog += "Error Updating Status Probably Bad file, A remux will probably fix, will continue\n";
            }
            response.infoLog += "Getting Stats Objects, again!\n";
            //objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentfilename + '" --output=JSON').toString());
            //objFFProbeInfo = JSON.parse(proc.execSync('ffprobe -v error -print_format json -show_format -show_streams -show_chapters "' + currentfilename + '"').toString());
        }
    }

    //Logic Controls
    var bolscaleVideo = false;
    var boltranscodeVideo = false;
    var bolchangeframerateVideo = false;
    var optimalbitrate = 0;
    var videonewwidth = 0;
    var bolSource10bit = false;
    var boltranscodeSoftwareDecode = false;

    var audionewchannels = 0;
    var boltranscodeAudio = false;
    var boldownmixAudio = false;

    var audioChannels = 0;
    var audioBitrate = 0;
    var audioIdxChannels = 0;
    var audioIdxBitrate = 0;

    var boldosubs = false;
    var bolforcenosubs = false;
    var boldosubsconvert = false;

    var boldochapters = true;

    // Set up required variables
    var videoIdx = -1;
    var videoIdxFirst = -1;
    var audioIdx = -1;
    var audioIdxOther = -1;

    var strstreamType = "";
   
    // Go through each stream in the file.
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {

        strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

        //Looking For Video
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        if (strstreamType == "video") {
			//First we need to check if it is included in the MediaInfo struture, it might not be (mjpeg??, others??)
			var MILoc = findMediaInfoItem(file, i);
			if (MILoc > -1) {
				var streamheight = file.ffProbeData.streams[i].height * 1;
				var streamwidth = file.ffProbeData.streams[i].width * 1;
				var streamFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
				var streamBR = file.mediaInfo.track[MILoc].BitRate * 1;

				response.infoLog += "Video stream " + i + ":" + Math.floor(file.meta.Duration / 60) + ":" + file.ffProbeData.streams[i].codec_name + ((bolSource10bit) ? "(10)" : "");
				response.infoLog += ":" + streamwidth + "x" + streamheight + "x" + streamFPS + ":" + streamBR + "bps \n";

				if (videoIdxFirst == -1) {
					videoIdxFirst = i;
				}

				if (videoIdx == -1) {
					videoIdx = i;
				} else {
					var MILocC = findMediaInfoItem(file,videoIdx);
					var curstreamheight = file.ffProbeData.streams[videoIdx].height * 1;
					var curstreamwidth = file.ffProbeData.streams[videoIdx].width * 1;
					var curstreamFPS = file.mediaInfo.track[MILocC].FrameRate * 1;
					var curstreamBR = file.mediaInfo.track[MILocC].BitRate * 1;

					//Only check here based on bitrate and video width
					if (streamBR > curstreamBR && streamwidth >= curstreamwidth) {
						videoIdx = i;
					}
				}
			}
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////

        //Looking For Audio
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        if (strstreamType == "audio") {
            //response.processFile = false;
            //response.infoLog += i + ":" + objFFProbeInfo.streams[i].tags.language + " \n";
            //audioIdxFirst = i;

            //response.infoLog += JSON.stringify(objFFProbeInfo.streams[i]) + " \n";

            audioChannels = file.ffProbeData.streams[i].channels * 1;
            audioBitrate = file.mediaInfo.track[findMediaInfoItem(file, i)].BitRate * 1;

            if (file.ffProbeData.streams[i].tags != undefined && file.ffProbeData.streams[i].tags.language == targetaudiolanguage) {
                response.infoLog += "Audio stream " + i + ":" +  targetaudiolanguage + ":" + file.ffProbeData.streams[i].codec_name + ":" + audioChannels + ":" + audioBitrate + "bps:";

                if (audioIdx == -1) {
                    response.infoLog += "First Audio Stream \n";
                    audioIdx = i;
                } else {

                    audioIdxChannels = file.ffProbeData.streams[audioIdx].channels * 1;
                    audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate;

                    if (audioChannels > audioIdxChannels) {
                        response.infoLog += "More Audio Channels \n";
                        audioIdx = i;
                    } else if (audioChannels == audioIdxChannels && audioBitrate > audioIdxBitrate) {
                        response.infoLog += "Higher Audio Rate \n";
                        audioIdx = i;
                    }
                }
            } else {
                response.infoLog += "Audio stream " + i + ":???:" + file.ffProbeData.streams[i].codec_name + ":" + audioChannels + ":" + audioBitrate + "bps:";

                if (audioIdxOther == -1) {
                    response.infoLog += "First Audio Stream \n";
                    audioIdxOther = i;
                } else {
                    audioIdxChannels = file.ffProbeData.streams[audioIdxOther].channels * 1;
                    audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdxOther)].BitRate;

                    if (audioChannels > audioIdxChannels) {
                        response.infoLog += "More Audio Channels \n";
                        audioIdxOther = i;
                    } else if (audioChannels == audioIdxChannels && audioBitrate > audioIdxBitrate) {
                        response.infoLog += "Higher Audio Rate \n";
                        audioIdxOther = i;
                    }
                }
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////

        //Looking For Subtitles
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        if (!bolforcenosubs && !boldosubs && (strstreamType == "text" || strstreamType == "subtitle")) {
            //if (file.mediaInfo.track[findMediaInfoItem(file, i)].CodecID != "S_TEXT/WEBVTT") {  //A sub has an S_TEXT/WEBVTT codec, ffmpeg will fail with it
            if (file.mediaInfo.track[findMediaInfoItem(file, i)].CodecID != "S_TEXT/WEBVTT") {  //A sub has an S_TEXT/WEBVTT codec, ffmpeg will fail with it
                boldosubs = true;
                if (file.ffProbeData.streams[i].codec_name == "mov_text") {
                    boldosubsconvert = true;
                    response.infoLog += "SubTitles Found (mov_text), will convert \n";
                }  else {
                    response.infoLog += "SubTitles Found, will copy \n";
                }
            } else {
                response.infoLog += "SubTitles Found (S_TEXT/WEBVTT), will not copy \n";
                bolforcenosubs = true;
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////////
    }

    //return response;

    // Go through chapters in the file looking for badness
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Not processing chapters - fileobject doesn't seem to have the chapters section
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //for (var i = 0; i < objFFProbeInfo.chapters.length; i++) {

        //Bad start times
    //    if (objFFProbeInfo.chapters[i].start_time < 0) {
    //        boldochapters = false;
    //        break;   //Dont need to continue because we know they are bad
    //    }

        //Duplicate start times
    //    for (var x = 0; i < objFFProbeInfo.chapters.length; i++) {
    //        if (i != x && objFFProbeInfo.chapters[i].start_time == objFFProbeInfo.chapters[x].start_time) {
    //            boldochapters = false;
    //            break;   //Dont need to continue because we know they are bad
    //        }
    //    }
    //}

    //Video Decision section
    //////////////////////////////////////////////////////////////////////////////////////////////////////
	if (videoIdx == -1) {
		response.processFile = false;
        response.infoLog += "No Video Track !! \n";
        return response;
	}

    boltranscodeVideo = true;  //We will assume we will be transcoding
	var MILoc = findMediaInfoItem(file, videoIdx);

	var videoheight = file.ffProbeData.streams[videoIdx].height * 1;
	var videowidth = file.ffProbeData.streams[videoIdx].width * 1;
	var videoFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
	var videoBR = file.mediaInfo.track[MILoc].BitRate * 1;

	if (file.ffProbeData.streams[videoIdx].profile != undefined  &&  file.ffProbeData.streams[videoIdx].profile.includes != undefined &&  file.ffProbeData.streams[videoIdx].profile.includes("10")) {
	    bolSource10bit = true;
	}

	if (file.mediaInfo.track[MILoc].FrameRate_Mode == 'VFR')
		videoFPS = 9999  //Source is Variable Frame rate but we will transcode to fixed

    if (videoFPS > targetframerate) {
	    bolchangeframerateVideo = true;  //Need to fix this it does not work :-(
	}

	//Lets see if we need to scal down the video size
	if (videoheight > maxvideoheight) {
	    bolscaleVideo = true;
	    videonewwidth = Math.floor((maxvideoheight / videoheight) * videowidth);
	    response.infoLog += "Video Resolution, " + videowidth + "x" + videoheight + ", need to convert to " + videonewwidth + "x" + maxvideoheight + " \n";
	    videoheight = maxvideoheight;
	    videowidth = videonewwidth;
	}

	//Figure out the desired bitrate
	optimalvideobitrate = Math.floor((videoheight * videowidth * targetframerate) * targetcodeccompression);
	response.infoLog += "Pre Video Calc: " + videoheight + ", " + videowidth + ", " + videoFPS + ", " + optimalvideobitrate + " \n"

	//We need to check for a minimum bitrate
	if ((videoheight * videowidth) > minvideopixels4K && optimalvideobitrate < minvideopixels4K) {
	    response.infoLog += "Video Bitrate calulcated for 4K, " + optimalvideobitrate + ", is below minimum, " + minvideopixels4K +" \n";
	    optimalvideobitrate = minvideorate4K;
	} else if ((videoheight * videowidth) > minvideopixels2K && optimalvideobitrate < minvideorate2K) {
	    response.infoLog += "Video Bitrate calulcated for 2K, " + optimalvideobitrate + ", is below minimum, " + minvideorate2K + " \n";
	    optimalvideobitrate = minvideorate2K;
	} else if ((videoheight * videowidth) > minvideopixelsHD && optimalvideobitrate <  minvideorateHD) {
	    response.infoLog += "Video Bitrate calulcated for HD, " + optimalvideobitrate + ", is below minimum, " + minvideorateHD + " \n";
	    optimalvideobitrate = minvideorateHD;
	} else if (optimalvideobitrate <  minvideorateSD) {
	    response.infoLog += "Video Bitrate calulcated for SD, " + optimalvideobitrate + ", is below minimum, " + minvideorateSD +" \n";
	    optimalvideobitrate = minvideorateSD;
	}

	//Check if it is already hvec, if not then we must transcode
	if (file.ffProbeData.streams[videoIdx].codec_name != targetvideocodec) {
	    response.infoLog += "Video existing Codex is " + file.ffProbeData.streams[videoIdx].codec_name + ((bolSource10bit) ? "(10)" : "");
	    response.infoLog += ", need to convert to " + targetvideocodec + ((boluse10bit) ? "(10)" : "") + " \n";
	    
	    if (file.ffProbeData.streams[videoIdx].codec_name == "mpeg4") {
	        boltranscodeSoftwareDecode = true;
	        response.infoLog += "Video existing Codex is " + file.ffProbeData.streams[videoIdx].codec_name + ", need to decode with software codec \n";
	    } else if (file.ffProbeData.streams[videoIdx].codec_name == "h264" && file.ffProbeData.streams[videoIdx].profile.includes("10")) {
	        //If the source is 10 bit then we must software decode since qsv will not decode 264 10 bit??
	        boltranscodeSoftwareDecode = true;
	        response.infoLog += "Video existing Codex is " + file.ffProbeData.streams[videoIdx].codec_name + " 10 bit, need to decode with software codec \n";
	    }
	}

	if (videoBR < (optimalvideobitrate * minsizedifffortranscode)) {
		//We need to be careful here are else we could produce a bad quality
		response.infoLog += "Low source bitrate! \n";	
		if (file.ffProbeData.streams[videoIdx].codec_name == targetvideocodec) {
			if (bolSource10bit == boluse10bit) {
	            response.infoLog += "Video existing Bitrate, " + videoBR + ", is close to target Bitrate, " + optimalvideobitrate + ", using existing stream \n";
	            boltranscodeVideo = false;
			} else {
	            response.infoLog += "Video existing bit depth is different from target, without a codec change, using using existing bitrate \n";
				optimalvideobitrate = videoBR;
			}
		} else {
			//We have a codec change with not much meat so we need to adjust are target rate
			response.infoLog += "Video existing Bitrate, " + videoBR + ", is close to, or lower than, target Bitrate, ";
			response.infoLog += optimalvideobitrate + ", with a codec change, using " + Math.floor(targetreductionforcodecswitchonly * 100) + "% of existing \n";
	                optimalvideobitrate = Math.floor(videoBR * targetreductionforcodecswitchonly);
	                boltranscodeVideo = true;
		}
	} else {
		//We already know the existing bitrate has enough meat for a decent transcode
	    //boltranscodeVideo = true;
		response.infoLog += "Video existing Bitrate, " + videoBR + ", is higher than target, " + optimalvideobitrate + ", transcoding \n";
	}
	response.infoLog += "Post Video Calc: " + videoheight + ", " + videowidth + ", " + videoFPS + ", " + optimalvideobitrate + " \n"
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    //Audio Decision section
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    if (audioIdx == -1) {
        if (audioIdxOther != -1) {
            response.infoLog += "Using Unknown Audio Track !! \n";
            audioIdx = audioIdxOther;
        } else {
            response.processFile = false;
            response.infoLog += "No Audio Track !! \n";
            return response;
        }
    }

    var audioBR = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate * 1;

    if (file.ffProbeData.streams[audioIdx].channels > targetaudiochannels) {
        boldownmixAudio = true;
        audionewchannels = targetaudiochannels;
        response.infoLog += "Audio existing Channels, " + file.ffProbeData.streams[audioIdx].channels + ", is higher than target, " + targetaudiochannels + " \n";
    } else {
        audionewchannels = file.ffProbeData.streams[audioIdx].channels;
    }

    var optimalaudiobitrate = audionewchannels * targetaudiobitrateperchannel;

    //Now what are we going todo with the audio part
    if (audioBR > (optimalaudiobitrate * 1.1)) {
        boltranscodeAudio = true;
        response.infoLog += "Audio existing Bitrate, " + audioBR + ", is higher than target, " + optimalaudiobitrate + " \n";
    }

    //If the audio codec is not what we want then we should transcode
    if (file.ffProbeData.streams[audioIdx].codec_name != targetaudiocodec) {
        boltranscodeAudio = true;
        response.infoLog += "Audio Codec, " + file.ffProbeData.streams[audioIdx].codec_name + ", is different than target, " + targetaudiocodec + ", Changing \n";
    }

    //If the source bitrate is less than out target bitrate we should not ever go up
    if (audioBR < optimalaudiobitrate) {
        response.infoLog += "Audio existing Bitrate, " + audioBR + ", is lower than target, " + optimalaudiobitrate + ", using existing ";
        optimalaudiobitrate = audioBR;
        if (file.ffProbeData.streams[audioIdx].codec_name != targetaudiocodec) {
            response.infoLog += "rate";
        }else{
            response.infoLog += "stream";
        }
        response.infoLog += " \n";
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////


    // lets assemble our ffmpeg command
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    var strtrancodebasehw = " -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ";
    var strtrancodebasesw = " -vaapi_device /dev/dri/renderD128 ";
    var strtranscodevideomapping = " <io> -max_muxing_queue_size 8000 -map 0:{0} ";
    var strtranscodevideocopy = " -c:v:0 copy ";
    var strtranscodevideotranscoding = " -c:v:0 hevc_vaapi ";
    var strtranscodevideooptions = ' -vf "{0}" ';  //Used to make the output 10bit, I think the quotes need to be this way for ffmpeg
    var strtranscodevideoscaling = "w=-1:h=1080";  //Used when video is above our target of 1080
    var strtranscodeframerate = "fps={0}";  //Used to change the framerate to the target framerate
    var strtranscodevideoformathw = "scale_vaapi=";  //Used to make the output 10bit
    var strtranscodevideoformat = "format={0}";  //Used to add filters to the hardware transcode
    var strtranscodevideo10bit = "p010";  //Used to make the output 10bit
    var strtranscodevideo8bit = "p008";  //Used to make the output 8bit
    var strtranscodevideoswdecode = "hwupload";  //Used to make it use software decode if necessary
    var strtranscodevideoswdecode10bit = "nv12|vaapi";  //Used to make it sure the software decode is in the proper pixel format
    var strtranscodevideobitrate = " -b:v {0} ";  //Used when video is above our target of 1080
    var strtranscodeaudiomapping = " -map 0:{0} ";
    var strtranscodeaudiocopy = " -c:a:0 copy ";
    var strtranscodeaudiotranscoding = " -c:a:0 ${targetaudiocodec} -b:a {0} ";
    var strtranscodeaudiodownmixing = " -ac {0} ";
    var strtranscodesubs = " -map 0:s -scodec copy ";
    var strtranscodesubsconvert = " -map 0:s -c:s srt ";
    var strtranscodesubsnone = " -map -0:s ";
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

        if (bolscaleVideo || boluse10bit || boltranscodeSoftwareDecode || bolchangeframerateVideo) {
            var stroptions = "";
            var strformat = "";
            if (bolscaleVideo) {
                stroptions += strtranscodevideoscaling;
            }           
	
			var strChangeVideoRateString = "";
			if (bolchangeframerateVideo) {
               strChangeVideoRateString = strtranscodeframerate.replace("{0}",targetframerate) + ",";
            }

            if (strformat.length > 0) {
                strformat += "=";
            }

            if (boluse10bit && !bolSource10bit) {
                strformat += strtranscodevideo10bit;
            } 

            if (!boluse10bit && bolSource10bit) {
                strformat += strtranscodevideo8bit;
            }


            if (boltranscodeSoftwareDecode) {
                if (bolSource10bit) {
                    if (strformat.length > 0) {
                        strformat += ",";
                    }
                    strformat += strtranscodevideoswdecode10bit;
                }
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
                strFFcmd += strtranscodevideooptions.replace("{0}",strChangeVideoRateString + stroptions);
            } else {
                strFFcmd += strtranscodevideooptions.replace("{0}",strChangeVideoRateString + strtranscodevideoformathw + stroptions);
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
    if (bolforcenosubs) {
	strFFcmd += strtranscodesubsnone;
    } else if (boldosubs) {
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

    //response.infoLog += strFFcmd + "\n";

    response.preset += strFFcmd;
    response.processFile = true;
    response.infoLog += "File needs work. Transcoding. \n";
    return response;
}

function findMediaInfoItem(file, index) {
	var currMIOrder = 0;

	for (var i = 0; i < file.mediaInfo.track.length; i++) {
		if (file.mediaInfo.track[i].StreamOrder != null || file.mediaInfo.track[i].StreamOrder != undefined) {
			currMIOrder = file.mediaInfo.track[i].StreamOrder;
		} else {
			currMIOrder = file.mediaInfo.track[i].ID - 1;
		}

		if (currMIOrder == index|| currMIOrder == "0-" + index) {
			return i;
		}
	}
	return -1;
}

module.exports.details = details;
module.exports.plugin = plugin;
