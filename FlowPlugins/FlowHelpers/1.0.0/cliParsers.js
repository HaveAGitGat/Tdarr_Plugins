"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editreadyParser = exports.getFpsFromSpeed = exports.getHandBrakeFps = exports.getFFmpegVar = exports.getFFmpegPercentage = exports.ffmpegParser = exports.handbrakeParser = void 0;
var handbrakeParser = function (_a) {
    var str = _a.str, hbPass = _a.hbPass;
    if (typeof str !== 'string') {
        return 0;
    }
    var percentage = 0;
    var numbers = '0123456789';
    var n = str.indexOf('%');
    if (str.length >= 6
        && str.indexOf('%') >= 6
        && numbers.includes(str.charAt(n - 5))) {
        var output = str.substring(n - 6, n + 1);
        var outputArr = output.split('');
        outputArr.splice(outputArr.length - 1, 1);
        output = outputArr.join('');
        var outputNum = Number(output);
        if (outputNum > 0) {
            percentage = outputNum;
            if (hbPass === 1) {
                percentage /= 2;
            }
            else if (hbPass === 2) {
                percentage = 50 + (percentage / 2);
            }
        }
    }
    return percentage;
};
exports.handbrakeParser = handbrakeParser;
var getHandBrakeFps = function (_a) {
    var str = _a.str;
    try {
        if (typeof str !== 'string' || !(str.includes('(') && str.includes('fps'))) {
            return 0;
        }
        var out = parseInt(str.split('(')[1].split('fps')[0].trim(), 10);
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(out)) {
            return out;
        }
    }
    catch (err) {
        // err
    }
    return 0;
};
exports.getHandBrakeFps = getHandBrakeFps;
// frame=  889 fps=106 q=26.0 Lsize=   25526kB time=00:00:35.69 bitrate=5858.3kbits/s speed=4.25x
var getFFmpegVar = function (_a) {
    var str = _a.str, variable = _a.variable;
    if (typeof str !== 'string') {
        return '';
    }
    var idx = str.indexOf(variable);
    var out = '';
    var initSpacesEnded = false;
    if (idx >= 0) {
        var startIdx = idx + variable.length + 1;
        for (var i = startIdx; i < str.length; i += 1) {
            if (initSpacesEnded === true && str[i] === ' ') {
                break;
            }
            else if (initSpacesEnded === false && str[i] !== ' ') {
                initSpacesEnded = true;
            }
            if (initSpacesEnded === true && str[i] !== ' ') {
                out += str[i];
            }
        }
    }
    return out;
};
exports.getFFmpegVar = getFFmpegVar;
var getFFmpegPercentage = function (_a) {
    var time = _a.time, f = _a.f, fc = _a.fc, vf = _a.vf, d = _a.d;
    var frameCount01 = fc;
    var VideoFrameRate = vf;
    var Duration = d;
    var perc = 0;
    var frame = parseInt(f, 10);
    frameCount01 = Math.ceil(frameCount01);
    VideoFrameRate = Math.ceil(VideoFrameRate);
    Duration = Math.ceil(Duration);
    if (frame > 0) {
        if (frameCount01 > 0) {
            perc = ((frame / frameCount01) * 100);
        }
        else if (VideoFrameRate > 0 && Duration > 0) {
            perc = ((frame / (VideoFrameRate * Duration)) * 100);
        }
        else {
            perc = (frame);
        }
    }
    // Switch to time-based progress when frame-based exceeds 100
    // (e.g. filters like yadif=1 or nnedi that double the frame count) (#452),
    // is unavailable, or is significantly below time-based (nb_frames from
    // r_frame_rate doesn't match actual encoding fps) (#1236)
    if (time > 0 && Duration > 0) {
        var timePerc = ((time / Duration) * 100);
        if (perc > 100 || perc === 0
            || (timePerc <= 100 && perc < timePerc * 0.75)) {
            perc = timePerc;
        }
    }
    var percString = perc.toFixed(2);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(perc)) {
        return 0.00;
    }
    return parseFloat(percString);
};
exports.getFFmpegPercentage = getFFmpegPercentage;
var ffmpegParser = function (_a) {
    var str = _a.str, frameCount = _a.frameCount, videoFrameRate = _a.videoFrameRate, ffprobeDuration = _a.ffprobeDuration, metaDuration = _a.metaDuration;
    if (typeof str !== 'string') {
        return 0;
    }
    var percentage = 0;
    if (str.length >= 6) {
        var frame = getFFmpegVar({
            str: str,
            variable: 'frame',
        });
        var time = 0;
        // get time
        var timeStr = getFFmpegVar({
            str: str,
            variable: 'time',
        });
        if (timeStr) {
            var timeArr = timeStr.split(':');
            if (timeArr.length === 3) {
                var hours = parseInt(timeArr[0], 10);
                var minutes = parseInt(timeArr[1], 10);
                var seconds = parseInt(timeArr[2], 10);
                time = (hours * 3600) + (minutes * 60) + seconds;
            }
        }
        var frameRate = videoFrameRate || 0;
        var duration = 0;
        if (ffprobeDuration
            && parseFloat(ffprobeDuration) > 0) {
            duration = parseFloat(ffprobeDuration);
        }
        else if (metaDuration) {
            duration = metaDuration;
        }
        var per = getFFmpegPercentage({
            time: time,
            f: frame,
            fc: frameCount,
            vf: frameRate,
            d: duration,
        });
        var outputNum = Number(per);
        if (outputNum > 0) {
            percentage = outputNum;
        }
    }
    return percentage;
};
exports.ffmpegParser = ffmpegParser;
var editreadyParser = function (_a) {
    var str = _a.str;
    if (typeof str !== 'string') {
        return 0;
    }
    var percentage = 0;
    // const ex = 'STATUS: {"progress": "0.0000000"}';
    if (str.includes('STATUS:')) {
        var parts = str.split('STATUS:');
        if (parts[1]) {
            try {
                var json = JSON.parse(parts[1]);
                var progress = parseFloat(json.progress);
                var percStr = (progress * 100).toFixed(2);
                percentage = parseFloat(percStr);
            }
            catch (err) {
                // err
            }
        }
    }
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(percentage)) {
        return 0.00;
    }
    return percentage;
};
exports.editreadyParser = editreadyParser;
// When FFmpeg 7 omits fps= for non-encoding tasks (remux, stream copy, etc.),
// compute an effective FPS from speed= and the source video frame rate.
// e.g. speed=931x with 23.976fps source => ~22321 effective fps
var getFpsFromSpeed = function (_a) {
    var str = _a.str, videoFrameRate = _a.videoFrameRate;
    if (!videoFrameRate || videoFrameRate <= 0) {
        return 0;
    }
    var speedStr = getFFmpegVar({
        str: str,
        variable: 'speed',
    });
    if (!speedStr) {
        return 0;
    }
    // Remove trailing 'x' from speed value (e.g. "931x" -> "931", "1.46e+03x" -> "1.46e+03")
    speedStr = speedStr.replace(/x$/i, '');
    var speed = parseFloat(speedStr);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(speed) || speed <= 0) {
        return 0;
    }
    return Math.round(speed * videoFrameRate);
};
exports.getFpsFromSpeed = getFpsFromSpeed;
