import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Delete from Radarr or Sonarr',
  description: 'Delete file from Radarr or Sonarr, block release, and search for new release',
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faTrash',
  inputs: [
    {
      label: 'Arr',
      name: 'arr',
      type: 'string',
      defaultValue: 'radarr',
      inputUI: {
        type: 'dropdown',
        options: ['radarr', 'sonarr'],
      },
      tooltip: 'Specify which arr to use',
    },
    {
      label: 'Arr API Key',
      name: 'arr_api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr api key here',
    },
    {
      label: 'Arr Host',
      name: 'arr_host',
      type: 'string',
      defaultValue: 'http://192.168.1.1:7878',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr host here.'
        + '\\nExample:\\n'
        + 'http://192.168.1.1:7878\\n'
        + 'http://192.168.1.1:8989\\n'
        + 'https://radarr.domain.com\\n'
        + 'https://sonarr.domain.com\\n',
    },
    {
      label: 'Delete Files',
      name: 'deleteFiles',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Delete files from disk when removing from Radarr/Sonarr',
    },
    {
      label: 'Add to Blocklist',
      name: 'addToBlocklist',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Add release to blocklist to prevent re-downloading',
    },
    {
      label: 'Search for Replacement',
      name: 'searchForReplacement',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Automatically search for a new release after deletion',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Radarr or Sonarr actions completed',
    },
    {
      number: 2,
      tooltip: 'Radarr or Sonarr do not know this file',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string;
  'X-Api-Key': string;
  Accept: string;
}

interface IParseResponse {
  data: {
    movie?: { id: number };
    series?: { id: number };
  };
}

interface IMovieFile {
  id: number;
  movieId: number;
  relativePath: string;
  path: string;
}

interface IEpisodeFile {
  id: number;
  seriesId: number;
  seasonNumber: number;
  relativePath: string;
  path: string;
  episodeIds?: number[];
}

interface IHistoryRecord {
  id: number;
  movieId?: number;
  seriesId?: number;
  episodeId?: number;
  movieFileId?: number;
  episodeFileId?: number;
  eventType: number;
  sourceTitle?: string;
  data: {
    guid?: string;
    torrentInfoHash?: string;
    indexer?: string;
    releaseGroup?: string;
    nzbInfoUrl?: string;
    downloadUrl?: string;
    downloadId?: string;
  };
}

interface IHistoryResponse {
  data: {
    records: IHistoryRecord[];
  };
}

interface IBlocklistItem {
  movieId?: number;
  seriesId?: number;
  sourceTitle: string;
  protocol: string;
  indexer?: string;
  message?: string;
}

interface IArrApp {
  name: 'radarr' | 'sonarr';
  host: string;
  headers: IHTTPHeaders;
  content: string;
  delegates: {
    getIdFromParseResponse: (parseResponse: IParseResponse) => number;
    getFileEndpoint: (id: number) => string;
    getHistoryEndpoint: (id: number, fileId?: number) => string;
    deleteFileEndpoint: (fileId: number) => string;
    searchEndpoint: () => string;
    blocklistEndpoint: () => string;
    buildSearchRequestData: (id: number) => Record<string, unknown>;
    buildBlocklistRequestData: (item: IBlocklistItem) => Record<string, unknown>;
    extractFileId: (file: IMovieFile | IEpisodeFile) => number;
  };
}

const normalizeFilePath = (path: string): string => path.toLowerCase().replace(/\\/g, '/').trim();

const findMatchingFile = (
  files: Array<IMovieFile | IEpisodeFile>,
  targetPath: string,
  args: IpluginInputArgs,
): IMovieFile | IEpisodeFile | null => {
  const normalizedTarget = normalizeFilePath(targetPath);

  const matchingFile = files.find((file) => {
    const normalizedFilePath = normalizeFilePath(file.path);
    return normalizedFilePath === normalizedTarget || normalizedFilePath.endsWith(normalizedTarget);
  });

  if (matchingFile) {
    args.jobLog(`✔ Found matching file: ${matchingFile.path}`);
    return matchingFile;
  }

  const targetFileName = targetPath.split(/[/\\]/).pop()?.toLowerCase() || '';
  const fileWithMatchingName = files.find((file) => {
    const fileName = file.path.split(/[/\\]/).pop()?.toLowerCase() || '';
    return fileName === targetFileName;
  });

  if (fileWithMatchingName) {
    args.jobLog(`⚠ Found file with matching name but different path: ${fileWithMatchingName.path}`);
    return fileWithMatchingName;
  }

  return null;
};

const getId = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
): Promise<number> => {
  try {
    const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}\b/i.exec(fileName)?.[0] || '';

    if (imdbId) {
      const response = await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
        headers: arrApp.headers,
      });

      const id = Number(response.data?.[0]?.id || -1);
      args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for IMDB ID '${imdbId}'`);

      if (id !== -1) return id;
    }

    const parseResponse = await args.deps.axios({
      method: 'get',
      url: `${arrApp.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
      headers: arrApp.headers,
    });

    const id = arrApp.delegates.getIdFromParseResponse(parseResponse);
    args.jobLog(`${arrApp.content} ${id !== -1 ? `'${id}' found` : 'not found'} for title '${getFileName(fileName)}'`);

    return id;
  } catch (error) {
    args.jobLog(`✖ Error finding ${arrApp.content}: ${error}`);
    return -1;
  }
};

const getFileInfo = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  id: number,
  filePath: string,
): Promise<{ file: IMovieFile | IEpisodeFile; fileId: number } | null> => {
  try {
    const response = await args.deps.axios({
      method: 'get',
      url: arrApp.delegates.getFileEndpoint(id),
      headers: arrApp.headers,
    });

    const files = Array.isArray(response.data) ? response.data : response.data?.data || [];
    const matchingFile = findMatchingFile(files, filePath, args);

    if (matchingFile) {
      const fileId = arrApp.delegates.extractFileId(matchingFile);
      return { file: matchingFile, fileId };
    }

    args.jobLog(`✖ No matching file found in ${arrApp.name} for path: ${filePath}`);
    return null;
  } catch (error) {
    args.jobLog(`✖ Error retrieving file info: ${error}`);
    return null;
  }
};

const getDownloadHistory = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  id: number,
  fileId?: number,
): Promise<IHistoryRecord | null> => {
  try {
    const historyResponse: IHistoryResponse = await args.deps.axios({
      method: 'get',
      url: arrApp.delegates.getHistoryEndpoint(id, fileId),
      headers: arrApp.headers,
    });

    const records = historyResponse.data?.records || [];

    const downloadRecord = records.find((record) => record.eventType === 1
      && (record.data?.guid || record.data?.torrentInfoHash || record.data?.downloadId)
      && (fileId ? (record.movieFileId === fileId || record.episodeFileId === fileId) : true));

    if (downloadRecord) {
      args.jobLog(`✔ Found download history for ${arrApp.content} '${id}'`);
      return downloadRecord;
    }

    args.jobLog(`⚠ No download history found for ${arrApp.content} '${id}'`);
    return null;
  } catch (error) {
    args.jobLog(`⚠ Could not retrieve download history: ${error}`);
    return null;
  }
};

const createArrApp = (
  arr: string,
  arrHost: string,
  headers: IHTTPHeaders,
): IArrApp => {
  if (arr === 'radarr') {
    return {
      name: 'radarr',
      host: arrHost,
      headers,
      content: 'Movie',
      delegates: {
        getIdFromParseResponse: (response: IParseResponse) => Number(response?.data?.movie?.id || -1),
        getFileEndpoint: (id: number) => `${arrHost}/api/v3/moviefile?movieId=${id}`,
        getHistoryEndpoint: (id: number) => `${arrHost}/api/v3/history?movieId=${id}&eventType=1&includeMovie=false`,
        deleteFileEndpoint: (fileId: number) => `${arrHost}/api/v3/moviefile/${fileId}`,
        searchEndpoint: () => `${arrHost}/api/v3/command`,
        blocklistEndpoint: () => `${arrHost}/api/v3/blocklist`,
        buildSearchRequestData: (id: number) => ({ name: 'MoviesSearch', movieIds: [id] }),
        buildBlocklistRequestData: (item: IBlocklistItem) => ({
          movieId: item.movieId,
          sourceTitle: item.sourceTitle,
          protocol: item.protocol,
          indexer: item.indexer,
          message: item.message || 'Blocked by Tdarr plugin',
        }),
        extractFileId: (file: IMovieFile | IEpisodeFile) => file.id,
      },
    };
  }

  return {
    name: 'sonarr',
    host: arrHost,
    headers,
    content: 'Series',
    delegates: {
      getIdFromParseResponse: (response: IParseResponse) => Number(response?.data?.series?.id || -1),
      getFileEndpoint: (id: number) => `${arrHost}/api/v3/episodefile?seriesId=${id}`,
      getHistoryEndpoint: (id: number) => `${arrHost}/api/v3/history?seriesId=${id}&eventType=1&includeSeries=false`,
      deleteFileEndpoint: (fileId: number) => `${arrHost}/api/v3/episodefile/${fileId}`,
      searchEndpoint: () => `${arrHost}/api/v3/command`,
      blocklistEndpoint: () => `${arrHost}/api/v3/blocklist`,
      buildSearchRequestData: (id: number) => ({ name: 'SeriesSearch', seriesId: id }),
      buildBlocklistRequestData: (item: IBlocklistItem) => ({
        seriesId: item.seriesId,
        sourceTitle: item.sourceTitle,
        protocol: item.protocol,
        indexer: item.indexer,
        message: item.message || 'Blocked by Tdarr plugin',
      }),
      extractFileId: (file: IMovieFile | IEpisodeFile) => file.id,
    },
  };
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const arr = String(args.inputs.arr);
  const arrHost = String(args.inputs.arr_host).trim().replace(/\/$/, '');
  const deleteFiles = args.inputs.deleteFiles === true || args.inputs.deleteFiles === 'true';
  const addToBlocklist = args.inputs.addToBlocklist === true || args.inputs.addToBlocklist === 'true';
  const searchForReplacement = args.inputs.searchForReplacement === true || args.inputs.searchForReplacement === 'true';

  const originalFilePath = args.originalLibraryFile?._id || '';
  const currentFilePath = args.inputFileObj?._id || '';

  if (!args.inputs.arr_api_key) {
    throw new Error('API key is required');
  }

  const headers: IHTTPHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.arr_api_key),
    Accept: 'application/json',
  };

  const arrApp = createArrApp(arr, arrHost, headers);

  args.jobLog(`Starting deletion process for ${arrApp.name}...`);
  args.jobLog(`Looking for file: ${originalFilePath || currentFilePath}`);

  let id = await getId(args, arrApp, originalFilePath);
  if (id === -1 && currentFilePath !== originalFilePath) {
    id = await getId(args, arrApp, currentFilePath);
  }

  if (id === -1) {
    args.jobLog(`✖ ${arrApp.content} not found in ${arrApp.name}`);
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`✔ ${arrApp.content} '${id}' found in ${arrApp.name}`);

  const fileInfo = await getFileInfo(args, arrApp, id, originalFilePath || currentFilePath);
  if (!fileInfo) {
    args.jobLog(`✖ File not found in ${arrApp.name} library`);
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  let historyRecord: IHistoryRecord | null = null;
  if (addToBlocklist) {
    historyRecord = await getDownloadHistory(args, arrApp, id, fileInfo.fileId);
  }

  if (addToBlocklist && historyRecord) {
    try {
      const blocklistItem: IBlocklistItem = {
        ...(arrApp.name === 'radarr' ? { movieId: id } : { seriesId: id }),
        sourceTitle: historyRecord.sourceTitle || 'Unknown',
        protocol: historyRecord.data?.downloadUrl?.startsWith('magnet:') ? 'torrent' : 'usenet',
        indexer: historyRecord.data?.indexer,
        message: 'Blocked by Tdarr due to processing issues',
      };

      await args.deps.axios({
        method: 'post',
        url: arrApp.delegates.blocklistEndpoint(),
        headers,
        data: arrApp.delegates.buildBlocklistRequestData(blocklistItem),
      });
      args.jobLog('✔ Release added to blocklist');
    } catch (blocklistError) {
      args.jobLog(`⚠ Failed to add to blocklist: ${blocklistError}`);
    }
  }

  if (deleteFiles) {
    try {
      await args.deps.axios({
        method: 'delete',
        url: arrApp.delegates.deleteFileEndpoint(fileInfo.fileId),
        headers,
      });
      args.jobLog(`✔ File deleted from ${arrApp.name}`);
    } catch (deleteError) {
      args.jobLog(`✖ Failed to delete file: ${deleteError}`);
      throw deleteError;
    }
  } else {
    args.jobLog('⚠ File deletion skipped (deleteFiles is false)');
  }

  if (searchForReplacement) {
    try {
      await args.deps.axios({
        method: 'post',
        url: arrApp.delegates.searchEndpoint(),
        headers,
        data: arrApp.delegates.buildSearchRequestData(id),
      });
      args.jobLog('✔ Search for replacement initiated');
    } catch (searchError) {
      args.jobLog(`⚠ Failed to initiate search: ${searchError}`);
    }
  }

  args.jobLog('✔ All actions completed successfully');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
