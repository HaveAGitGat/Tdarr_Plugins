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
      tooltip: 'Radarr or Sonnar notified',
    },
    {
      number: 2,
      tooltip: 'Radarr or Sonnar do not know this file',
    }
  ]
});

interface IFileNames {
  originalFileName: string,
  currentFileName: string
}
interface IParseRequestResult {
  requestResult: any,
  id: string
}
interface IGetNewPathDelegates {
  getIdFromParseRequestResult: (parseRequestResult: any) => string,
  buildPreviewRenameResquestUrl: (parseRequestResult: IParseRequestResult) => string,
  getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult: any) => any
}
interface IGetNewPathType {
  appName: string,
  contentName: string,
  delegates: IGetNewPathDelegates
}
interface IGetNewPathTypes {
  radarr: IGetNewPathType,
  sonarr: IGetNewPathType
}
interface IGetNewPathOutput {
  newPath: string,
  isSuccessful: boolean
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key } = args.inputs;
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const filePath = args.originalLibraryFile?._id ?? '';
  const fileNames: IFileNames = {
    originalFileName: getFileName(args.originalLibraryFile?._id ?? ''),
    currentFileName: getFileName(args.inputFileObj?._id ?? '')
  };

  const getNewPath = async (getNewPathType: IGetNewPathType)
    : Promise<IGetNewPathOutput> => {
    const output: IGetNewPathOutput = {
      newPath: '',
      isSuccessful: false
    }
    args.jobLog('Going to apply new name');
    args.jobLog(`Renaming ${getNewPathType.appName}...`);

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': arr_api_key,
      Accept: 'application/json',
    };

    const getParseRequestResult = async (fileName: string)
      : Promise<IParseRequestResult> => {
      // Using parse endpoint to get the movie/serie's id.
      const parseRequestConfig = {
        method: 'get',
        url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
        headers,
      };
      const parseRequestResult = await args.deps.axios(parseRequestConfig);
      const id = getNewPathType.delegates.getIdFromParseRequestResult(parseRequestResult);
      args.jobLog(id !== '-1' ?
        `Found ${getNewPathType.contentName} ${id} with a file named '${fileName}'`
        : `Didn't find ${getNewPathType.contentName} with a file named '${fileName}' in ${arrHost}.`);
      return { requestResult: parseRequestResult, id: id };
    }

    let fileName = fileNames.originalFileName;
    let parseRequestResult = await getParseRequestResult(fileName);
    // In case there has been a name change and the arr app already noticed it.
    if (parseRequestResult.id == '-1' && fileNames.currentFileName !== fileNames.originalFileName) {
      fileName = fileNames.currentFileName;
      parseRequestResult = await getParseRequestResult(fileName);
    }

    // Checking that the file has been found.
    if (parseRequestResult.id !== '-1') {
      // Using rename endpoint to get ids of all the files that need renaming.
      const previewRenameRequestConfig = {
        method: 'get',
        url: getNewPathType.delegates.buildPreviewRenameResquestUrl(parseRequestResult),
        headers,
      };
      const previewRenameRequestResult = await args.deps.axios(previewRenameRequestConfig);
      const fileToRename = getNewPathType.delegates.getFileToRenameFromPreviewRenameRequestResult(previewRenameRequestResult);

      // Only if there is a rename to execute
      if (fileToRename !== undefined) {
        output.newPath = `${getFileAbosluteDir(args.inputFileObj._id)}/${getFileName(fileToRename.newPath)}.${getContainer(fileToRename.newPath)}`;

        output.isSuccessful = await fileMoveOrCopy({
          operation: 'move',
          sourcePath: args.inputFileObj._id,
          destinationPath: output.newPath,
          args,
        });
        args.jobLog(`✔ Renamed ${getNewPathType.contentName} ${parseRequestResult.id} : '${filePath}' => '${output.newPath}'.`);
      } else {
        output.isSuccessful = true;
        args.jobLog('✔ No rename necessary.');
      }
    } else
      args.jobLog(`No ${getNewPathType.appName} with a file named '${fileName}'.`);

    return output;
  };

  let episodeNumber = 0;
  const getNewPathTypes: IGetNewPathTypes = {
    radarr: {
      appName: 'Radarr',
      contentName: 'movie',
      delegates: {
        getIdFromParseRequestResult: (parseRequestResult) => String(parseRequestResult.data?.movie?.movieFile?.movieId ?? -1),
        buildPreviewRenameResquestUrl: (parseRequestResult) => `${arrHost}/api/v3/rename?movieId=${parseRequestResult.id}`,
        getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult) =>
          ((previewRenameRequestResult.data?.length ?? 0) > 0) ?
            previewRenameRequestResult.data[0]
            : undefined
      }
    },
    sonarr: {
      appName: 'Sonarr',
      contentName: 'serie',
      delegates: {
        getIdFromParseRequestResult: (parseRequestResult) => String(parseRequestResult.data?.series?.id ?? -1),
        buildPreviewRenameResquestUrl: (parseRequestResult) => {
          episodeNumber = parseRequestResult.requestResult.data.parsedEpisodeInfo.episodeNumbers[0];
          return `${arrHost}/api/v3/rename?seriesId=${parseRequestResult.id}&seasonNumber=${parseRequestResult.requestResult.data.parsedEpisodeInfo.seasonNumber}`;
        },
        getFileToRenameFromPreviewRenameRequestResult: (previewRenameRequestResult) =>
          ((previewRenameRequestResult.data?.length ?? 0) > 0) ?
            previewRenameRequestResult.data.find((episodeFile: { episodeNumbers: number[]; }) => ((episodeFile.episodeNumbers?.length ?? 0) > 0) ? episodeFile.episodeNumbers[0] === episodeNumber : false)
            : undefined
      }
    }
  }
  const newPathOutput = await getNewPath(arr === 'radarr' ? getNewPathTypes.radarr : getNewPathTypes.sonarr);

  return {
    outputFileObj: newPathOutput.isSuccessful && newPathOutput.newPath !== '' ? { ...args.inputFileObj, _id: newPathOutput.newPath } : args.inputFileObj,
    outputNumber: newPathOutput.isSuccessful ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
