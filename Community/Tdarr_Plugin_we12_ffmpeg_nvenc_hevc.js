module.exports.details = function details() {
	return {
		id: "Tdarr_Plugin_we12_ffmpeg_nvenc_hevc",
		Name: "Weslocke's NVENC Encoder for FFMPEG",
		Stage: "Pre-processing",
		Type: "Video",
		Operation: "Transcode",
		Description: `This is a highly configurable plugin to convert media to h265 (hevc) wrapped in an .MKV container using NVENC encoding.  Audio and subtitle streams are simply copied and not affected.  This is highly based off of DrDD's All-In-One hevc script (and by based on I mean it forms the vast majority of the code here)`,
		Version: "1.0",
		Tags: "pre-processing,ffmpeg, nvenc h265",
		Inputs: [{
			name: "minimum_target_bitrate",
			tooltip: "The minimum bitrate allowed for a file conversion. Any file with an original bitrate lower than this will cause transcoding to be skipped for that specific file.\\n\\nIf this is left blank then all files will be transcoded.  Please think carfeully about this.  Since transcoding is a 'lossy' action, if your source material is already a low bitrate then blockiness and distortion will be magnified by further encoding.  While quality is purely subjective to the person viewing the material, when you get below 1000 you will more than likely start seeing quite noticeable degradation of the video image.\\n\\nPlease just enter a bare number\\n\\nExample value: 1500",
		}, {
			name: "wanted_height",
			tooltip: "The height to scale down to, by default will not upscale to this resolution.\\n\\nIf blank then keep current resolution and perform no rescaling.",
		}, {
			name: "enable_upscale",
			tooltip: "By default the given 'wanted_height' will only force downscaling, this will allow you override that and enable upscaling as well.\\n\\n(true/false) with a default value of false",
		}, {
			name: "by_bitrate",
			tooltip: "Options are true/full/false\\n\\n'true' Uses the target bitrate in the following field.\\n'full' Keeps the original file Bitrate with no modification\\n'false'( or blank.  Default value is false) will set the following conversions of the source file Bitrate:\\n<3000 = Full Bitrate\\n3000-5999 = 67% of Bitrate\\n6000-9999 = 57% of Bitrate\\n>= 10000 = 50% of Bitrate\\n\\nPlease note, this will be overriden by setting 'by_quality' to true.  They do not work together, it is either or",
		}, {
			name: "set_bitrate",
			tooltip: "If 'by_bitrate' is set to 'true' then set the target bitrate  (Defaults to 1500)\\n If the original file bitrate is less than the bitrate entered, the target bitrate will be set to 83% of the original file bitrate for the HEVC conversion.\\n\\nPlease note that this is not a hard data rate, but is instead a variable 'target' bitrate with an upper/lower limit of around 40% variance from the target bitrate in either direction\\n\\nPlease note, this will be overriden by setting 'by_quality' to true.  They do not work together, it is either or",
		}, {
			name: "by_quality",
			tooltip: "Use quality setting instead of bitrate.  If this is set to 'true' it will override the above bitrate settings \\n(true/false, default to false)",
		}, {
			name: "set_quality",
			tooltip: "Set target quality from 0-51, a lower value will result in a higher quality/size file.   Will default to 22 if no value is entered here.\\n\\nOf note: if you are using this with a QSV plugin, and both are set to use a Quality rating then know that NVENC is much more aggresive at maintaining bitrate.  (Image quality is subjective to the viewer, I'm only speaking of bitrate)\\n\\nIn my testing it appears that there is about a 4-stop difference between the two.  A QSV Quality of '20' will have a resulting bitrate that's roughly around the result of a '24' when using NVENC.\\n\\nAgain, this is purely on resulting bitrate, not about the image quality between the two encoding systems.",
		}, {
			name: "set_preset",
			tooltip: "Set Nvenc speed profile to use.   Will default to 'medium' if this is not entered. You can use either the word (Ie. 'fast') or the level (Ie. '3').  They're listed below with 'keyword'<SPACE>'level'<SPACE>'description'\\n     slow            1            E..V....... hq 2 passes\\n     medium          2            E..V....... hq 1 pass\\n     fast            3            E..V....... hp 1 pass\\n     hp              4            E..V....... \\n     hq              5            E..V....... \\n     bd              6            E..V....... \\n     ll              7            E..V....... low latency\\n     llhq            8            E..V....... low latency hq\\n     llhp            9            E..V....... low latency hp\\n     lossless        10           E..V....... lossless\\n     losslesshp      11           E..V....... lossless hp\\n     p1              12           E..V....... fastest (lowest quality)\\n     p2              13           E..V....... faster (lower quality)\\n     p3              14           E..V....... fast (low quality)\\n     p4              15           E..V....... medium (default)\\n     p5              16           E..V....... slow (good quality)\\n     p6              17           E..V....... slower (better quality)\\n     p7              18           E..V....... slowest (best quality)",
		},
		],
	};
};

// #region Helper Classes/Modules

/**
 * Handles logging in a standardised way.
 */
class Log {
	constructor() {
		this.entries = [];
	}

	/**
	 *
	 * @param {String} entry the log entry string
	 */
	Add(entry) {
		this.entries.push(entry);
	}

	/**
	 *
	 * @param {String} entry the log entry string
	 */
	AddSuccess(entry) {
		this.entries.push(`? ${entry}`);
	}

	/**
	 *
	 * @param {String} entry the log entry string
	 */
	AddError(entry) {
		this.entries.push(`? ${entry}`);
	}

	/**
	 * Returns the log lines separated by new line delimiter.
	 */
	GetLogData() {
		return this.entries.join("\n");
	}
}

/**
 * Handles the storage of FFmpeg configuration.
 */
class Configurator {
	constructor(defaultOutputSettings = null) {
		this.shouldProcess = false;
		this.outputSettings = defaultOutputSettings || [];
		this.inputSettings = [];
	}

	AddInputSetting(configuration) {
		this.inputSettings.push(configuration);
	}

	AddOutputSetting(configuration) {
		this.shouldProcess = true;
		this.outputSettings.push(configuration);
	}

	RemoveOutputSetting(configuration) {
		var index = this.outputSettings.indexOf(configuration);

		if (index === -1) return;
		this.outputSettings.splice(index, 1);
	}

	GetOutputSettings() {
		return this.outputSettings.join(" ");
	}

	GetInputSettings() {
		return this.inputSettings.join(" ");
	}
}

// #endregion

// #region Plugin Methods

/**
 * Returns the duration of the file in minutes.
 */
function getFileDurationInMinutes(file) {
	return typeof file.meta.Duration !== undefined ? file.meta.Duration * 0.0166667 : file.ffProbeData.streams[0].duration * 0.0166667;
}


/**
 * Returns bitrate information.
 */
function calculateBitrate(
	inputs,
	file,
	divideBy = 2,
	minMultiplier = 0.7,
	maxMultiplier = 1.3
) {
	var duration = getFileDurationInMinutes(file);
	var original = ~~(file.file_size / (duration * 0.0075));
	var used_bitrate = 1500;

	if (inputs.set_bitrate && !isNaN(inputs.set_bitrate)) {
		used_bitrate = inputs.set_bitrate;
	}

	// Change how much we cut the bitrate based on the original bitrate
	// of the file. When bitrate is already low, we don't want to lose
	// much more, but can still do a conversion.
	if (inputs.by_bitrate === "true") {
		if (original > used_bitrate) {
			divideBy = (original / used_bitrate);
		} else {
			divideBy = 1.2;
		}
	} else if (inputs.by_bitrate === "full") {
		divideBy = 1;
		minMultiplier = 1;
		maxMultiplier = 1;			
	} else {
		if (original >= 10000) {
			divideBy = 2;
		}

		if (original < 10000 && original >= 6000) {
			divideBy = 1.75;
		}

		if (original < 6000) {
			divideBy = 1.5;
		}

		if (original < 3000) {
			divideBy = 1.25;
			minMultiplier = 0.85;
			maxMultiplier = 1.15;	
		}
		if (original < 1500) {
			divideBy = 1;
			minMultiplier = 1;
			maxMultiplier = 1;				
		}
	}

	var target = ~~(original / divideBy);

	return {
		original: original,
		target: target,
		min: ~~(target * minMultiplier),
		max: ~~(target * maxMultiplier),
		divideBy: divideBy,
	};
}


/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
	var id = 0;
	for (var i = 0; i < file.ffProbeData.streams.length; i++) {
		if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
			method(file.ffProbeData.streams[i], id);
			id++;
		}
	}
}

/**
 * Attempts to ensure that video streams are h265 encoded and inside an
 * MKV container. Will use NVidia NVENC encoding as configured in the inputs.
 */
function buildVideoConfiguration(inputs, file, logger) {
	var configuration = new Configurator(["-map 0", "-map -0:d", "-c:v copy"]);
	loopOverStreamsOfType(file, "video", function(stream, id) {
		if (stream.codec_name === "mjpeg") {
			configuration.AddOutputSetting(`-map -v:${id}`);
			return;
		}

		if (stream.codec_name === "hevc" && file.container === "mkv") {
			logger.AddSuccess("File is in HEVC codec and in MKV");
			return;
		}


		// Check if should Remux.
		if (stream.codec_name === "hevc" && file.container !== "mkv") {
			configuration.AddOutputSetting("-c:v copy");
			logger.AddError("File is in HEVC codec but not MKV. Will remux");
		}

		// Check if should Transcode.
		if (stream.codec_name !== "hevc") {

			var bitrate = calculateBitrate(inputs, file);
			var set_quality = 22;
			var bitrateSettings = `-rc:v cbr -b:v ${bitrate.target}k -minrate ${bitrate.min}k -maxrate ${bitrate.max}k -bufsize ${bitrate.original}k`;
			
			if (
				inputs.minimum_target_bitrate !== "" &&
				bitrate.target < inputs.minimum_target_bitrate
			) {
				logger.AddError(
					`Skipping video encoding as target bitrate (${bitrate.target}) too low`
				);
				return;
			}

			if (inputs.by_quality === "true") {
				if (!isNaN(inputs.set_quality)) {
					set_quality = parseInt(inputs.set_quality);
				}
				
				var set_upperbound = set_quality + 2;
				var set_lowerbound = set_quality;
				
				bitrateSettings = `-rc:v vbr -cq ${set_quality} -qmax ${set_upperbound} -qmin ${set_lowerbound}`;
			} 
			
			
			// Just verify that they've entered a valid preset, and use the default if nothing entered or something invalid was put in
			var use_preset = "medium";
			if (inputs.set_preset){
				var presets = ["slow","medium","fast","hp","hq","bd","ll","llhq","llhp","lossless","losslesshp","p1","p2","p3","p4","p5","p6","p7","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"];
				var preset = inputs.set_preset.toLowerCase();
				if (presets.indexOf(preset) !== -1){
					var use_preset = preset;
					logger.AddError(`Using HEVC_Nvenc preset: ${preset}`);
				} else {
					logger.AddError(`Invalid preset name entered`);
				}
			}
					
				

			/**
			 * NVENC Configuration
			 */
			configuration.RemoveOutputSetting("-c:v copy");
			configuration.AddOutputSetting(
				`-c:v hevc_nvenc -load_plugin hevc_hw ${bitrateSettings} -preset ${use_preset} -spatial_aq:v 1 -aq-strength 10 -rc-lookahead 50`
			);

			if (file.video_codec_name === "h263") {
				configuration.AddInputSetting("-c:v h263_cuvid");
			} else if (file.video_codec_name === "h264") {
				if (file.ffProbeData.streams[0].profile !== "High 10") {
					configuration.AddInputSetting("-c:v h264_cuvid");
				} else if (file.video_codec_name === "mjpeg") {
					configuration.AddInputSetting("c:v mjpeg_cuvid");
				} else if (file.video_codec_name == "mpeg1") {
					configuration.AddInputSetting("-c:v mpeg1_cuvid");
				} else if (file.video_codec_name == "mpeg2") {
					configuration.AddInputSetting("-c:v mpeg2_cuvid");
				} else if (file.video_codec_name == "vc1") {
					configuration.AddInputSetting("-c:v vc1_cuvid");
				} else if (file.video_codec_name == "vp8") {
					configuration.AddInputSetting("-c:v vp8_cuvid");
				} else if (file.video_codec_name == "vp9") {
					configuration.AddInputSetting("-c:v vp9_cuvid");
				}
			}
			curr_height = file.ffProbeData.streams[0].height;
			curr_width = file.ffProbeData.streams[0].width;
			dest_height = inputs.wanted_height;
			if (dest_height){
				if (isNaN(dest_height) || !dest_height > 0){
					dest_height = 0;
				}
			}

			logger.AddError(`Original Resolution: (${curr_width}px x ${curr_height}px)`);
			if ((curr_height > dest_height && dest_height) || (inputs.enable_upscale === "true" && dest_height)) {
				configuration.AddOutputSetting(`-vf scale=-2:${dest_height}`);
				logger.AddError(`Setting Scaling to ${dest_height}px of height, keeping aspect`);
			} else if (curr_height <= dest_height && dest_height) {
				logger.AddError(`Source Resolution doesn't exceed ${dest_height}px of height, keeping original`);
			}
			
			logger.AddError("Transcoding to HEVC using NVidia NVENC");
		}

		if (inputs.by_quality === "true") {
			logger.Add(
				`Encoder configuration:\n• Requested Quality: ${set_quality}\n• Upper Quality: ${set_upperbound}\n• Minimum Quality: ${set_lowerbound}\n`
			);
		} else {
			logger.Add(
				`Encoder configuration:\n• Original Bitrate: ${bitrate.original}\n• Target Bitrate: ${bitrate.target} (DivideBy: ${bitrate.divideBy})\n• Minimum Bitrate: ${bitrate.min}\n• Maximum Bitrate: ${bitrate.max}\n`
			);
		}
	});




	if (!configuration.shouldProcess) {
		logger.AddSuccess("No video processing necessary");
	}

	return configuration;
}

//#endregion

function plugin(file, _librarySettings, inputs) {
	var response = {
		container: ".mkv",
		FFmpegMode: true,
		handBrakeMode: false,
		infoLog: "",
		processFile: false,
		preset: "",
		reQueueAfter: false,
	};

	var logger = new Log();
	
	var audioSettings = new Configurator(["-c:a copy"]);
	var subtitleSettings = new Configurator(["-c:s copy"]);
	var videoSettings = buildVideoConfiguration(inputs, file, logger);

	response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()} ${audioSettings.GetOutputSettings()} ${subtitleSettings.GetOutputSettings()} -max_muxing_queue_size 4096 -metadata title= -metadata comment=`;
	response.processFile =
		audioSettings.shouldProcess ||
		videoSettings.shouldProcess ||
		subtitleSettings.shouldProcess;

	if (!response.processFile) {
		logger.AddSuccess("No need to process file");
	}

	response.infoLog += logger.GetLogData();
	return response;
}

module.exports.plugin = plugin;