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

  const rename = async (
    getId: (parseRequestResult: any) => any,
    getPreviewRenameResquestUrl: (id: any, parseRequestResult: any) => any,
    getFileToRename: (previewRenameRequestResult: any) => any,
    getRenameResquestConfigData: (id: any, fileToRename: any) => any)
    : Promise<{ existingPath: any, newPath: any }> => {
    args.jobLog('Going to force rename');
    args.jobLog(`Renaming ${arr === 'radarr' ? 'Radarr' : 'Sonarr'}...`);

    let existingPath, newPath = '';

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
    const fileToRename = getFileToRename(previewRenameRequestResult);

    // Only if there is a rename to execute
    if (fileToRename !== undefined) {
      ({ existingPath, newPath } = fileToRename);

      // Using command endpoint to schedule the renames.
      const renameRequestConfig = {
        method: 'post',
        url: `${arrHost}/api/v3/command`,
        headers,
        data: JSON.stringify(getRenameResquestConfigData(id, fileToRename))
      };
      await args.deps.axios(renameRequestConfig);

      args.jobLog(`✔ Renamed ${arr === 'radarr' ? 'movie' : 'serie'} ${id} in ${arr === 'radarr' ? 'Radarr' : 'Sonarr'} : '${existingPath}' => '${newPath}'.`);
    } else
      args.jobLog(`✔ No rename necessary.`);

    return { existingPath, newPath };
  };

  let existingPath, newPath = '';
  if (arr === 'radarr') {
    ({ existingPath, newPath } = await rename(
      (parseRequestResult) => parseRequestResult.data.movie.movieFile.movieId,
      (id, parseRequestResult) => `${arrHost}/api/v3/rename?movieId=${id}`,
      (previewRenameRequestResult) =>
        ((previewRenameRequestResult.data?.lenght ?? 0) > 0) ?
          previewRenameRequestResult.data[0]
          : undefined,
      (id, fileToRename) => {
        return {
          name: 'RenameFiles',
          movieId: id,
          files: [fileToRename.movieFileId]
        };
      }
    ));
  } else if (arr === 'sonarr') {
    let episodeNumber = 0;
    ({ existingPath, newPath } = await rename(
      (parseRequestResult) => parseRequestResult.data.series.id,
      (id, parseRequestResult) => {
        episodeNumber = parseRequestResult.data.parsedEpisodeInfo.episodeNumbers[0];
        return `${arrHost}/api/v3/rename?seriesId=${id}&seasonNumber=${parseRequestResult.data.parsedEpisodeInfo.seasonNumber}`;
      },
      (previewRenameRequestResult) =>
        ((previewRenameRequestResult.data?.lenght ?? 0) > 0) ?
          previewRenameRequestResult.data.find((episFile: { episodeNumbers: number[]; }) => episFile.episodeNumbers[0] === episodeNumber)
          : undefined,
      (id, fileToRename) => {
        return {
          name: 'RenameFiles',
          seriesId: id,
          files: [fileToRename.episodeFileId]
        };
      }
    ));
  } else {
    args.jobLog('No arr specified in plugin inputs.');
  }

  return {
    outputFileObj: {
      _id: args.inputFileObj.replace(existingPath, newPath)
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
