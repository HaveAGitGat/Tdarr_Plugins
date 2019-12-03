

module.exports = function transcodeStandardiseAudioCodecs(file, audioEncoder) {


    try {

        var audioIdx = -1
        var hasNonSpecifiedAudioCodecStream = false
        var ffmpegCommandInsert = ''


        //Function required responses
        // preset
        // processFile
        // note



        var audioCodec = audioEncoder

        if (audioEncoder == 'dca') {
            audioCodec = 'dts'
        }



        for (var i = 0; i < file.ffProbeData.streams.length; i++) {


            try {
                if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
                    audioIdx++
                }
            } catch (err) { }


            try {
                if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].codec_name != audioCodec) {

                    ffmpegCommandInsert += ` -c:a:${audioIdx} ${audioEncoder}`
                    hasNonSpecifiedAudioCodecStream = true

                }
            } catch (err) { }
        }


        if (hasNonSpecifiedAudioCodecStream === true) {

            return {
                preset: `,-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy ${ffmpegCommandInsert}`,
                processFile: true,
                note: `File has audio streams which aren't in ${audioCodec} \n`
            }
        }


        return {
            preset: '',
            processFile: false,
            note: `File does not have any audio streams which aren't in ${audioCodec} \n`
        }



    } catch (err) {

        return {
            preset: '',
            processFile: false,
            note: `library.actions.transcodeStandardiseAudioCodecs error: ${err} \n`
        }

    }
}
