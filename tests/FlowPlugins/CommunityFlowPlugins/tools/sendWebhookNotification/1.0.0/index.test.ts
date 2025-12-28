/* eslint-disable import/prefer-default-export */
/* eslint-disable no-param-reassign */
import { IpluginDetails, IpluginInputArgs, IpluginOutputArgs } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
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
});

interface ColorMap {
  [key: string]: number;
}

interface Translation {
  titleStart: string;
  titleComplete: string;
  file: string;
  path: string;
  resolution: string;
  aspectRatio: string;
  videoCodec: string;
  duration: string;
  framerate: string;
  audio: string;
  fileSize: string;
  fileSizeBefore: string;
  fileSizeAfter: string;
  reduction: string;
  bitrate: string;
  footerStart: string;
  footerComplete: string;
  audioTrack: string;
  channels: string;
  noAudio: string;
  unknown: string;
  noReduction: string;
  notCalculated: string;
}

interface Translations {
  [key: string]: Translation;
}

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const webhookUrl = String(args.inputs.webhookUrl || '').trim();
  const notificationType = String(args.inputs.notificationType || 'start');
  const language = String(args.inputs.language || 'english');
  const username = String(args.inputs.username || 'Transcode');
  const embedColor = String(args.inputs.embedColor || 'blue');

  // Color mapping
  const colorMap: ColorMap = {
    blue: 255,
    green: 65280,
    yellow: 16776960,
    orange: 16753920,
    red: 16711680,
    purple: 10181046,
  };

  // Language translations
  const translations: Translations = {
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

  const t = translations[language] || translations.english;

  if (!webhookUrl) {
    args.jobLog('[Webhook] No URL configured - skipping notification');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  const streams = args.inputFileObj.ffProbeData && args.inputFileObj.ffProbeData.streams 
    ? args.inputFileObj.ffProbeData.streams 
    : [];

  // Find video stream
  let video: any = {};
  for (let i = 0; i < streams.length; i += 1) {
    if (streams[i].codec_type === 'video') {
      video = streams[i];
      break;
    }
  }

  // Find audio streams
  const audioStreams = [];
  for (let i = 0; i < streams.length; i += 1) {
    if (streams[i].codec_type === 'audio') {
      audioStreams.push(streams[i]);
    }
  }

  let audioDetails = '';
  if (audioStreams.length > 0) {
    if (language === 'emoji') {
      // Ultra compact: just codec and channels
      const parts = [];
      for (let i = 0; i < audioStreams.length; i += 1) {
        const s = audioStreams[i];
        const codec = s.codec_name || '?';
        const ch = s.channels || '?';
        parts.push(`${codec} ${ch}ch`);
      }
      audioDetails = parts.join(' • ');
    } else {
      const parts = [];
      for (let i = 0; i < audioStreams.length; i += 1) {
        const s = audioStreams[i];
        const codec = s.codec_name || t.unknown;
        const ch = s.channels || '?';
        parts.push(`${t.audioTrack} ${i + 1}: ${codec} - ${ch} ${t.channels}`);
      }
      audioDetails = parts.join('\n');
    }
  } else {
    audioDetails = t.noAudio;
  }

  const resolution = `${video.coded_width || '?'}x${video.coded_height || '?'}`;
  const aspectRatio = video.display_aspect_ratio || t.unknown;
  const codec = video.codec_long_name || video.codec_name || t.unknown;

  // Calculate duration
  const rawDuration = parseFloat(
    (args.inputFileObj.ffProbeData && args.inputFileObj.ffProbeData.format 
      && args.inputFileObj.ffProbeData.format.duration) || '0',
  );
  let readableDuration = t.unknown;
  if (!isNaN(rawDuration) && rawDuration > 0) {
    const date = new Date(rawDuration * 1000);
    const iso = date.toISOString();
    readableDuration = iso.substr(11, 8).replace(/^00:/, '').replace(/^0/, '');
  }

  // Format framerate
  const calcFrameRate = (fps: string | number): string => {
    if (typeof fps === 'string' && fps.indexOf('/') > -1) {
      const parts = fps.split('/');
      const num = Number(parts[0]);
      const den = Number(parts[1]);
      if (num && den) {
        return `${(num / den).toFixed(2)}${language === 'emoji' ? '' : ' fps'}`;
      }
    }
    return String(fps || t.unknown);
  };
  const framerate = calcFrameRate(video.r_frame_rate || video.avg_frame_rate || t.unknown);

  // Bitrate
  const rawBitrate = args.inputFileObj.ffProbeData 
    && args.inputFileObj.ffProbeData.format 
    && args.inputFileObj.ffProbeData.format.bit_rate;
  const bitrateKbps = rawBitrate
    ? `${(parseInt(String(rawBitrate), 10) / 1000).toFixed(0)}${language === 'emoji' ? 'k' : ' kbps'}`
    : t.unknown;

  const fullPath = (args.inputFileObj.meta && args.inputFileObj.meta.SourceFile) 
    || args.inputFileObj.file 
    || t.unknown;
  const fileName = `${args.inputFileObj.file_name}.${args.inputFileObj.container}`;

  let fields: DiscordField[] = [];
  let title = '';
  let footer = '';
  let color = colorMap[String(embedColor)] || 255;

  // For emoji mode, combine multiple fields into single lines
  if (language === 'emoji' && notificationType === 'start') {
    // Start notification - emoji compact
    const sizeBytes = args.inputFileObj.file_size || 0;
    const sizeMB = sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)}M` : '—';

    title = t.titleStart;
    footer = t.footerStart;
    color = colorMap[String(embedColor)] || 255;

    let compactPath = fullPath;
    if (fullPath !== t.unknown) {
      const pathParts = fullPath.split('/');
      if (pathParts.length > 3) {
        compactPath = `.../${pathParts.slice(-2).join('/')}`;
      }
    }

    fields = [
      { name: t.path, value: compactPath },
      {
        name: `${t.resolution} ${t.aspectRatio} ${t.videoCodec}`,
        value: `${resolution} • ${aspectRatio} • ${codec}`,
      },
      {
        name: `${t.duration} ${t.framerate} ${t.fileSize} ${t.bitrate}`,
        value: `${readableDuration} • ${framerate} • ${sizeMB} • ${bitrateKbps}`,
      },
      { name: t.audio, value: audioDetails },
    ];
  } else if (language === 'emoji' && notificationType === 'complete') {
    // Complete notification - emoji compact
    const oldSizeBytes = (args.originalLibraryFile && args.originalLibraryFile.file_size) || 0;
    const newSizeBytes = args.inputFileObj.file_size || 0;

    const oldSizeMB = `${(oldSizeBytes / 1024 / 1024).toFixed(1)}M`;
    const newSizeMB = `${(newSizeBytes / 1024 / 1024).toFixed(1)}M`;

    const ratio = oldSizeBytes > 0 ? newSizeBytes / oldSizeBytes : 0;
    const reduction = oldSizeBytes > 0
      ? (newSizeBytes === oldSizeBytes
        ? t.noReduction
        : `-${(100 - ratio * 100).toFixed(1)}%`)
      : t.notCalculated;

    title = t.titleComplete;
    footer = t.footerComplete;
    color = 65280;

    let compactPath = fullPath;
    if (fullPath !== t.unknown) {
      const pathParts = fullPath.split('/');
      if (pathParts.length > 3) {
        compactPath = `.../${pathParts.slice(-2).join('/')}`;
      }
    }

    fields = [
      { name: t.path, value: compactPath },
      {
        name: `${t.resolution} ${t.aspectRatio} ${t.videoCodec}`,
        value: `${resolution} • ${aspectRatio} • ${codec}`,
      },
      {
        name: `${t.duration} ${t.framerate} ${t.bitrate}`,
        value: `${readableDuration} • ${framerate} • ${bitrateKbps}`,
      },
      {
        name: `${t.fileSizeBefore} → ${t.fileSizeAfter} ${t.reduction}`,
        value: `${oldSizeMB} → ${newSizeMB} (${reduction})`,
      },
      { name: t.audio, value: audioDetails },
    ];
  } else if (notificationType === 'start') {
    // Start notification - full text
    const sizeBytes = args.inputFileObj.file_size || 0;
    const sizeMB = sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—';

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
    const oldSizeBytes = (args.originalLibraryFile && args.originalLibraryFile.file_size) || 0;
    const newSizeBytes = args.inputFileObj.file_size || 0;

    const oldSizeMB = `${(oldSizeBytes / 1024 / 1024).toFixed(1)} MB`;
    const newSizeMB = `${(newSizeBytes / 1024 / 1024).toFixed(1)} MB`;

    const ratio = oldSizeBytes > 0 ? newSizeBytes / oldSizeBytes : 0;
    const reduction = oldSizeBytes > 0
      ? (newSizeBytes === oldSizeBytes
        ? t.noReduction
        : `${(100 - ratio * 100).toFixed(1)}%`)
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
  const description = language === 'emoji' ? fileName : `**${t.file}:** ${fileName}`;

  const payload = {
    username,
    embeds: [
      {
        title,
        description,
        color,
        fields,
        footer: {
          text: footer,
          icon_url: 'https://i.ibb.co/vxb05Hzc/logo.png',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Send webhook
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const https = require('https');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const http = require('http');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const url = require('url');

  const parsedUrl = url.parse(webhookUrl);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  const body = JSON.stringify(payload);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
    },
  };

  const req = protocol.request(options, (res: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      args.jobLog(`[Webhook] Notification sent successfully: ${fileName}`);
    } else {
      args.jobLog(`[Webhook] Error sending notification (Status ${res.statusCode})`);
    }
  });

  req.on('error', (err: Error) => {
    args.jobLog(`[Webhook] Network error: ${err.message}`);
  });

  req.write(body);
  req.end();

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export { details, plugin };
