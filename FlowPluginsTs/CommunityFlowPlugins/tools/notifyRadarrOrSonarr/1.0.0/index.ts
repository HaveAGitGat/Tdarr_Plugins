import { get } from 'http';
import {
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change',
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
  ],
});

interface IFileNames {
  originalFileName: string,
  currentFileName : string
}
interface IRefreshDelegates {
  getIdFromParseRequestResult: (parseRequestResult: any) => number,
  buildRefreshResquestData: (id: number) => string
}
interface IRefreshType {
  appName: string,
  contentName: string,
  delegates: IRefreshDelegates
}
interface IRefreshTypes {
  radarr: IRefreshType,
  sonarr: IRefreshType
}

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key } = args.inputs;
  const arr_host = String(args.inputs.arr_host).trim();
  const arrHost = arr_host.endsWith('/') ? arr_host.slice(0, -1) : arr_host;
  const fileNames : IFileNames = {
    originalFileName : getFileName(args.originalLibraryFile?._id ?? ''),
    currentFileName: getFileName(args.inputFileObj?._id ?? '')
  };

  const refresh = async (refreshType: IRefreshType)
    : Promise<boolean> => {
    args.jobLog('Going to force scan');
    args.jobLog(`Refreshing ${refreshType.appName}...`);

    let refreshed = false;
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': arr_api_key,
      Accept: 'application/json',
    };

    const getId = async (fileName : string)
    : Promise<number> => {
      // Using parse endpoint to get the movie/serie's id.
      const parseRequestConfig = {
        method: 'get',
        url: `${arrHost}/api/v3/parse?title=${encodeURIComponent(fileName)}`,
        headers,
      };
      const parseRequestResult = await args.deps.axios(parseRequestConfig);
      const id = refreshType.delegates.getIdFromParseRequestResult(parseRequestResult);
      args.jobLog(id !== -1 ?
        `Found ${refreshType.contentName} ${id} with a file named '${fileName}'`
        : `Didn't find ${refreshType.contentName} with a file named '${fileName}' in ${arrHost}.`);
      return id;
    }

    let fileName = fileNames.originalFileName;
    let id = await getId(fileName);
    // In case there has been a name change and the arr app already noticed it.
    if(id == -1 && fileNames.currentFileName !== fileNames.originalFileName) {
      fileName = fileNames.currentFileName;
      id = await getId(fileName);
    }

    // Checking that the file has been found.
    if (id !== -1) {
      // Using refresh command endpoint to force rescan.
      const refreshResquestConfig = {
        method: 'post',
        url: `${arrHost}/api/v3/command`,
        headers,
        data: refreshType.delegates.buildRefreshResquestData(id)
      };
      await args.deps.axios(refreshResquestConfig);

      refreshed = true;
      args.jobLog(`✔ Refreshed ${refreshType.contentName} ${id} in ${refreshType.appName}.`);
    }

    return refreshed;
  };

  const refreshTypes: IRefreshTypes = {
    radarr: {
      appName: 'Radarr',
      contentName: 'movie',
      delegates: {
        getIdFromParseRequestResult: (parseRequestResult) => Number(parseRequestResult.data?.movie?.movieFile?.movieId ?? -1),
        buildRefreshResquestData: id => JSON.stringify({ name: 'RefreshMovie', movieIds: [id] })
      }
    },
    sonarr: {
      appName: 'Sonarr',
      contentName: 'serie',
      delegates: {
        getIdFromParseRequestResult: (parseRequestResult) => Number(parseRequestResult.data?.series?.id ?? -1),
        buildRefreshResquestData: id => JSON.stringify({ name: 'RefreshSeries', seriesId: id })
      },
    },
  }

  const refreshed = await refresh(arr === 'radarr' ? refreshTypes.radarr : refreshTypes.sonarr);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: refreshed ? 1 : 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
