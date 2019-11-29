

function filterByCodec(file, mode, codecs) {


    try {

       // console.log(file,mode,codecs)

        if (mode === 'include') {

            if (codecs.toLowerCase().includes(file.ffProbeData.streams[0].codec_name.toLowerCase())) {

                var response = {
                    outcome: true,
                    note: `☑Codec included \\n`
                }
                return response

            } else {

                var response = {
                    outcome: false,
                    note: `☒Codec excluded \\n`
                }
                return response

            }

        } else if (mode === 'exclude') {

            if (codecs.toLowerCase().includes(file.ffProbeData.streams[0].codec_name.toLowerCase())) {

                var response = {
                    outcome: false,
                    note: `☒Codec excluded \\n`
                }
                return response

            } else {

                var response = {
                    outcome: true,
                    note: `☑Codec not excluded \\n`
                }
                return response

            }
        }

        var response = {
            outcome: false,
            note:  `library.filters.filterByCodec error: ${err.stack} \\n`
        }
        return response
        

    } catch (err) {

        console.log(err)
        var response = {
            outcome: false,
            note: `Filter error hello! ${err}\\n`
        }
        return response
    }

}


module.exports = filterByCodec