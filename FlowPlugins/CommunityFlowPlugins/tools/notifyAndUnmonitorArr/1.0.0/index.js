"use strict";
/* AK_NotifyAndUnmonitorArr — HD/4K + dual Sonarr/Radarr, no file management
   - Refresh Sonarr/Radarr after transcode.
   - Optionally unmonitor the item.
   - Sonarr unmonitor: PUT /api/v3/episode/monitor?includeImages=false; on 404/405 fallback to PUT /api/v3/episode with full payload.
   - Radarr unmonitor: GET /api/v3/movie/{id} → PUT same object with monitored:false.
   - Accept S00 specials.
   - Auto-detect app (TV→Sonarr, Movie→Radarr) from path.
   - Route HD/4K to different Arr instances.
   - No file move/copy/delete logic here.
*/

Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;

/* -------------- small helpers -------------- */
const PATH_SEP = /[\\/]/;
const getFileName = (p)=> String(p||'').split(PATH_SEP).pop() || '';
const getDirParts = (p)=> String(p||'').split(PATH_SEP).filter(Boolean);
const stripTrailingSlashes = (u)=> String(u||'').replace(/\/+$/,'');
const toBool = (v)=>{
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["1","true","yes","on"].includes(v.toLowerCase());
  return !!v;
};

function parseSxxEyyFromPath(p) {
  const base = getFileName(p);
  const m = base.match(/S(\d{1,2})E(\d{1,3})/i);
  return m ? { season: Number(m[1]), episode: Number(m[2]) } : { season: null, episode: null };
}

function looksLikeTvPath(p) {
  const parts = getDirParts(p);
  if (parts.some(x => /^(?:Season|Series)\s+\d+$/i.test(x))) return true;
  const { season, episode } = parseSxxEyyFromPath(p);
  return season !== null && episode !== null;
}

function getSeriesTitleFromPath(p) {
  const parts = getDirParts(p);
  for (let i = 1; i < parts.length; i++) {
    if (/^Season\s+\d+$/i.test(parts[i])) return parts[i - 1];
  }
  const base = getFileName(p).replace(/\.(mkv|mp4|avi|ts|m4v)$/i, '');
  const idx = base.search(/S\d{1,2}E\d{1,3}/i);
  return (idx > 0 ? base.slice(0, idx) : base).replace(/[._]+/g, ' ').trim();
}

function tvdbIdFromPath(p) {
  const m = String(p||'').match(/\{tvdb-(\d+)\}/i);
  return m ? Number(m[1]) : null;
}

function is4KPath(p) {
  const s = String(p||'').toLowerCase();
  return /\b(2160p|uhd|4k)\b/.test(s) || /[\s._-](uhd|4k)[\s._-]/.test(s);
}

/* -------------- plugin details -------------- */
const details = () => ({
  name: 'AK_NotifyAndUnmonitorArr',
  description: 'Refresh Sonarr/Radarr; optionally unmonitor item afterwards; auto HD/4K routing via path detection; no file management.',
  style: { borderColor: 'green' },
  tags: 'arr,sonarr,radarr,unmonitor,post',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.00.00',
  sidebarPosition: -1,
  icon: 'faBell',
  inputs: [
    // HD / 4K endpoints (Sonarr)
    { label:'Sonarr HD Host',    name:'sonarr_hd_host',    type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'Base URL for HD Sonarr. No trailing slash.' },
    { label:'Sonarr HD API Key', name:'sonarr_hd_api_key', type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'X-Api-Key for HD Sonarr' },
    { label:'Sonarr 4K Host',    name:'sonarr_4k_host',    type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'Base URL for 4K Sonarr. No trailing slash.' },
    { label:'Sonarr 4K API Key', name:'sonarr_4k_api_key', type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'X-Api-Key for 4K Sonarr' },

    // HD / 4K endpoints (Radarr)
    { label:'Radarr HD Host',    name:'radarr_hd_host',    type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'Base URL for HD Radarr. No trailing slash.' },
    { label:'Radarr HD API Key', name:'radarr_hd_api_key', type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'X-Api-Key for HD Radarr' },
    { label:'Radarr 4K Host',    name:'radarr_4k_host',    type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'Base URL for 4K Radarr. No trailing slash.' },
    { label:'Radarr 4K API Key', name:'radarr_4k_api_key', type:'string', defaultValue:'', inputUI:{ type:'text' }, tooltip:'X-Api-Key for 4K Radarr' },

    { label:'Unmonitor after refresh', name:'unmonitor_after_refresh', type:'boolean', defaultValue:true, inputUI:{ type:'checkbox' }, tooltip:'If enabled: Radarr → unmonitor movie; Sonarr → unmonitor SxxEyy' },
    { label:'Timeout (ms)',            name:'timeout_ms',               type:'number',  defaultValue:15000, inputUI:{ type:'number' }, tooltip:'HTTP timeout' },
  ],
  outputs: [
    { number:1, tooltip:'Arr notified (and possibly unmonitored)' },
    { number:2, tooltip:'Arr item not found' },
  ],
});
exports.details = details;

/* -------------- HTTP helpers -------------- */
function httpTimeout(args){ return Number(args.inputs.timeout_ms || 15000); }
async function arrPOST(args, base, path, headers, data) {
  return args.deps.axios({ method:'post', url:`${base}${path}`, headers, data, timeout:httpTimeout(args) });
}
async function arrGET(args, base, path, headers, params) {
  return args.deps.axios({ method:'get', url:`${base}${path}`, headers, params, timeout:httpTimeout(args) });
}
async function arrPUT(args, base, path, headers, data) {
  return args.deps.axios({ method:'put', url:`${base}${path}`, headers, data, timeout:httpTimeout(args) });
}

/* -------------- ID resolution -------------- */
const getId = async (args, arrApp, fileName) => {
  const imdbId = (/\btt\d{7,10}\b/i.exec(fileName)?.at(0)) ?? '';
  let id = -1;

  // imdb lookup first
  if (imdbId) {
    const r = await arrGET(args, arrApp.host, `/api/v3/${arrApp.name==='radarr'?'movie':'series'}/lookup`, arrApp.headers, { term:`imdb:${imdbId}` });
    id = Number(r.data?.at(0)?.id ?? -1);
    args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for imdb '${imdbId}'`);
  }

  // fallback to parse
  if (id === -1) {
    const parsedName = getFileName(fileName);
    const p = await arrGET(args, arrApp.host, `/api/v3/parse`, arrApp.headers, { title: parsedName });
    id = arrApp.delegates.getIdFromParseResponse(p);
    args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for '${parsedName}'`);
  }
  return id;
};

/* -------------- Sonarr helpers -------------- */
async function lookupSonarrSeriesId(args, base, headers, srcPath) {
  const tvdb = tvdbIdFromPath(srcPath);
  if (tvdb) {
    const lk = await arrGET(args, base, `/api/v3/series/lookup`, headers, { term: `tvdb:${tvdb}` });
    const hit = Array.isArray(lk.data) && lk.data.length ? lk.data[0].id : -1;
    if (hit !== -1) return hit;
  }
  const title = getSeriesTitleFromPath(srcPath);
  if (!title) return -1;
  const lookup = await arrGET(args, base, `/api/v3/series/lookup`, headers, { term: title });
  return (Array.isArray(lookup.data) && lookup.data.length) ? lookup.data[0].id : -1;
}

async function unmonitorSonarrEpisode(args, base, apiKey, seriesId, season, episode) {
  const headers = { 'X-Api-Key': apiKey, 'Content-Type':'application/json', Accept:'application/json' };
  const timeout = httpTimeout(args);

  const eps = await arrGET(args, base, `/api/v3/episode`, headers, { seriesId });
  const match = Array.isArray(eps.data)
    ? eps.data.find(e => Number(e.seasonNumber) === Number(season) && Number(e.episodeNumber) === Number(episode))
    : null;
  if (!match) {
    args.jobLog(`Sonarr: episode S${season}E${episode} not found in seriesId ${seriesId}`);
    return false;
  }

  try {
    await args.deps.axios.put(
      `${base}/api/v3/episode/monitor`,
      { monitored: false, episodeIds: [match.id] },
      { headers, timeout, params: { includeImages: false } }
    );
    args.jobLog(`✔ Sonarr: unmonitored S${season}E${episode} (episodeId=${match.id}) via PUT /episode/monitor`);
    return true;
  } catch (e) {
    const code = e?.response?.status;
    if (code !== 405 && code !== 404) throw e;
    args.jobLog(`Sonarr /episode/monitor unsupported (${code}). Falling back to PUT /episode`);
  }

  const epFull = await args.deps.axios.get(`${base}/api/v3/episode/${match.id}`, { headers, timeout });
  const payload = Object.assign({}, epFull.data, { monitored: false });
  await args.deps.axios.put(`${base}/api/v3/episode`, [payload], { headers, timeout });

  args.jobLog(`✔ Sonarr: unmonitored S${season}E${episode} (episodeId=${match.id}) via PUT /episode`);
  return true;
}

async function unmonitorSonarrByPath(args, base, apiKey, srcPath, seriesIdFromRefresh) {
  const sxe = parseSxxEyyFromPath(srcPath);
  if (sxe.season === null || sxe.episode === null) {
    args.jobLog(`Sonarr: cannot unmonitor – SxxEyy not detected in "${srcPath}"`);
    return false;
  }
  const headers = { 'X-Api-Key': apiKey, 'Content-Type':'application/json', Accept:'application/json' };
  const seriesId = (seriesIdFromRefresh && seriesIdFromRefresh !== -1)
    ? seriesIdFromRefresh
    : await lookupSonarrSeriesId(args, base, headers, srcPath);
  if (seriesId === -1) {
    args.jobLog('Sonarr: series id not resolved for unmonitor.');
    return false;
  }
  return unmonitorSonarrEpisode(args, base, apiKey, seriesId, sxe.season, sxe.episode);
}

/* -------------- Radarr helpers -------------- */
async function unmonitorRadarr(args, base, headers, movieId) {
  const m = await arrGET(args, base, `/api/v3/movie/${movieId}`, headers);
  const payload = Object.assign({}, m.data, { monitored:false });
  await arrPUT(args, base, `/api/v3/movie/${movieId}`, headers, payload);
  args.jobLog(`✔ Radarr: movie id=${movieId} unmonitored`);
}

/* -------------- app config (HD/4K) -------------- */
function pickInstance(args, appName, is4k) {
  if (appName === 'sonarr') {
    const host = stripTrailingSlashes(is4k ? args.inputs.sonarr_4k_host : args.inputs.sonarr_hd_host);
    const key  = String(is4k ? args.inputs.sonarr_4k_api_key : args.inputs.sonarr_hd_api_key || '');
    const headers = { 'X-Api-Key': key, 'Content-Type':'application/json', Accept:'application/json' };
    return {
      name:'sonarr', host, key, headers, content:'Serie',
      delegates:{
        getIdFromParseResponse: (resp)=> Number(resp?.data?.series?.id ?? -1),
        buildRefreshRequest: (id)=> ({ name:'RefreshSeries', seriesId:id }),
      }
    };
  }
  // radarr
  const host = stripTrailingSlashes(is4k ? args.inputs.radarr_4k_host : args.inputs.radarr_hd_host);
  const key  = String(is4k ? args.inputs.radarr_4k_api_key : args.inputs.radarr_hd_api_key || '');
  const headers = { 'X-Api-Key': key, 'Content-Type':'application/json', Accept:'application/json' };
  return {
    name:'radarr', host, key, headers, content:'Movie',
    delegates:{
      getIdFromParseResponse: (resp)=> Number(resp?.data?.movie?.id ?? -1),
      buildRefreshRequest: (id)=> ({ name:'RefreshMovie', movieIds:[id] }),
    }
  };
}

/* -------------- main plugin -------------- */
const plugin = async (args) => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const originalFileName = args.originalLibraryFile?._id || '';
  const currentFileName  = args.inputFileObj?._id || '';
  const srcPath = currentFileName || originalFileName || '';

  const isTv  = looksLikeTvPath(srcPath);
  const is4k  = is4KPath(srcPath);
  const unmonitorFlag = toBool(args.inputs.unmonitor_after_refresh);

  // Auto-detect: TV path → Sonarr, everything else → Radarr
  const target = isTv ? 'sonarr' : 'radarr';
  const arrApp = pickInstance(args, target, is4k);

  if (!arrApp.host || !arrApp.key) {
    throw new Error(`Missing ${arrApp.name} ${is4k ? '4K' : 'HD'} host or API key`);
  }

  if (arrApp.name === 'sonarr' && /radarr/i.test(arrApp.host)) args.jobLog('Warning: target=sonarr but host looks like Radarr');
  if (arrApp.name === 'radarr' && /sonarr/i.test(arrApp.host)) args.jobLog('Warning: target=radarr but host looks like Sonarr');

  args.jobLog(`AK_NotifyAndUnmonitorArr start — detected: ${target.toUpperCase()} ${is4k ? '4K' : 'HD'}`);

  // Refresh
  let id = -1;
  let refreshed = false;
  try {
    args.jobLog('Going to force scan');
    args.jobLog(`Refreshing ${arrApp.name}...`);

    id = await getId(args, arrApp, originalFileName);
    if (id === -1 && currentFileName && currentFileName !== originalFileName) {
      id = await getId(args, arrApp, currentFileName);
    }
    if (id !== -1) {
      await arrPOST(args, arrApp.host, `/api/v3/command`, arrApp.headers, arrApp.delegates.buildRefreshRequest(id));
      refreshed = true;
      args.jobLog(`✔ ${arrApp.content} '${id}' refreshed in ${arrApp.name}.`);
    } else {
      args.jobLog(`${arrApp.content} not found for refresh.`);
    }
  } catch (e) {
    args.jobLog(`Arr refresh error: ${e?.message || String(e)}`);
  }

  // Unmonitor
  if (unmonitorFlag) {
    try {
      if (arrApp.name === 'radarr' && id !== -1) {
        await unmonitorRadarr(args, arrApp.host, arrApp.headers, id);
      } else if (arrApp.name === 'sonarr' && srcPath) {
        await unmonitorSonarrByPath(args, arrApp.host, arrApp.key, srcPath, id);
      } else {
        args.jobLog('Unmonitor skipped (insufficient context).');
      }
    } catch (e) {
      args.jobLog(`Unmonitor error: ${e?.message || String(e)}`);
    }
  }

  // No file management here; hand off to your Replace Original File plugin next.
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: refreshed ? 1 : 2,
    variables: args.variables,
  };
};
exports.plugin = plugin;
