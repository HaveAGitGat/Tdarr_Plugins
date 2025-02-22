const details = () => ({
    id: 'Martin_Plugin_001_send_discord_notification',
    Stage: 'Post-processing',
    Name: 'Send Discord Notification',
    Type: 'Video',
    Operation: 'Notify',
    Description: 'Sends a notification to Discord',
    Version: '1.0',
    Tags: 'post-processing,configurable',
    Inputs: [
        {
            name: 'discord_webhook_url',
            type: 'string',
            inputUI: {
                type: 'text',
            },
            tooltip: 'The Discord webhook URL',
        },
        {
            name: 'discord_message',
            type: 'string',
            defaultValue: 'The file transcoding is finished',
            inputUI: {
                type: 'text',
            },
            tooltip: `The message to send to Discord. Use placeholders to use information from the file.
                    \\nExample:\\n
                    The file "{name}" has been transcoded to "{format}"
                    Currently available placeholders are {name} and {format}`,
        }
    ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    inputs = lib.loadDefaultValues(inputs, details);

    const response = {
        file,
        removeFromDB: false,
        updateDB: false,
        processFile: false,
        infoLog: '',
    };

    inputs.discord_message = inputs.discord_message.replace('{name}', file.meta.FileName);
    inputs.discord_message = inputs.discord_message.replace('{format}', file.container);

    fetch(inputs.discord_webhook_url, {
        body: JSON.stringify({
            content: inputs.discord_message,
        }),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
    })
        .then(function (res) {
            console.log('Discord notification sent');
            response.infoLog += 'Discord notification sent\n';
        })
        .catch(function (res) {
            console.log('Discord notification failed');
            response.infoLog += 'Discord notification failed\n';
        });

    return response;
};

module.exports.details = details;
module.exports.plugin = plugin;