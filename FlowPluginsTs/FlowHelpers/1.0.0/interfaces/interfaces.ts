import { IscanTypes } from '../fileUtils';
import { IFileObject, IFileObjectMin, Istreams } from './synced/IFileObject';
import Ijob from './synced/jobInterface';

export interface IpluginInputUi {
    // boolean inputs will default to a switch
    type: 'dropdown' | 'text' | 'textarea' | 'directory' | 'slider' | 'switch',
    options?: string[],
    sliderOptions?: {max: number, min: number, }
    style?: Record<string, unknown>,
    onSelect?: {
        [index: string]: {
            [index: string]: string,
        }
    },
    displayConditions?: {
        // if logic is 'AND' then all sets must be true for element to be displayed
        // if logic is 'OR' then at least one set must be true for element to be displayed
        logic: 'AND' | 'OR',
        sets: {
            // if logic is 'AND' then all inputs conditions must be true for set to be true
            // if logic is 'OR' then at least one input condition must be true for set to be true
            logic: 'OR' | 'AND',
            inputs: {
                // the name of the input to check
                name: string,
                // the value to check against
                value: string,
                // the condition to check against
                condition: '===' | '!==' | '>' | '>=' | '<' | '<=' | 'includes' | 'notIncludes',
            }[],
        }[]
    },
}

export interface IpluginInputs {
    label: string,
    name: string,
    type: 'string' | 'boolean' | 'number',
    defaultValue: string,
    inputUI: IpluginInputUi,
    tooltip: string,
}

export interface IpluginDetails {
    name: string,
    nameUI?: {
        type: 'text' | 'textarea',
        style?: Record<string, unknown>,
    }
    description: string,
    style: {
        borderColor: string,
        opacity?: number,
        borderRadius?: number | string,
        width?: number | string,
        height?: number | string,
        backgroundColor?: string,
    },
    tags: string,
    isStartPlugin: boolean,
    pType: 'start' | 'onFlowError' | '',
    sidebarPosition: number,
    icon: string,
    inputs: IpluginInputs[],

    outputs: {
        number: number,
        tooltip: string,
    }[],
    requiresVersion: string,
}

export interface Ilog {
    (text: string): void
}

export interface IupdateWorker {
    (obj: Record<string, unknown>): void,
}

export interface IffmpegCommandStream extends Istreams {
    removed: boolean,
    forceEncoding: boolean,
    inputArgs: string[],
    outputArgs: string[],
}

export interface IffmpegCommand {
    init: boolean,
    inputFiles: string[],
    streams: IffmpegCommandStream[]
    container: string,
    hardwareDecoding: boolean,
    shouldProcess: boolean,
    overallInputArguments: string[],
    overallOuputArguments: string[],
}

export interface IliveSizeCompare {
    enabled: boolean,
    compareMethod: string,
    thresholdPerc: number,
    checkDelaySeconds: number,
    error: boolean,
}

export interface Ivariables {
    ffmpegCommand: IffmpegCommand,
    flowFailed: boolean,
    user: Record<string, string>,
    healthCheck?: 'Success',
    queueTags?: string,
    liveSizeCompare?: IliveSizeCompare
}

export interface IpluginOutputArgs {
    outputNumber: number,
    outputFileObj: {
        _id: string,
    },
    variables: Ivariables,
}

export interface IpluginInputArgs {
    inputFileObj: IFileObject,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    librarySettings: any,
    inputs: Record<string, unknown>,
    jobLog: Ilog,
    workDir: string,
    platform: string,
    arch: string,
    handbrakePath: string,
    ffmpegPath: string,
    mkvpropeditPath: string,
    originalLibraryFile: IFileObject,
    nodeHardwareType: string,
    workerType: string,
    nodeTags?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any,
    job: Ijob,
    platform_arch_isdocker: string,
    variables: Ivariables,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastSuccesfulPlugin: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastSuccessfulRun: any,
    updateWorker: IupdateWorker,
    logFullCliOutput: boolean,
    logOutcome: (outcome: string) => void,
    scanIndividualFile?: (filee: IFileObjectMin, scanTypes: IscanTypes) => Promise<IFileObject>,
    updateStat: (db: string, key: string, inc: number) => Promise<void>,
    deps: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsextra: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parseArgsStringToArgv: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        importFresh(path: string): any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        axiosMiddleware: (endpoint: string, data: Record<string, unknown>) => Promise<any>,
        requireFromString: (pluginText: string, relativePath: string) => Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upath: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gracefulfs: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mvdir: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ncp: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        axios: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crudTransDBN: (collection: string, mode: string, docID: string, obj: any) => any,
        configVars: {
            config: {
                serverIP: string,
                serverPort: string,
            }
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installClassicPluginDeps: (deps: string[]) => Promise<any>,
}

export interface IflowTemplate {
    name: string,
    description: string,
    tags: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flowPlugins: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flowEdges: any[],
}
