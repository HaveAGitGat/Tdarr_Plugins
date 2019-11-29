

function filterByMedium(file, medium) {

    try {

        if (file.fileMedium !== medium) {

            var response = {
                outcome: false,
                note: `☒File is not ${medium} \\n`
            }
            return response

        } else {

            var response = {
                outcome: true,
                note: `☑File is ${medium} \\n`
            }
            return response
        }

    } catch (err) {
        var response = {
            outcome: false,
            note:  `library.filters.filterByMedium error: ${err.stack} \\n`
        }
        return response
    }
}


module.exports = filterByMedium