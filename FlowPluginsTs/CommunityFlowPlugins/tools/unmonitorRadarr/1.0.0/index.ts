import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Unmonitor in Radarr',
  description: 'Unmonitor movie in Radarr after successful transcode to prevent re-downloading',
  style: {
    borderColor: 'red',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faEyeSlash',
  inputs: [
    {
      label: 'Radarr API Key',
      name: 'radarr_api_key',
      type: 'string',
      defaultValue: 'Your-API-Key-Here',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your Radarr API key here',
    },
    {
      label: 'Radarr Host',
      name: 'radarr_host',
      type: 'string',
      defaultValue: 'http://192.168.1.1:7878',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your Radarr host here.'
        + '\\nExample:\\n'
        + 'http://192.168.1.1:7878\\n'
        + 'https://radarr.domain.com\\n',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Movie unmonitored successfully',
    },
    {
      number: 2,
      tooltip: 'Movie not found or already unmonitored',
    },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string,
  'X-Api-Key': string,
  Accept: string,
}

interface IMovie {
  id: number,
  title: string,
  monitored: boolean,
  movieFile?: {
    path: string,
    id: number
  },
  path: string
}

interface IParseResponse {
  data: {
    movie?: { id: number },
  },
}

const getMovieId = async (
  args: IpluginInputArgs,
  host: string,
  headers: IHTTPHeaders,
  fileName: string,
): Promise<{ id: number, movie?: IMovie }> => {
  // First try by IMDB ID
  const imdbId = /\b(tt|nm|co|ev|ch|ni)\d{7,10}?\b/i.exec(fileName)?.at(0) ?? '';
  let id = -1;
  let movie: IMovie | undefined;

  if (imdbId !== '') {
    try {
      const lookupResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/movie/lookup?term=imdb:${imdbId}`,
        headers,
      });
      movie = lookupResponse.data?.at(0);
      id = movie?.id ?? -1;
      args.jobLog(`Movie ${id !== -1 ? `'${movie?.title}' (ID: ${id}) found` : 'not found'} for IMDB '${imdbId}'`);
    } catch (error) {
      args.jobLog(`Error looking up IMDB ${imdbId}: ${error}`);
    }
  }

  // If not found by IMDB, try parse API
  if (id === -1) {
    try {
      const parseResponse: IParseResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/parse?title=${encodeURIComponent(getFileName(fileName))}`,
        headers,
      });
      id = parseResponse?.data?.movie?.id ?? -1;

      if (id !== -1) {
        // Get the full movie object
        const movieResponse = await args.deps.axios({
          method: 'get',
          url: `${host}/api/v3/movie/${id}`,
          headers,
        });
        movie = movieResponse.data;
      }

      const movieTitle = movie?.title ?? 'Unknown';
      const statusMessage = id !== -1 ? `'${movieTitle}' (ID: ${id}) found` : 'not found';
      args.jobLog(`Movie ${statusMessage} for '${getFileName(fileName)}'`);
    } catch (error) {
      args.jobLog(`Error parsing filename: ${error}`);
    }
  }

  // If still not found, try to find by file path
  if (id === -1) {
    try {
      args.jobLog('Attempting to find movie by file path...');
      const allMoviesResponse = await args.deps.axios({
        method: 'get',
        url: `${host}/api/v3/movie`,
        headers,
      });

      const movies: IMovie[] = allMoviesResponse.data || [];
      const fileDir = fileName.substring(0, fileName.lastIndexOf('/'));

      // Find movie by exact file path or by directory
      movie = movies.find((m: IMovie) => (m.movieFile?.path === fileName)
        || (m.path && (fileName.startsWith(m.path) || fileDir === m.path)));

      if (movie) {
        id = movie.id;
        args.jobLog(`Movie '${movie.title}' (ID: ${id}) found by file path`);
      }
    } catch (error) {
      args.jobLog(`Error searching by file path: ${error}`);
    }
  }

  return { id, movie };
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Variables initialization
  const radarr_host = String(args.inputs.radarr_host).trim();
  const radarrHost = radarr_host.endsWith('/') ? radarr_host.slice(0, -1) : radarr_host;
  const originalFileName = args.originalLibraryFile?._id ?? '';
  const currentFileName = args.inputFileObj?._id ?? '';
  const headers: IHTTPHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': String(args.inputs.radarr_api_key),
    Accept: 'application/json',
  };

  args.jobLog('Attempting to unmonitor movie in Radarr');
  args.jobLog(`Checking file: ${currentFileName}`);

  // Get movie ID
  let movieData = await getMovieId(args, radarrHost, headers, originalFileName);

  // Try with current filename if original didn't work
  if (movieData.id === -1 && currentFileName !== originalFileName) {
    movieData = await getMovieId(args, radarrHost, headers, currentFileName);
  }

  // Check if movie was found
  if (movieData.id !== -1 && movieData.movie) {
    if (movieData.movie.monitored) {
      try {
        // Unmonitor the movie
        const updatedMovie = { ...movieData.movie, monitored: false };
        await args.deps.axios({
          method: 'put',
          url: `${radarrHost}/api/v3/movie/${movieData.id}`,
          headers,
          data: updatedMovie,
        });

        args.jobLog(`✅ Movie '${movieData.movie.title}' (ID: ${movieData.id}) successfully unmonitored in Radarr`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 1,
          variables: args.variables,
        };
      } catch (error) {
        args.jobLog(`❌ Error unmonitoring movie: ${error}`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 2,
          variables: args.variables,
        };
      }
    } else {
      args.jobLog(`Movie '${movieData.movie.title}' is already unmonitored`);
      return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
      };
    }
  }

  args.jobLog('Movie not found in Radarr');
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
