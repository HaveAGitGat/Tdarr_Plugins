"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;

var details = function () {
  return {
    name: 'Send Webhook Notification',
    description: 'Sends a Discord webhook notification with file information at the start or end of processing.',
    style: {
      borderColor: '#5865F2',
    },
    tags: 'action,notification,3rd party',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faBell',
    inputs: [
      {
        label: 'Webhook URL',
        name: 'webhookUrl',
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Discord Webhook URL for notifications',
      },
      {
        label: 'Notification Type',
        name: 'notificationType',
        type: 'string',
        defaultValue: 'start',
        inputUI: {
          type: 'dropdown',
          options: [
            'start',
            'complete',
          ],
        },
        tooltip: 'Send notification at start or completion of transcoding',
      },
      {
        label: 'Language',
        name: 'language',
        type: 'string',
        defaultValue: 'english',
        inputUI: {
          type: 'dropdown',
          options: [
            'english',
            'german',
            'emoji',
          ],
        },
        tooltip: 'Language for notification text',
      },
      {
        label: 'Bot Username',
        name: 'username',
        type: 'string',
        defaultValue: 'Transcode',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Display name for the webhook bot',
      },
      {
        label: 'Embed Color',
        name: 'embedColor',
        type: 'string',
        defaultValue: 'blue',
        inputUI: {
          type: 'dropdown',
          options: [
            'blue',
            'green',
            'yellow',
            'orange',
            'red',
            'purple',
          ],
        },
        tooltip: 'Color of the Discord embed',
      },
    ],
    outputs: [
      {
        number: 1,
        tooltip: 'Continue to next action',
      },
    ],
  };
};
exports.details = details;

var plugin = function (args) {
  var lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  var webhookUrl = String(args.inputs.webhookUrl || '').trim();
  var notificationType = String(args.inputs.notificationType || 'start');
  var language = String(args.inputs.language || 'english');
  var username = String(args.inputs.username || 'Transcode');
  var embedColor = String(args.inputs.embedColor || 'blue');

  // Color mapping
  var colorMap = {
    blue: 255,
    green: 65280,
    yellow: 16776960,
    orange: 16753920,
    red: 16711680,
    purple: 10181046,
  };

  // Language translations
  var translations = {
    english: {
      titleStart: '🎬 Processing Started',
      titleComplete: '✅ Processing Completed',
      file: 'File',
      path: '📁 Path',
      resolution: '🖥️ Resolution',
      aspectRatio: '📐 Aspect Ratio',
      videoCodec: '📹 Video Codec',
      duration: '⏱️ Duration',
      framerate: '🎞️ Framerate',
      audio: '🎧 Audio',
      fileSize: '💾 File Size',
      fileSizeBefore: '💾 Size Before',
      fileSizeAfter: '💾 Size After',
      reduction: '📉 Reduction',
      bitrate: '🎚️ Bitrate',
      footerStart: 'Transcoding started in Tdarr',
      footerComplete: 'Transcoding completed in Tdarr',
      audioTrack: 'Audio',
      channels: 'channels',
      noAudio: 'No audio data found',
      unknown: 'Unknown',
      noReduction: 'No reduction',
      notCalculated: 'Not calculated',
    },
    german: {
      titleStart: '🎬 Verarbeitung gestartet',
      titleComplete: '✅ Verarbeitung abgeschlossen',
      file: 'Datei',
      path: '📁 Pfad',
      resolution: '🖥️ Auflösung',
      aspectRatio: '📐 Seitenverhältnis',
      videoCodec: '📹 Video-Codec',
      duration: '⏱️ Dauer',
      framerate: '🎞️ Framerate',
      audio: '🎧 Audio',
      fileSize: '💾 Dateigröße',
      fileSizeBefore: '💾 Größe vorher',
      fileSizeAfter: '💾 Größe nachher',
      reduction: '📉 Reduktion',
      bitrate: '🎚️ Bitrate',
      footerStart: 'Transcoding gestartet in Tdarr',
      footerComplete: 'Transcoding abgeschlossen in Tdarr',
      audioTrack: 'Audio',
      channels: 'Kanäle',
      noAudio: 'Keine Audiodaten gefunden',
      unknown: 'Unbekannt',
      noReduction: 'Keine Reduktion',
      notCalculated: 'Nicht berechnet',
    },
    emoji: {
      titleStart: '🎬 ▶️',
      titleComplete: '✅ 🏁',
      file: '📄',
      path: '📁',
      resolution: '🖥️',
      aspectRatio: '📐',
      videoCodec: '📹',
      duration: '⏱️',
      framerate: '🎞️',
      audio: '🎧',
      fileSize: '💾',
      fileSizeBefore: '💾 ⬅️',
      fileSizeAfter: '💾 ➡️',
      reduction: '📉',
      bitrate: '🎚️',
      footerStart: '🚀 Tdarr',
      footerComplete: '🎉 Tdarr',
      audioTrack: '🔊',
      channels: 'ch',
      noAudio: '❌ 🎧',
      unknown: '❓',
      noReduction: '➡️',
      notCalculated: '❓',
    },
  };

  var t = translations[language] || translations.english;

  if (!webhookUrl) {
    args.jobLog('[Webhook] No URL configured - skipping notification');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  var file = args.inputFileObj;
  var streams = file.ffProbeData && file.ffProbeData.streams ? file.ffProbeData.streams : [];
  
  // Find video stream
  var video = streams.find(function (s) { return s.codec_type === 'video'; }) || {};
  
  // Find audio streams
  var audioStreams = streams.filter(function (s) { return s.codec_type === 'audio'; });
  
  var audioDetails = '';
  if (audioStreams.length > 0) {
    if (language === 'emoji') {
      // Ultra compact: just codec and channels
      audioDetails = audioStreams.map(function (s, i) {
        var codec = s.codec_name || '?';
        var ch = s.channels || '?';
        return codec + ' ' + ch + 'ch';
      }).join(' • ');
    } else {
      audioDetails = audioStreams.map(function (s, i) {
        var codec = s.codec_name || t.unknown;
        var ch = s.channels || '?';
        return t.audioTrack + ' ' + (i + 1) + ': ' + codec + ' - ' + ch + ' ' + t.channels;
      }).join('\n');
    }
  } else {
    audioDetails = t.noAudio;
  }

  var resolution = (video.coded_width || '?') + 'x' + (video.coded_height || '?');
  var aspectRatio = video.display_aspect_ratio || t.unknown;
  var codec = video.codec_long_name || video.codec_name || t.unknown;

  // Calculate duration
  var rawDuration = parseFloat(
    (file.ffProbeData && file.ffProbeData.format && file.ffProbeData.format.duration) || '0'
  );
  var readableDuration = t.unknown;
  if (!isNaN(rawDuration) && rawDuration > 0) {
    var date = new Date(rawDuration * 1000);
    var iso = date.toISOString();
    readableDuration = iso.substr(11, 8).replace(/^00:/, '').replace(/^0/, '');
  }

  // Format framerate
  function calcFrameRate(fps) {
    if (typeof fps === 'string' && fps.indexOf('/') > -1) {
      var parts = fps.split('/');
      var num = Number(parts[0]);
      var den = Number(parts[1]);
      if (num && den) {
        return (num / den).toFixed(2) + (language === 'emoji' ? '' : ' fps');
      }
    }
    return fps || t.unknown;
  }
  var framerate = calcFrameRate(video.r_frame_rate || video.avg_frame_rate);

  // Bitrate
  var rawBitrate = file.ffProbeData && file.ffProbeData.format && file.ffProbeData.format.bit_rate;
  var bitrateKbps = rawBitrate
    ? (parseInt(rawBitrate, 10) / 1000).toFixed(0) + (language === 'emoji' ? 'k' : ' kbps')
    : t.unknown;

  var fullPath = (file.meta && file.meta.SourceFile) || file.file || t.unknown;
  var fileName = file.fileNameWithoutExtension + '.' + file.container;

  var fields = [];
  var title = '';
  var footer = '';
  var color = colorMap[embedColor] || 255;

  // For emoji mode, combine multiple fields into single lines
  if (language === 'emoji' && notificationType === 'start') {
    // Start notification - emoji compact
    var sizeBytes = (file.statSync && file.statSync.size) || 0;
    var sizeMB = sizeBytes > 0 
      ? (sizeBytes / (1024 * 1024)).toFixed(1) + 'M'
      : '—';

    title = t.titleStart;
    footer = t.footerStart;
    color = colorMap[String(embedColor)] || 255;

    var compactPath = fullPath;
    if (fullPath !== t.unknown) {
      var pathParts = fullPath.split('/');
      if (pathParts.length > 3) {
        compactPath = '.../' + pathParts.slice(-2).join('/');
      }
    }

    fields = [
      { name: t.path, value: compactPath },
      { name: t.resolution + ' ' + t.aspectRatio + ' ' + t.videoCodec, 
        value: resolution + ' • ' + aspectRatio + ' • ' + codec },
      { name: t.duration + ' ' + t.framerate + ' ' + t.fileSize + ' ' + t.bitrate, 
        value: readableDuration + ' • ' + framerate + ' • ' + sizeMB + ' • ' + bitrateKbps },
      { name: t.audio, value: audioDetails },
    ];
  } else if (language === 'emoji' && notificationType === 'complete') {
    // Complete notification - emoji compact
    var oldSizeBytes = args.originalLibraryFile && args.originalLibraryFile.statSync 
      ? args.originalLibraryFile.statSync.size : 0;
    var newSizeBytes = file.statSync && file.statSync.size ? file.statSync.size : 0;

    var oldSizeMB = (oldSizeBytes / 1024 / 1024).toFixed(1) + 'M';
    var newSizeMB = (newSizeBytes / 1024 / 1024).toFixed(1) + 'M';

    var ratio = oldSizeBytes > 0 ? newSizeBytes / oldSizeBytes : 0;
    var reduction = oldSizeBytes > 0
      ? (newSizeBytes === oldSizeBytes
          ? t.noReduction
          : '-' + (100 - (ratio * 100)).toFixed(1) + '%')
      : t.notCalculated;

    title = t.titleComplete;
    footer = t.footerComplete;
    color = 65280;

    var compactPath = fullPath;
    if (fullPath !== t.unknown) {
      var pathParts = fullPath.split('/');
      if (pathParts.length > 3) {
        compactPath = '.../' + pathParts.slice(-2).join('/');
      }
    }

    fields = [
      { name: t.path, value: compactPath },
      { name: t.resolution + ' ' + t.aspectRatio + ' ' + t.videoCodec, 
        value: resolution + ' • ' + aspectRatio + ' • ' + codec },
      { name: t.duration + ' ' + t.framerate + ' ' + t.bitrate, 
        value: readableDuration + ' • ' + framerate + ' • ' + bitrateKbps },
      { name: t.fileSizeBefore + ' → ' + t.fileSizeAfter + ' ' + t.reduction, 
        value: oldSizeMB + ' → ' + newSizeMB + ' (' + reduction + ')' },
      { name: t.audio, value: audioDetails },
    ];
  } else if (notificationType === 'start') {
    // Start notification - full text
    var sizeBytes = (file.statSync && file.statSync.size) || 0;
    var sizeMB = sizeBytes > 0 
      ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : '—';

    title = t.titleStart;
    footer = t.footerStart;
    color = colorMap[String(embedColor)] || 255;

    fields = [
      { name: t.path, value: fullPath },
      { name: t.resolution, value: resolution, inline: true },
      { name: t.aspectRatio, value: aspectRatio, inline: true },
      { name: t.videoCodec, value: codec, inline: true },
      { name: t.duration, value: readableDuration, inline: true },
      { name: t.framerate, value: framerate, inline: true },
      { name: t.audio, value: audioDetails },
      { name: t.fileSize, value: sizeMB, inline: true },
      { name: t.bitrate, value: bitrateKbps, inline: true },
    ];
  } else {
    // Complete notification - full text
    var oldSizeBytes = args.originalLibraryFile && args.originalLibraryFile.statSync 
      ? args.originalLibraryFile.statSync.size : 0;
    var newSizeBytes = file.statSync && file.statSync.size ? file.statSync.size : 0;

    var oldSizeMB = (oldSizeBytes / 1024 / 1024).toFixed(1) + ' MB';
    var newSizeMB = (newSizeBytes / 1024 / 1024).toFixed(1) + ' MB';

    var ratio = oldSizeBytes > 0 ? newSizeBytes / oldSizeBytes : 0;
    var reduction = oldSizeBytes > 0
      ? (newSizeBytes === oldSizeBytes
          ? t.noReduction
          : (100 - (ratio * 100)).toFixed(1) + '%')
      : t.notCalculated;

    title = t.titleComplete;
    footer = t.footerComplete;
    color = 65280; // Green for completion

    fields = [
      { name: t.path, value: fullPath },
      { name: t.resolution, value: resolution, inline: true },
      { name: t.aspectRatio, value: aspectRatio, inline: true },
      { name: t.videoCodec, value: codec, inline: true },
      { name: t.duration, value: readableDuration, inline: true },
      { name: t.framerate, value: framerate, inline: true },
      { name: t.audio, value: audioDetails },
      { name: t.fileSizeBefore, value: oldSizeMB, inline: true },
      { name: t.fileSizeAfter, value: newSizeMB, inline: true },
      { name: t.reduction, value: reduction, inline: true },
      { name: t.bitrate, value: bitrateKbps, inline: true },
    ];
  }

  // Compact mode for emoji language
  var description = '**' + t.file + ':** ' + fileName;
  if (language === 'emoji') {
    description = fileName;
  }

  var payload = {
    username: username,
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        fields: fields,
        footer: {
          text: footer,
          icon_url: 'https://i.ibb.co/vxb05Hzc/logo.png',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Send webhook
  var https = require('https');
  var http = require('http');
  var url = require('url');

  var parsedUrl = url.parse(webhookUrl);
  var protocol = parsedUrl.protocol === 'https:' ? https : http;
  var body = JSON.stringify(payload);

  var options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  var req = protocol.request(options, function (res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      args.jobLog('[Webhook] Notification sent successfully: ' + fileName);
    } else {
      args.jobLog('[Webhook] Error sending notification (Status ' + res.statusCode + ')');
    }
  });

  req.on('error', function (err) {
    args.jobLog('[Webhook] Network error: ' + err.message);
  });

  req.write(body);
  req.end();

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
exports.plugin = plugin;
