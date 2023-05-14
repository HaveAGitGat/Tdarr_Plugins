/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable no-restricted-globals */
const details = () => ({
          id: "Tdarr_Plugin_AV1_HandBreak_Transcode_ 1080p+",
          Name: "AV1 HandBreak Transcoder 1080p+",
          Type: "Video",
          Operation: "Transcode",
          Description: "Transcodes to AV1 at the selected Bitrate. This is best used with Remux Files. Results may Vary with files that were already processed into other formats.",
          Version: "2.1.2",
          Tags: "HandBrake,AV1",

          Inputs: [
            {
              name: 'BitRate',
              type: 'string',
              defaultValue: '4000',
              inputUI: {
                type: 'text',
              },
              tooltip: `
              ~ Requested Bitrate ~ \\n
        Put in the Bitrate you want to process to in Kbps. For example 4000Kbps is 4Mbps. Remember that AV1 is much more efficient with data than h264/5 
        so it doesn't need to be as high. I noticed that around 4Mbps is the sweet spot for 1080p if you are transcoding from a remux. \\n\\n`,
            },
            {
              name: 'ResolutionSelection',
              type: 'string',
              defaultValue: '1080p',
              inputUI: {
                type: 'dropdown',
                options: [
                  '8KUHD',
                  '4KUHD',
                  '1080p',
                  '720p',
                  '480p',
                ],
              },
              tooltip: `Resolution Videos that exceed this resolution will be resized down to this resolution.`,
            },
            {
              name: 'Container',
              type: 'string',
              defaultValue: 'mkv',
              inputUI: {
                type: 'dropdown',
                options: [
                  'mp4',
                  'mkv',
                ],
              },
              tooltip: ` Container Type \\n\\n
                mkv or mp4.\\n`,
            },
          ],

        
        });

  // Resolution Defining
  const resolutionOrder = ['480p', '720p', '1080p', '4KUHD', '8KUHD'];
  const resolutions = {
      '480p' : "--width 640 --height 480",
      '720p' : "--width 1280 --height 720",
      '1080p' : "--width 1920 --height 1080",
      '4KUHD' : "--width 3840 --height 2160",
      '8KUHD' : "--width 7680 --height 4320",
};

 // eslint-disable-next-line no-unused-vars
    const plugin = (file, librarySettings, inputs, otherArguments) => {
    const importFresh = require('import-fresh');
    const library = importFresh('../methods/library.js');

        //Must return this object at some point
        const response = {
           processFile : false,
           preset : '',
           container : '.mkv',
           handbrakeMode : false,
           ffmpegMode : true,
           reQueueAfter : true,
           infoLog : '',
      
        }

        response.infoLog += ""
      
        if((true) || file.forceProcessing === true){
            response.preset = '-e svt_av1 -b ' + inputs.BitRate + ' -r 24 -E aac -B 160 -R Auto -6 dpl2 -f ' + inputs.Container + ' --optimize ' + inputs.ResolutionSelection + ' --crop 0:0:0:0';
            response.container = '.mkv'
            response.handbrakeMode = true
            response.ffmpegMode = false
            response.processFile = true
            response.infoLog +=  'File is being transcoded at ' + inputs.BitRate + ' Kbps to ' + inputs.ResolutionSelection + ' into ' + inputs.Container + ' \n'
            return response
           }else{
            response.infoLog += "File is being transcoded using custom arguments \n"
            return response
           }
      }

module.exports.details = details;
module.exports.plugin = plugin;