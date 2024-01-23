import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Plex Media Reanlayzer',
  description: 'Notify Plex Media Reanalyzer to trigger Plex reanalysis after file change. https://github.com/brandon099/plex-media-reanalyzer',
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
        label: 'Plex Media Reanalyzer URL',
        name: 'plexMediaReanalyzerUrl',
        type: 'string',
        defaultValue: 'http://plex-media-reanalyzer:8080',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Specify Plex Media Reanalyzer URL, including port if not 80 or 443.',
    },
    {
        label: 'Plex Media Reanalyzer Auth key',
        name: 'plexMediaReanalyzerAuthKey',
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Specify Plex Media Reanalyzer Auth key if it has been configured. Leave blank if not configured.',
  },
    {
        label: 'Plex API Key',
        name: 'plexApiKey',
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Specify Plex API Key. This is required.',
    },
    {
        label: 'Plex Library Name',
        name: 'plexMediaReanalyzerLibraryName',
        type: 'string',
        defaultValue: 'Movies',
        inputUI: {
          type: 'text',
        },
        tooltip: 'Specify Plex Library Name. This is not required, but if not provided it will default to whatever is configured in Plex Media Reanalyzer server configuration.',
    }
    
  ],
  outputs: [
    {
        number: 1,
        tooltip: 'Continue to next plugin', 
    }
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
    const lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
  
    const { plexApiKey, plexMediaReanalyzerAuthKey, plexMediaReanalyzerLibraryName } = args.inputs;
    const plexMediaReanalyzerUrl = String(args.inputs.plexMediaReanalyzerUrl).trim();
  
    const fileName = args.originalLibraryFile?.meta?.FileName || '';
  
    const plexMediaReanalyzerUrl_clean = plexMediaReanalyzerUrl.endsWith('/') ? plexMediaReanalyzerUrl.slice(0, -1) : plexMediaReanalyzerUrl;
  ;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': plexMediaReanalyzerAuthKey,
      'X-Plex-Token': plexApiKey,
      Accept: 'application/json',
    };
  
    args.jobLog('Sending analyze request to Plex Media Reanalyzer...');

    const analyzeMediaRequest = {
      method: 'post',
      url: `${plexMediaReanalyzerUrl_clean}/anaylze_media`,
      headers,
      data: JSON.stringify({
        filename: fileName,
        library_section: plexMediaReanalyzerLibraryName,
      }),
    };

    await args.deps.axios(analyzeMediaRequest);

    args.jobLog(`✔ Requested Plex Media Reanalyzer to reanalyze ${fileName}.`);
  
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
  
