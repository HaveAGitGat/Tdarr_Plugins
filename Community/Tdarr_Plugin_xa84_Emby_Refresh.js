/* eslint-disable */
const details = () => ({
  id: 'Tdarr_Plugin_xa84_Emby_Refresh.js',
  Stage: 'Post-processing',
  Name: 'Emby Refresh',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Notifies Emby about file changes and refreshes the matching library item.',
  Version: '2.2',
  Tags: 'post-processing',
  Inputs: [
    {
      name: 'Url_Protocol',
      type: 'string',
      defaultValue: 'http',
      inputUI: { type: 'dropdown', options: ['http', 'https'] },
      tooltip: 'Protocol to use when connecting to Emby. \\nExample:\\n http',
    },
    {
      name: 'Emby_Url',
      type: 'string',
      defaultValue: 'localhost',
      inputUI: { type: 'text' },
      tooltip: 'IP address or hostname of the Emby server. \\nExample:\\n 192.168.0.10',
    },
    {
      name: 'Emby_Port',
      type: 'number',
      defaultValue: 8096,
      inputUI: { type: 'text' },
      tooltip: 'Port used to access Emby. \\nExample:\\n 8096',
    },
    {
      name: 'Emby_Api_Key',
      type: 'string',
      defaultValue: '',
      inputUI: { type: 'text' },
      tooltip: 'API key from Emby Dashboard -> Advanced -> API Keys. \\nExample:\\n a1b2c3d4e5f6a7b8c9d0',
    },
    {
      name: 'Emby_Path',
      type: 'string',
      defaultValue: '',
      inputUI: { type: 'text' },
      tooltip: 'The Emby-side path prefix if it differs from the TDarr path. Leave empty if paths are identical. \\nExample:\\n /data/',
    },
    {
      name: 'Tdarr_Path',
      type: 'string',
      defaultValue: '',
      inputUI: { type: 'text' },
      tooltip: 'The TDarr-side path prefix to replace with the Emby path. Leave empty if paths are identical. \\nExample:\\n /media/local/',
    },
  ],
});

const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const http = require('http');
  const https = require('https');

  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
    processFile: false,
    infoLog: '',
  };

  const type = inputs.Url_Protocol || 'http';
  const url = inputs.Emby_Url || 'localhost';
  const port = inputs.Emby_Port || 8096;
  const apiKey = inputs.Emby_Api_Key;
  const embyPath = inputs.Emby_Path || '';
  const tdarrPath = inputs.Tdarr_Path || '';

  if (!apiKey) {
    response.infoLog += '✗ No API Key configured.\n';
    return response;
  }

  let filePath = file.file.replace(/\\/g, '/');
  filePath = filePath.substring(0, filePath.lastIndexOf('/'));

  if (tdarrPath && embyPath) {
    filePath = filePath.replace(tdarrPath, embyPath);
  }

  const portSuffix = port ? `:${port}` : '';
  const baseUrl = `${type}://${url}${portSuffix}`;
  const httpModule = (type === 'https') ? https : http;

  response.infoLog += `Emby refresh for: ${filePath}\n`;

  // --- Helper: send HTTP request and return { statusCode, body } ---
  const sendReq = (reqUrl, method, body) => {
    return new Promise((resolve) => {
      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Token': apiKey,
        },
        timeout: 30000,
      };
      if (type === 'https') opts.rejectUnauthorized = false;

      const req = httpModule.request(reqUrl, opts, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      });
      req.on('error', (e) => {
        resolve({ statusCode: 0, body: e.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ statusCode: 0, body: 'Request timed out' });
      });
      if (body) req.write(body);
      req.end();
    });
  };

  // --- Step 1: Notify Emby about the changed path ---
  const upUrl = `${baseUrl}/emby/Library/Media/Updated?api_key=${apiKey}`;
  const upBody = JSON.stringify({ Updates: [{ Path: filePath, UpdateType: 'Modified' }] });

  const upRes = await sendReq(upUrl, 'POST', upBody);
  if (upRes.statusCode >= 200 && upRes.statusCode < 300) {
    response.infoLog += `☑ Media/Updated accepted (${upRes.statusCode})\n`;
  } else {
    response.infoLog += `✗ Media/Updated failed (${upRes.statusCode}): ${upRes.body}\n`;
    return response;
  }

  // --- Step 2: Look up the Emby item by path ---
  const searchUrl = `${baseUrl}/emby/Items?Path=${encodeURIComponent(filePath)}&Recursive=true&api_key=${apiKey}`;
  const sRes = await sendReq(searchUrl, 'GET', null);

  if (sRes.statusCode !== 200) {
    response.infoLog += `✗ Item search failed (${sRes.statusCode})\n`;
    return response;
  }

  let items = [];
  try {
    const parsed = JSON.parse(sRes.body);
    items = parsed.Items || [];
  } catch (e) {
    response.infoLog += `✗ Could not parse search response\n`;
    return response;
  }

  if (items.length === 0) {
    response.infoLog += `⚠ No matching item found in Emby for this path\n`;
    return response;
  }

  const target = items[0];
  response.infoLog += `☑ Found: "${target.Name}" (${target.Type}, ID: ${target.Id})\n`;

  // --- Step 3: Refresh that specific item ---
  const rUrl = `${baseUrl}/emby/Items/${target.Id}/Refresh`
    + `?Recursive=true&MetadataRefreshMode=FullRefresh&ImageRefreshMode=Default`
    + `&api_key=${apiKey}`;

  const rRes = await sendReq(rUrl, 'POST', null);
  if (rRes.statusCode >= 200 && rRes.statusCode < 300) {
    response.infoLog += `☑ Item refresh triggered (${rRes.statusCode})\n`;
  } else {
    response.infoLog += `✗ Item refresh failed (${rRes.statusCode}): ${rRes.body}\n`;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
