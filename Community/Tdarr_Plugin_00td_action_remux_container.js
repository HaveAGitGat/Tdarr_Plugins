const details = () => ({
  id: 'Tdarr_Plugin_00td_action_remux_container',
  Stage: 'Pre-processing',
  Name: 'Remux Container',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This action has a built-in filter. Additional filters can be added.\n\n

  If not in the specified container, the file will be remuxed.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the desired container',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const { container } = inputs;

  const remuxContainer = lib.actions.remuxContainer(
    file,
    container,
  );

  response.preset = ', -map 0 -c copy';
  response.container = `.${inputs.container}`;
  response.handbrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.processFile = remuxContainer.processFile;
  response.infoLog += remuxContainer.note;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
