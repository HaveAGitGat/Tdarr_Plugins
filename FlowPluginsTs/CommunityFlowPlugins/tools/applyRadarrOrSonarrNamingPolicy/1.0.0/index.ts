import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Apply Radarr or Sonarr naming policy',
  description: 'Apply Radarr or Sonarr naming policy to a file. This plugin should be called after the original file has been replaced and Radarr or Sonarr has been notified. Radarr or Sonarr should also be notified after this plugin.',
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

interface IGetNewPathDelegates {
  getIdFromParseRequestResult: (parseRequestResult: any) => string,
  buildPreviewRenameResquestUrl: (id: string, parseRequestResult: any) => string,
  getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult: any) => any
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key } = args.inputs;
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const fileName = getFileName(args.inputFileObj._id);

  const getNewPath = async (delegates: IGetNewPathDelegates)
    : Promise<string> => {
    let pathWithNewName = '';

    args.jobLog('Going to force rename');
    args.jobLog(`Renaming ${arr === 'radarr' ? 'Radarr' : 'Sonarr'}...`);

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': arr_api_key,
      Accept: 'application/json',
    };

    // Using parse endpoint to get the movie/serie's id.
    const parseRequestConfig = {
      method: 'get',
      url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
      headers,
    };
    const parseRequestResult = await args.deps.axios(parseRequestConfig);
    const id = delegates.getIdFromParseRequestResult(parseRequestResult);

    // Checking that the file has been found. A file not found might be caused because Radarr/Sonarr hasn't been notified of a file rename (notify plugin missing ?)
    // or because Radarr/Sonarr has upgraded the movie/serie to another release before the end of the plugin stack execution.
    if (id !== '-1') {
      // Using rename endpoint to get ids of all the files that need renaming.
      const previewRenameRequestConfig = {
        method: 'get',
        url: delegates.buildPreviewRenameResquestUrl(id, parseRequestResult),
        headers,
      };
      const previewRenameRequestResult = await args.deps.axios(previewRenameRequestConfig);
      const fileToRename = delegates.getFileToRenameFromPreviewRenameRequestResult(previewRenameRequestResult);

      // Only if there is a rename to execute
      if (fileToRename !== undefined) {
        pathWithNewName = `${getFileAbosluteDir(args.inputFileObj._id)}/${getFileName(fileToRename.newPath)}.${getContainer(fileToRename.newPath)}`;

        await fileMoveOrCopy({
          operation: 'move',
          sourcePath: args.inputFileObj._id,
          destinationPath: pathWithNewName,
          args,
        });
        args.jobLog(`✔ Renamed ${arr === 'radarr' ? 'movie' : 'serie'} ${id} : '${args.inputFileObj._id}' => '${pathWithNewName}'.`);
      } else
        args.jobLog('✔ No rename necessary.');
    } else
      args.jobLog(`No ${arr === 'radarr' ? 'movie' : 'serie'} with a file named '${fileName}'.`);

    return pathWithNewName;
  };

  let pathWithNewName = '';
  if (arr === 'radarr') {
    pathWithNewName = await getNewPath({
      getIdFromParseRequestResult: (parseRequestResult) => String(parseRequestResult.data?.movie?.movieFile?.movieId ?? -1),
      buildPreviewRenameResquestUrl: (id, parseRequestResult) => `${arrHost}/api/v3/rename?movieId=${id}`,
      getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult) =>
        ((previewRenameRequestResult.data?.length ?? 0) > 0) ?
          previewRenameRequestResult.data[0]
          : undefined
    });
  } else if (arr === 'sonarr') {
    let episodeNumber = 0;
    pathWithNewName = await getNewPath({
      getIdFromParseRequestResult: (parseRequestResult) => String(parseRequestResult.data?.series?.id ?? -1),
      buildPreviewRenameResquestUrl: (id, parseRequestResult) => {
        episodeNumber = parseRequestResult.data.parsedEpisodeInfo.episodeNumbers[0];
        return `${arrHost}/api/v3/rename?seriesId=${id}&seasonNumber=${parseRequestResult.data.parsedEpisodeInfo.seasonNumber}`;
      },
      getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult) =>
        ((previewRenameRequestResult.data?.length ?? 0) > 0) ?
          previewRenameRequestResult.data.find((episodeFile: { episodeNumbers: number[]; }) => ((episodeFile.episodeNumbers?.length ?? 0) > 0) ? episodeFile.episodeNumbers[0] === episodeNumber : false)
          : undefined
    });
  } else {
    args.jobLog('No arr specified in plugin inputs.');
  }

  return {
    outputFileObj: pathWithNewName !== '' ? { ...args.inputFileObj, _id: pathWithNewName } : args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
