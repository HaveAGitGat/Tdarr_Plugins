/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_DUrEX",
    Stage: 'Pre-processing',
    Name: "Davo's Ultimate reEcoder eXtended", 
    Type: "Video",
    Operation: "Transcode",
    Description: "One of if not the only plugin that will reencode HEVC to HEVC. So for example from really high bitrate bluray to quality suitable for a TV show. Will reecode video based on tiers and can optionally downscale 4k to 1080p. If target rate percentage is lower than tier will scale to that. Reencodes HEVC files but target percentage is always 1. Will remove audio and subtitles that are not in the configured language or marked as commentary. If there are multiple audio streams you can use priority options to specify your preferred stream to keep. E.g. truehd>dts>ac3. You can optionally reencode audio with bitrate per channel and desired codec and number of channels. Default is still to copy the audio though. eXtended from the original plugin to now use hw or cpu encoding and determine what to use with specific parameters for each GPU.  Finally, now will detect if previously encoded by metadata Davoprocessed=true and if so won't attempt again. This negates the need to rename the file in the flow and check for name.",
    Version: "2.0",
    Tags: "pre-processing,ffmpeg,nvenc h265,qsv h265,configurable,audio only,subtitle only",
    Inputs: [
      {
        name: "target_bitrate_480p576p",
        type: 'string',
        defaultValue: '600000',
        inputUI: { type: 'text' },
        tooltip: `Specify the target bitrate for 480p and 576p files in bps. So 600 kbps = 600000`,
      },
      {
        name: "target_bitrate_720p",
        type: 'string',
        defaultValue: '800000',
        inputUI: { type: 'text' },
        tooltip: `Specify the target bitrate for 720p files in bps. So 800 Kbps = 800000`,
      },
      {
        name: "target_bitrate_1080p",
        type: 'string',
        defaultValue: '1200000',
        inputUI: { type: 'text' },
        tooltip: `Specify the target bitrate for 1080p files in bps. So 1.2 Mbps = 1200000`,
      },
      {
        name: "target_bitrate_4KUHD",
        type: 'string',
        defaultValue: '2000000',
        inputUI: { type: 'text' },
        tooltip: `Specify the target bitrate for 4KUHD files in bps, If 1 is used as the target 4k will be downscaled to 1080p`,
      },
      {
        name: "target_pct_reduction",
        type: 'string',
        defaultValue: '0.50',
        inputUI: { type: 'text' },
        tooltip: `Specify the target reduction of bitrate for Non-HEVC streams. This is used to determine the lower of (target% x input bitrate) and (target_bitrate_resolution). So for example if we start with a h264 file at 2000kbps, target rate 1200kbps and target% 50% the end target rate will be 1000kbps. If the initial file was at 3000kbps the end target rate would be 1200kbps. Note this percentage has no affect on files that are originally HEVC as that would make no sense. Normally 50% is considered a good reduction from h264 to h265/hevc to keep the same quality.
                \\nExample 50%:\\n
                0.50`,
      },
      {
        name: "quality_target",
        type: 'string',
        defaultValue: '23',
        inputUI: { type: 'text' },
        tooltip: `Specify the quality rate to be used. Generally 21-27.
                \\nExample 23:\\n
                23`,
      },
      {
        name: "audio_language",
        type: 'string',
        defaultValue: 'eng,und',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the audio tracks you'd like to keep. Recommended to keep "und" as this stands for undertermined; some files may not have the language specified. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,und

                \\nExample:\\n
                eng,und,jap`,
      },
      {
        name: "audio_commentary",
        type: 'string',
        defaultValue: 'true',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify if audio tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
      },
      {
        name: "subtitle_language",
        type: 'string',
        defaultValue: 'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,jap`,
      },
      {
        name: "subtitle_commentary",
        type: 'string',
        defaultValue: 'true',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify if subtitle tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
      },
	  {
		name: "downscale_audio",
		type: 'string',
		defaultValue: 'false',
		inputUI: { type: 'text' },
		tooltip: `Optionally the script will downscale audio. For example you may have a comedy with trueHD audio at 24000kbps but feel this would be just as good if it was aac at 64K/channel. In that case specify true here. This can make a massive difference to file size. Eg. Dolby True might be around 4-5GB for a movie, yet EAC3 at 600K less than 500MB.`
	  },
	  {
		name: "downscale_audio_codec",
		type: 'string',
		defaultValue: 'eac3',
		inputUI: { type: 'text' },
		tooltip: `If downscaling audio this is the coded. Acceptable values here are ac3, eac3, aac, copy (to just copy). DTS is problematic so not accepted. I have found that AAC tends to have issues with volume changing an im my experience eac3 gives the best result.`
	  },
	  {
		name: "downscale_audio_number_channels",
		type: 'string',
		defaultValue: '6',
		inputUI: { type: 'text' },
		tooltip: `If the optional downscale of audio is specified this is the number of channels to be downscaled to (only valid if less than the number of channels in the stream). For example if 7.1 (8 channels) in the stream, specifying 6 here will downscale to 5.1.  Note 6 is recommended if you are using aac or ac3 as they don't work with 8 channels everywhere. If you need 8 channels and want to downscale use EAC3.`
	  },
	  {
		name: "downscale_audio_rate_channel",
		type: 'string',
		defaultValue: '96',
		inputUI: { type: 'text' },
		tooltip: `If the optional downscale of audio is specified this is the rate (in kbps) it will downscale to per channel. So for 5.1 with the default it will be 6x96 = 576kbps. I would strongly suggest a minimum of 64K, mostly 96K is very good with for most people 128K the most that would be required.`
	  },
	  {
		name: "truehd",
		type: 'string',
		defaultValue: '1',
		inputUI: { type: 'text' },
		tooltip: `Dolby TrueHD is a lossless audio codec that provides the highest quality multi-channel surround sound experience. It is widely considered the best option for audio quality in movies and other high-definition media. Dolby TrueHD files tend to be larger in size compared to lossy codecs, but offer uncompromised audio fidelity.`
	  },
	  {
		name: "dts_hd_ma",
		type: 'string',
		defaultValue: '2',
		inputUI: { type: 'text' },
		tooltip: `DTS-HD Master Audio is a lossless audio codec that offers exceptional multi-channel surround sound quality, rivaling Dolby TrueHD. It is a popular choice for high-definition media like Blu-ray discs. DTS-HD MA files are larger in size but provide a premium audio experience.`
	  },
	  {
		name: "dts_hd",
		type: 'string',
		defaultValue: '3',
		inputUI: { type: 'text' },
		tooltip: `DTS-HD is a high-quality, lossy audio codec that provides surround sound capabilities. It is commonly used in Blu-ray and other high-definition media, delivering a good balance between audio quality and file size. DTS-HD is a recommended option for movie and gaming audio.`
	  },
	  {
		name: "dts",
		type: 'string',
		defaultValue: '4',
		inputUI: { type: 'text' },
		tooltip: `DTS is a lossy audio codec that provides multi-channel surround sound. It is commonly used in various media formats and is a good choice for movie and gaming audio, offering reasonable quality at a smaller file size compared to lossless codecs.`
	  },
	  {
		name: "atmos",
		type: 'string',
		defaultValue: '5',
		inputUI: { type: 'text' },
		tooltip: `Dolby Atmos is an advanced audio technology that adds height channels to the traditional surround sound setup, providing a more immersive and realistic audio experience. It is recommended for high-end movie and gaming setups, but the resulting files will be larger in size.`
	  },
	  {
		name: "flac",
		type: 'string',
		defaultValue: '6',
		inputUI: { type: 'text' },
		tooltip: `FLAC (Free Lossless Audio Codec) is a popular lossless audio format that provides high-quality audio without the large file size of uncompressed audio. It is a recommended choice for music and other applications where file size is a consideration, but audio quality is still important.`
	  },
	  {
		name: "tta",
		type: 'string',
		defaultValue: '7',
		inputUI: { type: 'text' },
		tooltip: `True Audio (TTA) is a lossless audio codec that offers high-quality audio with a smaller file size compared to uncompressed audio. It is a good choice for music or other audio-centric applications where storage space is limited, but lossless quality is desired.`
	  },
	  {
		name: "aac",
		type: 'string',
		defaultValue: '8',
		inputUI: { type: 'text' },
		tooltip: `Advanced Audio Coding (AAC) is a lossy audio codec that provides high-quality audio at relatively low bitrates. It is a widely-used and recommended codec for general multimedia applications, offering a good balance between audio quality and file size.`
	  },
	  {
		name: "eac3",
		type: 'string',
		defaultValue: '9',
		inputUI: { type: 'text' },
		tooltip: `Dolby E-AC-3 (Enhanced AC-3) is a lossy audio codec that provides improved audio quality compared to the standard Dolby AC-3 codec. It is a good choice for movie and TV audio, delivering better quality than AC-3 at a similar file size.`
	  },
	  {
		name: "ac3",
		type: 'string',
		defaultValue: '10',
		inputUI: { type: 'text' },
		tooltip: `Dolby AC-3 (also known as Dolby Digital) is a lossy audio codec that provides multi-channel surround sound. It is commonly used in various media formats and is a recommended option for movie and TV audio, providing decent quality at a relatively small file size.`
	  },
	  {
		name: "mp3",
		type: 'string',
		defaultValue: '11',
		inputUI: { type: 'text' },
		tooltip: `MPEG-1 Audio Layer III (MP3) is a widely-used lossy audio codec that provides a good balance between audio quality and file size. It is a recommended choice for general audio playback, such as music, podcasts, and other multimedia content, where file size is a consideration.`
	  },
	  {
		name: "vorbis",
		type: 'string',
		defaultValue: '12',
		inputUI: { type: 'text' },
		tooltip: `Vorbis is a free and open-source lossy audio codec that provides good audio quality at relatively low bitrates. It is a recommended option for general multimedia applications, particularly where file size is a concern but quality is still important.`
	  },
	  {
		name: "opus",
		type: 'string',
		defaultValue: '13',
		inputUI: { type: 'text' },
		tooltip: `Opus is a versatile, open-source audio codec that can handle a wide range of audio content, from speech to music, providing good quality at low bitrates. It is a recommended choice for various multimedia applications, offering a good balance of quality and file size.`
	  },
	  {
		name: "wav",
		type: 'string',
		defaultValue: '14',
		inputUI: { type: 'text' },
		tooltip: `Waveform Audio File Format (WAV) is an uncompressed audio format that provides high-quality audio, but with larger file sizes compared to compressed formats. It is recommended for professional audio applications or when preserving the highest possible audio quality is the priority, regardless of file size.`
	  },
	  {
		name: "pcm_s16le",
		type: 'string',
		defaultValue: '15',
		inputUI: { type: 'text' },
		tooltip: `PCM signed 16-bit little-endian is an uncompressed audio format that stores audio data as raw, 16-bit samples in little-endian byte order. It provides high-quality audio but results in larger file sizes, making it more suitable for professional audio applications or archiving.`
	  },
	  {
		name: "pcm_s24le",
		type: 'string',
		defaultValue: '16',
		inputUI: { type: 'text' },
		tooltip: `PCM signed 24-bit little-endian is an uncompressed audio format that stores audio data as raw, 24-bit samples in little-endian byte order. It provides even higher audio quality than 16-bit PCM, but with larger file sizes, making it more suitable for professional audio applications or archiving.`
	  },
	  {
		name: "pcm_s32le",
		type: 'string',
		defaultValue: '17',
		inputUI: { type: 'text' },
		tooltip: `PCM signed 32-bit little-endian is an uncompressed audio format that stores audio data as raw, 32-bit samples in little-endian byte order. It provides the highest audio quality among the PCM formats, but results in the largest file sizes, making it most suitable for professional audio applications or archiving.`
	  },
	  {
		name: "wma",
		type: 'string',
		defaultValue: '18',
		inputUI: { type: 'text' },
		tooltip: `Windows Media Audio (WMA) is a proprietary audio codec developed by Microsoft that provides good quality at relatively low bitrates. It is a recommended option for general multimedia applications, particularly on Windows-based systems, where file size is a consideration.`
	  },
	  {
		name: "ra",
		type: 'string',
		defaultValue: '19',
		inputUI: { type: 'text' },
		tooltip: `RealAudio (RA) is an audio codec developed by RealNetworks that was commonly used for streaming audio on the internet. While it is not as widely used today, it may still be encountered in some legacy media or streaming applications.`
	  },
	  {
		name: "ape",
		type: 'string',
		defaultValue: '20',
		inputUI: { type: 'text' },
		tooltip: `Monkey's Audio (APE) is a lossless audio codec that provides high-quality audio with a smaller file size compared to uncompressed audio. It is a recommended choice for music enthusiasts or applications where preserving audio quality is important, but storage space is limited.`
      },
    ],
  };
};



// #region Helper Classes/Modules

class Log {
  constructor() {
    this.entries = [];
  }

  Add(entry) { this.entries.push(entry); }
  
  AddSuccess(entry) { this.entries.push(`☑ ${entry}`); }

  AddError(entry) { this.entries.push(`☒ ${entry}`); }

  GetLogData() { return this.entries.join("\n"); }
}

class Configurator {
  constructor(defaultOutputSettings = []) {
    this.shouldProcess = defaultOutputSettings.length > 0;
    this.outputSettings = defaultOutputSettings;
    this.inputSettings = [];
  }

  AddInputSetting(configuration) { this.inputSettings.push(configuration); }

  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }

  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }

  RemoveOutputSetting(configuration) {
    const index = this.outputSettings.indexOf(configuration);
    if (index !== -1) {
      this.outputSettings.splice(index, 1);
    }
  }

  GetOutputSettings() { return this.outputSettings.join(" "); }

  GetInputSettings() { return this.inputSettings.join(" "); }
}

// #endregion

// #region Plugin Methods

  // Updated calculateBitrate function to handle both 'bit_rate' and 'BPS'
  
function calculateBitrate(stream, file, jobReport) {
    const bitrateProbe = 
      stream.bit_rate || // Check if bit_rate exists in the stream
      (stream.tags && stream.tags.BPS) || // Check for BPS in the tags object if it exists
      file.bit_rate || 0; // Fallback to file bit_rate or 0 if nothing else is found

    jobReport.steps.push(`Calculated bitrate: ${bitrateProbe} bps`);
    return parseInt(bitrateProbe, 10); // Convert to an integer
}


function loopOverStreamsOfType(file, type, method, jobReport) {
  for (let id = 0; id < file.ffProbeData.streams.length; id++) {
    if (file.ffProbeData.streams[id].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[id], id);
    }
  }
}



function buildAudioConfiguration(inputs, file, jobReport) {
    const configuration = new Configurator([]);
    const languages = inputs.audio_language.split(",");
	
    // print languages to help with issues
    jobReport.steps.push(`Audio languages specified: ${languages.join(", ")}`);
    
	const removeCommentary = inputs.audio_commentary === "true";
    const downscaleAudio = inputs.downscale_audio === "true";
    const downscaleCodec = inputs.downscale_audio_codec;
    const downscaleRatePerChannel = parseInt(inputs.downscale_audio_rate_channel);
    const downscaleNumberChannels = parseInt(inputs.downscale_audio_number_channels);
    const audioPriorityMap = {};

    const codecInputs = [
        { name: "truehd", input: inputs.truehd },
        { name: "dts_hd_ma", input: inputs.dts_hd_ma },
        { name: "dts_hd", input: inputs.dts_hd },
        { name: "dts", input: inputs.dts },
        { name: "atmos", input: inputs.atmos },
        { name: "flac", input: inputs.flac },
        { name: "tta", input: inputs.tta },
        { name: "aac", input: inputs.aac },
        { name: "eac3", input: inputs.eac3 },
        { name: "ac3", input: inputs.ac3 },
        { name: "mp3", input: inputs.mp3 },
        { name: "vorbis", input: inputs.vorbis },
        { name: "opus", input: inputs.opus },
        { name: "wav", input: inputs.wav },
        { name: "pcm_s16le", input: inputs.pcm_s16le },
        { name: "pcm_s24le", input: inputs.pcm_s24le },
        { name: "pcm_s32le", input: inputs.pcm_s32le },
        { name: "wma", input: inputs.wma },
        { name: "ra", input: inputs.ra },
        { name: "ape", input: inputs.ape }
    ];

    codecInputs.forEach(codec => {
        if (codec.input) {
            audioPriorityMap[codec.name] = codec.input === '+' ? '+' : parseInt(codec.input);
            jobReport.steps.push(`Processing priority input for codec: ${codec.name} with value: ${codec.input}`);
        }
    });

    jobReport.steps.push(`Audio priority map: ${JSON.stringify(audioPriorityMap)}`);

    let retainedAudioTracks = [];
    let retainedAudioTracksData = [];
    let highestPriorityTrack = null;

    function normalizeProfile(profile) {
        if (!profile) return null;
        return profile.toLowerCase().replace(/[\s-]+/g, "_");
    }

    let audioMapped = false;

	function audioProcess(stream, id) {
		// Check if the stream has the required tags
		if ("tags" in stream && "language" in stream.tags) {
			// Get the language and convert it to lowercase
			const language = stream.tags.language.toLowerCase();
			const languageUpperCase = language.toUpperCase();

			// Log the processing of the audio track
			jobReport.steps.push(`Processing audio track (stream id: ${id}, language: ${language})`);

			// Check if the stream language is in the specified languages list
			if (!languages.some(lang => lang.toUpperCase() === languageUpperCase)) {
				jobReport.steps.push(`Removing audio track (stream id: ${id}, language: ${languageUpperCase}) as it's not in the specified languages list.`);
				return;
			}

			const codec = stream.codec_name;
			const profile = normalizeProfile(stream.profile);
			const isCommentary = stream.tags.title && stream.tags.title.toLowerCase().includes('commentary');
			const channels = stream.channels || 2;
			const originalBitrate = calculateBitrate(stream, file, jobReport);

			let codecKey = codec;
			let codecDisplayName = codec;

			if (profile && audioPriorityMap[profile]) {
				codecKey = profile;
				codecDisplayName = profile;
			}

			const priority = audioPriorityMap[codecKey];

			jobReport.steps.push(`Stream Details (id: ${id}):`);
			jobReport.steps.push(` Codec: ${codec}`);
			jobReport.steps.push(` Profile: ${profile || 'unknown'}`);
			jobReport.steps.push(` Bitrate: ${originalBitrate}`);
			jobReport.steps.push(` Channels: ${channels}`);
			jobReport.steps.push(` Layout: ${stream.channel_layout}`);
			jobReport.steps.push(` Language: ${language}`);
			jobReport.steps.push(` Commentary: ${isCommentary ? 'yes' : 'no'}`);

			if (isCommentary) {
				if (removeCommentary) {
					jobReport.steps.push(`Removing commentary track (stream id: ${id}, codec: ${codecDisplayName}) due to 'remove commentary' setting.`);
					return;
				} else {
					jobReport.steps.push(`Retaining commentary track (stream id: ${id}) in language ${language}, channels: ${channels}`);
					retainedAudioTracks.push(id);
					retainedAudioTracksData.push({ trackId: id, codec: stream.codec_name, channels: stream.channels, bitrate: originalBitrate });
					return;
				}
			}

			if (priority !== undefined) {
				if (!highestPriorityTrack || priority < highestPriorityTrack.priority) {
					if (highestPriorityTrack) {
						jobReport.steps.push(`Replacing higher-priority audio track (stream id: ${highestPriorityTrack.id}) with current stream (stream id: ${id}) due to better priority: ${priority}`);
						
						// Remove the previous highest priority track from both arrays
						retainedAudioTracks = retainedAudioTracks.filter(trackId => trackId !== highestPriorityTrack.id);
						retainedAudioTracksData = retainedAudioTracksData.filter(trackData => trackData.trackId !== highestPriorityTrack.id);
					}

					highestPriorityTrack = { id, priority };
					retainedAudioTracks.push(id);
					retainedAudioTracksData.push({ trackId: id, codec: stream.codec_name, channels: stream.channels, bitrate: originalBitrate });
					jobReport.steps.push(`Mapping highest priority audio track (stream id: ${id}, codec: ${codecDisplayName}, priority: ${priority})`);
				}
			} else {
				jobReport.steps.push(`Audio track (stream id: ${id}, codec: ${codecDisplayName}) matches language but has no priority, it will not be retained.`);
			}

			if (!originalBitrate || originalBitrate === 'unknown' && downscaleCodec !== 'copy') {
				configuration.AddOutputSetting(`-map 0:${id}`);
				configuration.AddOutputSetting("-c:a copy");
				jobReport.steps.push(`Audio track (stream id: ${id}) will be copied because its bitrate is ${originalBitrate} (unknown or missing).`);
				audioMapped = true;
				return;
			}

		} else {
			jobReport.steps.push(`Removing audio track (stream id: ${id}) due to missing language tag or unsupported codec.`);
		}
	}


    if (!file.ffProbeData || !file.ffProbeData.streams) {
        jobReport.steps.push("Error: ffProbeData or streams are undefined.");
        return configuration;
    }

    loopOverStreamsOfType(file, "audio", audioProcess, jobReport);

    function applyDownscale(trackId, codec, channels, bitrate) {
        const downscaleChannels = Math.min(channels, downscaleNumberChannels);
        let downscaleBitrate = calculateDownscaledBitrate(bitrate, downscaleChannels);

        if (downscaleBitrate === null) {
            configuration.AddOutputSetting(`-map 0:${trackId}`);
            configuration.AddOutputSetting("-c:a copy");
            jobReport.steps.push(`Audio track (stream id: ${trackId}) will be copied because its original bitrate (${bitrate}) is lower than the downscale target.`);
        } else {
            const downscaleBitrateKbps = downscaleBitrate / 1000;
            configuration.AddOutputSetting(`-map 0:${trackId}`);
            configuration.AddOutputSetting(`-c:a ${codec}`);
            configuration.AddOutputSetting(`-b:a ${downscaleBitrateKbps}k`);
            configuration.AddOutputSetting(`-ac ${downscaleChannels}`);
            jobReport.steps.push(`Audio track (stream id: ${trackId}) will be downscaled to ${downscaleBitrateKbps} kbps with codec: ${codec} and channels: ${downscaleChannels}.`);
        }
    }

    function calculateDownscaledBitrate(originalBitrate, channels) {
        const calculatedBitrate = channels * downscaleRatePerChannel * 1000;
        jobReport.steps.push(`Checking bitrate for downscaling. Original bitrate: ${originalBitrate}, calculated target: ${calculatedBitrate} bps for ${channels} channels.`);
        if (originalBitrate !== 'unknown' && originalBitrate < calculatedBitrate) {
            jobReport.steps.push(`Original bitrate (${originalBitrate} bps) is lower than downscale target (${calculatedBitrate} bps), copying the track without downscaling.`);
            return null;
        }
        return calculatedBitrate;
    }

    jobReport.steps.push("Starting audio configuration...");

    if (retainedAudioTracks.length > 0) {
        jobReport.steps.push(`Retained audio tracks: ${retainedAudioTracks.length}`);

        retainedAudioTracksData.forEach(trackData => {
            jobReport.steps.push(`Processing retained audio track (ID: ${trackData.trackId}, Codec: ${trackData.codec}, Channels: ${trackData.channels}, Bitrate: ${trackData.bitrate})`);

            if (downscaleAudio) {
                const codec = downscaleCodec ? downscaleCodec.toLowerCase() : "copy";
                if (["aac", "ac3", "eac3"].includes(codec)) {
                    applyDownscale(trackData.trackId, codec, trackData.channels, trackData.bitrate);
                } else {
                    configuration.AddOutputSetting(`-map 0:${trackData.trackId}`);
                    configuration.AddOutputSetting("-c:a copy");
                    jobReport.steps.push(`Audio track (stream id: ${trackData.trackId}) will be copied due to unsupported downscale codec.`);
                }
            } else {
                configuration.AddOutputSetting(`-map 0:${trackData.trackId}`);
                configuration.AddOutputSetting("-c:a copy");
                jobReport.steps.push(`Audio track (stream id: ${trackData.trackId}) will be copied because downscaling is disabled.`);
            }
            audioMapped = true;
        });
    } else {
        jobReport.steps.push("Error: No audio streams found in the file.");
    }

    if (!audioMapped) {
        jobReport.steps.push("Fallback: No audio streams were mapped, copying all available audio streams.");
        loopOverStreamsOfType(file, "audio", (stream, id) => {
            jobReport.steps.push(`Mapping audio stream (ID: ${id}) as fallback.`);
            configuration.AddOutputSetting(`-map 0:${id}`);
        });
        configuration.AddOutputSetting("-c:a copy");
    }

    jobReport.steps.push("Audio track processing completed.");
    return configuration;
}




function buildSubtitleConfiguration(inputs, file, jobReport) {
  jobReport.steps.push("Within Subtitle function");

  const filePath = file._id || file.file;

  if (!filePath) {
    jobReport.steps.push("Warning: file path is undefined. Inspecting file object:");
    jobReport.steps.push(`File object: ${JSON.stringify(file, null, 2)}`);
  } else {
    jobReport.steps.push(`File name: ${filePath}`);
  }

  if (filePath && filePath.toLowerCase().endsWith(".ts")) {
    jobReport.steps.push("File is of type .ts, disabling subtitles with '-sn' flag.");
    return new Configurator(["-sn"]);
  }

  const configuration = new Configurator(["-c:s copy"]);
  const languages = inputs.subtitle_language.split(",");

  function subtitleProcess(stream, id) {
    jobReport.steps.push(`Full stream data: ${JSON.stringify(stream, null, 2)}`);

    const codec = stream.codec_name || "unknown";
    jobReport.steps.push(`Detected subtitle stream: ID=${id}, Codec=${codec}`);

    if (codec === "unknown" || codec === "none") {
      jobReport.steps.push(`Skipping problematic subtitle track (stream id: ${id})`);
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      return;
    }

    if ("tags" in stream && "language" in stream.tags) {
      const language = stream.tags.language.toLowerCase();
      if (languages.includes(language)) {
        jobReport.steps.push(`Retaining subtitle track in language ${language} (stream id: ${id})`);
        configuration.AddOutputSetting(`-map 0:${id}`);
      } else {
        jobReport.steps.push(`Removing subtitle track in language ${language} (stream id: ${id})`);
      }
    }
  }

  loopOverStreamsOfType(file, "subtitle", subtitleProcess, jobReport);

  // Safely log the final configuration settings
  const finalSettings = Array.isArray(configuration.settings) 
    ? configuration.settings.join(' ') 
    : 'No settings available';
  jobReport.steps.push(`Final subtitle settings: ${finalSettings}`);

  return configuration;
}



function buildVideoConfiguration(inputs, file, jobReport, encoder) {
  const configuration = new Configurator(["-map -0:d?"]); // Exclude data streams
  jobReport.steps.push("Within buildVideoConfiguration...");

  let firstVideoStreamProcessed = false; // Track if the first video stream has been processed

  // Function to process video streams
  function videoProcess(stream, id) {
    if (firstVideoStreamProcessed) return; // Skip if already processed

    jobReport.steps.push(`Processing video stream id: ${id}, codec: ${stream.codec_name}`);

    // Map the video stream
    configuration.AddOutputSetting(`-map 0:${id}`); 

    // Calculate bitrate using the updated function
    const bitrateprobe = calculateBitrate(stream, file, jobReport);
    jobReport.steps.push(`Bitrate for video stream ${id}: ${bitrateprobe} bps`);

    let target_bitrate;

    // Set target bitrate based on video resolution
    switch (file.video_resolution) {
      case "4KUHD":
        target_bitrate = inputs.target_bitrate_4KUHD === "1" ? inputs.target_bitrate_1080p : inputs.target_bitrate_4KUHD;
        break;
      case "1080p":
        target_bitrate = inputs.target_bitrate_1080p;
        break;
      case "720p":
        target_bitrate = inputs.target_bitrate_720p;
        break;
      case "480p":
      case "576p":
        target_bitrate = inputs.target_bitrate_480p576p;
        break;
      default:
        target_bitrate = inputs.target_bitrate_1080p;
        jobReport.steps.push(`Unknown video resolution: ${file.video_resolution}, defaulting to 1080p target bitrate.`);
    }

    let target_pct_reduction_value = parseFloat(inputs.target_pct_reduction);

    jobReport.steps.push(`Video stream codec is: ${stream.codec_name}`);

    // Check if the video stream is HEVC (H.265)
    if (stream.codec_name.toLowerCase() === 'hevc') {
      target_pct_reduction_value = 1;
      jobReport.steps.push(`Video stream is HEVC. Setting target_pct_reduction_value to 1.`);
    }

    // Handle invalid or missing bitrateprobe
    if (isNaN(bitrateprobe) || !bitrateprobe) {
      jobReport.steps.push(`Bitrate probe is invalid for video stream id: ${id}. Using default copy configuration.`);
      configuration.AddOutputSetting("-c:v copy");
      firstVideoStreamProcessed = true;
      return;
    }

    jobReport.steps.push(`bitrateprobe: ${bitrateprobe}`);
    jobReport.steps.push(`target_pct_reduction_value: ${target_pct_reduction_value}`);
    jobReport.steps.push(`target_bitrate: ${target_bitrate}`);

    // Calculate the target bitrate based on reduction percentage and current bitrate
    let bitratetarget;
    if (bitrateprobe * target_pct_reduction_value > target_bitrate) {
      bitratetarget = target_bitrate;
      jobReport.steps.push(`Using target bitrate: ${bitratetarget} bps.`);
    } else {
      bitratetarget = bitrateprobe * target_pct_reduction_value;
      jobReport.steps.push(`Using adjusted bitrate: ${bitratetarget} bps based on current bitrate and target_pct_reduction.`);
    }

    let bitratetarget_kbps = Math.round(bitratetarget / 1000); // Convert to kbps
    jobReport.steps.push(`Target bitrate for output: ${bitratetarget_kbps} kbps`);

    // Check for copy condition
    if (stream.codec_name.toLowerCase() === 'hevc' && 
        bitratetarget >= bitrateprobe * 0.95 && 
        bitratetarget <= bitrateprobe * 1.05) {
      jobReport.steps.push(`Copying video stream ${id} as codec and bitrate are unchanged.`);
      configuration.AddOutputSetting("-c:v copy");
      firstVideoStreamProcessed = true;
      return;
    }

    let bufferSize_kbps = Math.round(bitratetarget_kbps * 2); // Set buffer size
    jobReport.steps.push(`Buffer size: ${bufferSize_kbps} kbps`);

    // build configuration based on hw encoder type

	configuration.AddOutputSetting(`-c:v ${encoder.name} -qmin 0 -cq:v ${inputs.quality_target} -b:v ${bitratetarget_kbps}k -maxrate ${bitratetarget_kbps}k -bufsize ${bufferSize_kbps}k`);
	jobReport.steps.push(`Transcoding to HEVC using ${encoder.name}`);


    // If input is 4K and target_bitrate_4KUHD is set to 1, scale down to 1080p
    if (inputs.target_bitrate_4KUHD === "1" && file.video_resolution === "4KUHD") {
      configuration.AddOutputSetting(`-vf scale=1920:1080`); // Scale to 1080p
      jobReport.steps.push("Adding resolution scaling to 1080p.");
    }

    firstVideoStreamProcessed = true; // Mark first video stream as processed
  }

  // Process all video streams
  loopOverStreamsOfType(file, "video", videoProcess, jobReport);

  if (!configuration.shouldProcess) {
    jobReport.steps.push("No video processing necessary");
  }

  return configuration;
}




// #endregion

const hasEncoder = async (encoder, ffmpegPath, jobReport) => {
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
        const command = `${ffmpegPath} -f lavfi -i color=c=black:s=256x256:d=1:r=30 -c:v ${encoder} -f null /dev/null`;
        
        exec(command, (error) => {
            if (jobReport) {
                jobReport.steps.push(`Checking encoder ${encoder}: ${error ? 'Not Available' : 'Available'}`);
            }
            resolve(!error);
        });
    });
};

const getBestHevcEncoder = async (otherArguments, jobReport) => {
    const ffmpegPath = otherArguments.ffmpegPath;
    const hevcEncoders = [
        {
            name: 'hevc_nvenc',
            type: 'gpu'
        },
        {
            name: 'hevc_amf',
            type: 'gpu'
        },
        {
            name: 'hevc_vaapi',
            type: 'gpu'
        },
        {
            name: 'hevc_qsv',
            type: 'gpu'
        },
        {
            name: 'hevc_videotoolbox',
            type: 'gpu'
        },
        {
            name: 'libx265',
            type: 'cpu'
        }
    ];

    if (jobReport) {
        jobReport.steps.push("Detecting available HEVC encoders:");
    }
    
    for (const encoder of hevcEncoders) {
        if (jobReport) {
            jobReport.steps.push(`Checking encoder: ${encoder.name}`);
        }
        
        const isAvailable = await hasEncoder(encoder.name, ffmpegPath, jobReport);
        
        if (isAvailable) {
            if (jobReport) {
                jobReport.steps.push(`Encoder ${encoder.name} is available`);
            }
            return encoder;
        }
    }

    if (jobReport) {
        jobReport.steps.push("No HEVC encoders found");
    }
    return null;
};




const plugin = async (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    inputs = lib.loadDefaultValues(inputs, details);
    const response = {
        container: ".mkv",
        FFmpegMode: true,
        handBrakeMode: false,
        infoLog: "",
        processFile: false,
        preset: "",
        reQueueAfter: true,
    };

    // Initialize jobReport at the start of the function
    const jobReport = {
        type: "plugin",
        pluginName: "DUrE - Davo's Ultimate ReEncoder eXtended",
        steps: [],
    };

    try {
        // Extensive logging of metadata
        jobReport.steps.push("Metadata Inspection:");
        jobReport.steps.push(`Full ffProbeData: ${JSON.stringify(file.ffProbeData, null, 2)}`);
        
        // Log all tags if they exist
        if (file.ffProbeData?.format?.tags) {
            jobReport.steps.push("All Metadata Tags:");
            Object.entries(file.ffProbeData.format.tags).forEach(([key, value]) => {
                jobReport.steps.push(`  ${key}: ${value}`);
            });
        }



		// Check for processed metadata with multiple variations
		const processedMetadataKeys = [
			'DAVOPROCESSED', 
			'davoprocessed', 
			'DavoProcessed'
		];

		// Debug logging
		jobReport.steps.push("Checking processed metadata keys:");

		let isProcessed = false;
		for (const key of processedMetadataKeys) {
			const tagValue = file.ffProbeData?.format?.tags?.[key];
			jobReport.steps.push(`Checking key: ${key}, Value: ${tagValue}`);
			
			if (tagValue !== undefined) {
				// Remove quotes and convert to lowercase
				isProcessed = tagValue.replace(/^"|"$/g, '').toLowerCase() === "true";
				jobReport.steps.push(`Matched key: ${key}, Processed: ${isProcessed}`);
				if (isProcessed) break;
			}
		}

		jobReport.steps.push(`Processed check result: ${isProcessed}`);


        if (isProcessed) {
            jobReport.steps.push("File has already been processed by DUrE");
            return {
                processFile: false,
                preset: "",
                container: response.container,
                handBrakeMode: response.handBrakeMode,
                FFmpegMode: response.FFmpegMode,
                reQueueAfter: response.reQueueAfter,
                infoLog: "File already processed",
                report: jobReport,
            };
        }

        // Pass jobReport to the encoder detection function
        const encoder = await getBestHevcEncoder(otherArguments, jobReport);
        if (!encoder) {
            jobReport.steps.push("No HEVC encoders found");
            return {
                ...response,
                report: jobReport
            };
        }
        jobReport.steps.push(`Best available encoder: ${encoder.name} (${encoder.type})`);

        // Output all inputs before video configuration
        jobReport.steps.push("Plugin Inputs:");
        for (const inputName in inputs) {
            jobReport.steps.push(` ${inputName}: ${inputs[inputName]}`);
        }
        jobReport.steps.push("Starting video configuration...");
        const videoSettings = buildVideoConfiguration(inputs, file, jobReport, encoder);
        jobReport.steps.push(`videoSettings: ${videoSettings.GetOutputSettings()}`);
        jobReport.steps.push("Ending video configuration...");

        jobReport.steps.push("Starting audio configuration...");
        const audioSettings = buildAudioConfiguration(inputs, file, jobReport);
        jobReport.steps.push(`audioSettings from function: ${audioSettings.GetOutputSettings()}`);
        jobReport.steps.push("Ending audio configuration...");

        jobReport.steps.push("Starting subtitle configuration...");
        const subtitleSettings = buildSubtitleConfiguration(inputs, file, jobReport);
        jobReport.steps.push(`subtitleSettings: ${subtitleSettings.GetOutputSettings()}`);
        jobReport.steps.push("Ending subtitle configuration...");

        // Modify the preset to use the detected encoder
        let hwAccelPart = ''; // Declare outside the block with a default empty string
        if (encoder.name === 'hevc_nvenc') {
            hwAccelPart = `-hwaccel cuda -hwaccel_output_format cuda`;
            jobReport.steps.push("Response.preset (NVENC)");
        } else if (encoder.name === 'hevc_qsv') {
            hwAccelPart = `-hwaccel qsv -hwaccel_output_format qsv`;
            jobReport.steps.push("Response.preset (QSV)");
        } else {
            // No need to redeclare hwAccelPart, it remains an empty string
            jobReport.steps.push("Response.preset (CPU - fallback)");
        }

        response.preset = `${hwAccelPart} <io> ${videoSettings.GetOutputSettings()} ${audioSettings.GetOutputSettings()} ${subtitleSettings.GetOutputSettings()} -max_muxing_queue_size 9999 -bf 5 -analyzeduration 2147483647 -probesize 2147483647 -map_metadata 0 -metadata DavoProcessed="true"`;

        // Extra parameters for bad codec handling
        for (let i = 0; i < file.ffProbeData.streams.length; i++) {
            const badTypes = ['mov_text', 'eia_608', 'timed_id3', 'mp4s'];
            if (badTypes.includes(file.ffProbeData.streams[i].codec_name)) {
                response.preset += `-map -0:${i}`;
                jobReport.steps.push(`Removing bad codec stream: ${file.ffProbeData.streams[i].codec_name}`);
            }
        }

        response.processFile = audioSettings.shouldProcess || videoSettings.shouldProcess || subtitleSettings.shouldProcess;
        jobReport.steps.push(`Response.processfile: ${response.processFile}`);
        jobReport.steps.push(`Response.preset: ${response.preset}`);

        if (!response.processFile) {
            jobReport.steps.push("No need to process file");
        }

        // Return job report information along with other properties
        return {
            processFile: response.processFile,
            preset: response.preset,
            container: response.container,
            handBrakeMode: response.handBrakeMode,
            FFmpegMode: response.FFmpegMode,
            reQueueAfter: response.reQueueAfter,
            infoLog: "",
            report: jobReport,
        };
    } catch (error) {
        jobReport.steps.push(`Error in plugin: ${error.message}`);
        return {
            ...response,
            report: jobReport
        };
    }
};






module.exports.details = details;
module.exports.plugin = plugin;