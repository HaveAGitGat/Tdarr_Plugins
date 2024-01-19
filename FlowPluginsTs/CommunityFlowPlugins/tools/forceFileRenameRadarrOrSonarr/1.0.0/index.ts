import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Force File Rename Radarr or Sonarr',
  description: 'Force Radarr or Sonarr to rename a file according to the naming policy',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faBell',
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
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key } = args.inputs;
  const arr_host = String(args.inputs.arr_host).trim();

  const fileName = args.originalLibraryFile?.meta?.FileName || '';

  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': arr_api_key,
    Accept: 'application/json',
  };

  args.jobLog('Going to force rename');

  const rename = async (
    getId: (parseRequestResult: any) => any,
    getPreviewRenameResquestUrl: (id: any, parseRequestResult: any) => any,
    getRenameResquestData: (id: any, previewRenameRequestResult: any) => any)
    : Promise<void> => {
    args.jobLog(`Renaming ${arr === 'radarr' ? 'Radarr' : 'Sonarr'}...`);

    // Using parse endpoint to get the movie/serie's id.
    const parseRequestConfig = {
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
      headers,
    };
    const parseRequestResult = await args.deps.axios(parseRequestConfig);
    const id = getId(parseRequestResult);

    // Using rename endpoint to get ids of all the files that need renaming.
    const previewRenameRequestConfig = {
      method: 'get',
      url: getPreviewRenameResquestUrl(id, parseRequestResult),
      headers,
    };
    const previewRenameRequestResult = await args.deps.axios(previewRenameRequestConfig);

    // Using command endpoint to schedule the renames.
    const renameRequestConfig = {
      method: 'post',
      url: `${arrHost}/api/v3/command`,
      headers,
      data: JSON.stringify(getRenameResquestData(id, previewRenameRequestResult))
    };
    await args.deps.axios(renameRequestConfig);

    args.jobLog(`✔ Renamed ${arr === 'radarr' ? 'movie' : 'serie'} ${id} in ${arr === 'radarr' ? 'Radarr' : 'Sonarr'}.`);
  };

  if (arr === 'radarr') {
    await rename(
      (parseRequestResult) => parseRequestResult.data.movie.movieFile.movieId,
      (id, parseRequestResult) => `${arrHost}/api/v3/rename?movieId=${id}`,
      (id, previewRenameRequestResult) => {
        return {
          name: 'RenameFiles',
          movieId: id,
          files: previewRenameRequestResult.data.map((movieFile: { movieFileId: any; }) => movieFile.movieFileId)
        };
      }
    );
  } else if (arr === 'sonarr') {
    await rename(
      (parseRequestResult) => parseRequestResult.data.series.id,
      (id, parseRequestResult) => `${arrHost}/api/v3/rename?seriesId=${id}&seasonNumber=${parseRequestResult.data.parsedEpisodeInfo.seasonNumber}`,
      (id, previewRenameRequestResult) => {
        return {
          name: 'RenameFiles',
          seriesId: id,
          files: previewRenameRequestResult.data.map((episodeFile: { episodeFileId: any; }) => episodeFile.episodeFileId)
        };
      }
    );
  } else {
    args.jobLog('No arr specified in plugin inputs.');
  }

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
