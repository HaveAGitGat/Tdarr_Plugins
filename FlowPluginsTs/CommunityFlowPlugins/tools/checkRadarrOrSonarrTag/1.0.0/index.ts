import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Check Radarr or Sonarr Tag',
  description: 'Check if a specific tag is present on a movie or series in Radarr or Sonarr',
  style: {
    borderColor: '#6efefc',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faTag',
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
      label: 'Tag Name',
      name: 'tag_name',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The tag name to check for (case-insensitive)',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Tag is present',
    },
    {
      number: 2,
      tooltip: 'Tag is not present or file not found in Radarr/Sonarr',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}

interface ITag {
  id: number,
  label: string,
}

interface IParseResponse {
  data: {
    movie?: { id: number, tags?: number[] },
    series?: { id: number, tags?: number[] },
  },
}

interface IMovieOrSeriesResponse {
  data: {
    id: number,
    tags?: number[],
  },
}

interface IArrApp {
  name: string,
  host: string,
  headers: IHTTPHeaders,
  content: string,
  getIdAndTags: (parseResponse: IParseResponse) => { id: number, tags: number[] },
}

const getId = async (
  args: IpluginInputArgs,
  arrApp: IArrApp,
  fileName: string,
) => {
  const imdbIdMatch = /\btt\d{7,10}\b/i.exec(fileName);
  const imdbId = imdbIdMatch ? imdbIdMatch[0] : '';
  let result = { id: -1, tags: [] as number[] };

  if (imdbId !== '') {
    try {
      const lookupResponse = await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/${arrApp.name === 'radarr' ? 'movie' : 'series'}/lookup?term=imdb:${imdbId}`,
        headers: arrApp.headers,
      });
      const item = lookupResponse.data && lookupResponse.data[0];
      if (item && item.id) {
        result = { id: item.id, tags: item.tags || [] };
      }
    } catch (error) {
      args.jobLog(`Failed to lookup by IMDB ID: ${error}`);
    }
  }

  args.jobLog(`${arrApp.content} ${result.id !== -1 ? `'${result.id}' found` : 'not found'} for imdb '${imdbId}'`);

  if (result.id === -1) {
    try {
      const parseResponse = await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
        headers: arrApp.headers,
      });
      result = arrApp.getIdAndTags(parseResponse);
      args.jobLog(`${arrApp.content} ${result.id !== -1 ? `'${result.id}' found` : 'not found'} for '${getFileName(fileName)}'`);
    } catch (error) {
      args.jobLog(`Failed to parse filename: ${error}`);
    }
  }

  return result;
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Variables initialization
  let tagFound = false;
  const arr = String(args.inputs.arr);
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.charAt(arr_host.length - 1) === '/' ? arr_host.slice(0, -1) : arr_host;
  const tagName = String(args.inputs.tag_name).trim().toLowerCase();
  const originalFileName = args.originalLibraryFile?._id ?? '';
  const currentFileName = args.inputFileObj?._id ?? '';

  if (!tagName) {
    args.jobLog('⚠ No tag name specified');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const headers: IHTTPHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.arr_api_key),
    Accept: 'application/json',
  };

  const arrApp: IArrApp = arr === 'radarr'
    ? {
      name: arr,
      host: arrHost,
      headers,
      content: 'Movie',
      getIdAndTags: (parseResponse: IParseResponse) => ({
        id: Number(parseResponse?.data?.movie?.id ?? -1),
        tags: parseResponse?.data?.movie?.tags || [],
      }),
    }
    : {
      name: arr,
      host: arrHost,
      headers,
      content: 'Series',
      getIdAndTags: (parseResponse: IParseResponse) => ({
        id: Number(parseResponse?.data?.series?.id ?? -1),
        tags: parseResponse?.data?.series?.tags || [],
      }),
    };

  args.jobLog(`Checking for tag '${tagName}' in ${arrApp.name}...`);

  // Get the movie/series ID and tags
  let result = await getId(args, arrApp, originalFileName);
  // Useful in some edge cases
  if (result.id === -1 && currentFileName !== originalFileName) {
    result = await getId(args, arrApp, currentFileName);
  }

  // Checking that the file has been found
  if (result.id !== -1) {
    args.jobLog(`${arrApp.content} '${result.id}' found with tag IDs: [${result.tags.join(', ')}]`);

    // Fetch all tags to map tag names to IDs
    try {
      const tagsResponse = await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/tag`,
        headers,
      });

      const tags: ITag[] = tagsResponse.data || [];
      args.jobLog(`Found ${tags.length} tags in ${arrApp.name}`);

      // Find the tag ID for the specified tag name
      let targetTag: ITag | undefined;
      for (let i = 0; i < tags.length; i += 1) {
        if (tags[i].label.toLowerCase() === tagName) {
          targetTag = tags[i];
          break;
        }
      }

      if (targetTag) {
        args.jobLog(`Tag '${tagName}' has ID ${targetTag.id}`);

        // Check if the movie/series has this tag
        let hasTag = false;
        for (let i = 0; i < result.tags.length; i += 1) {
          if (result.tags[i] === targetTag.id) {
            hasTag = true;
            break;
          }
        }

        if (hasTag) {
          tagFound = true;
          args.jobLog(`Tag '${tagName}' is present on ${arrApp.content} '${result.id}'`);
        } else {
          args.jobLog(`Tag '${tagName}' is NOT present on ${arrApp.content} '${result.id}'`);
        }
      } else {
        args.jobLog(`Tag '${tagName}' does not exist in ${arrApp.name}`);
      }
    } catch (error) {
      args.jobLog(`Failed to fetch tags: ${error}`);
    }
  } else {
    args.jobLog(`${arrApp.content} not found in ${arrApp.name}`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: tagFound ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};

