import { execFile } from 'child_process';
import { promises as fsp } from 'fs';
import { promisify } from 'util';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginInputUi,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

const customPermissionsDisplayConditions: IpluginInputUi['displayConditions'] = {
  logic: 'AND',
  sets: [
    {
      logic: 'AND',
      inputs: [
        {
          name: 'permissionSource',
          value: 'custom',
          condition: '===',
        },
      ],
    },
  ],
};

const customOwnerGroupDisplayConditions: IpluginInputUi['displayConditions'] = {
  logic: 'AND',
  sets: [
    {
      logic: 'AND',
      inputs: [
        {
          name: 'ownerGroupSource',
          value: 'custom',
          condition: '===',
        },
      ],
    },
  ],
};

const details = (): IpluginDetails => ({
  name: 'Set File Permissions',
  description: 'Set the working or original file permissions and owner/group.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faFile',
  inputs: [
    {
      label: 'File To Update',
      name: 'fileToUpdate',
      type: 'string',
      defaultValue: 'workingFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'workingFile',
          'originalFile',
        ],
      },
      tooltip: 'Specify the file to update.',
    },
    {
      label: 'Permissions Source',
      name: 'permissionSource',
      type: 'string',
      defaultValue: 'originalFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'originalFile',
          'custom',
          'unchanged',
        ],
      },
      tooltip: 'Choose how to set numeric file permissions. Select unchanged to leave the target unchanged.',
    },
    {
      label: 'Custom Permissions',
      name: 'customPermissions',
      type: 'string',
      defaultValue: '664',
      inputUI: {
        type: 'text',
        displayConditions: customPermissionsDisplayConditions,
      },
      tooltip: 'Specify custom permissions as an octal value such as 664, 775, or 1777.',
    },
    {
      label: 'Owner/Group Source',
      name: 'ownerGroupSource',
      type: 'string',
      defaultValue: 'originalFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'originalFile',
          'custom',
          'unchanged',
        ],
      },
      tooltip: 'Choose how to set the owner/group. Select unchanged to leave the target unchanged. '
        + 'Owner/group changes are skipped on Windows.',
    },
    {
      label: 'Custom User',
      name: 'customUser',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
        displayConditions: customOwnerGroupDisplayConditions,
      },
      tooltip: 'Specify the user name or numeric uid. Leave blank to keep the current user.',
    },
    {
      label: 'Custom Group',
      name: 'customGroup',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
        displayConditions: customOwnerGroupDisplayConditions,
      },
      tooltip: 'Specify the group name or numeric gid. Leave blank to keep the current group.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const execFileAsync = promisify(execFile);

type StatValues = {
  mode?: unknown,
  uid?: unknown,
  gid?: unknown,
};

type MetadataSource = 'originalFile' | 'custom' | 'unchanged';
type FileToUpdate = 'originalFile' | 'workingFile';

type PermissionAction = {
  type: 'set',
  source: 'originalFile' | 'custom',
  mode: number,
} | {
  type: 'skip',
  logMessage: string,
};

type OwnerGroupAction = {
  type: 'setOriginal',
  uid: number,
  gid: number,
} | {
  type: 'setCustom',
  ownerSpec: string,
} | {
  type: 'skip',
  logMessage: string,
};

const fileTypeModeModulo = 0o10000;

const isInteger = (value: unknown): value is number => (
  typeof value === 'number'
  && value !== Infinity
  && value !== -Infinity
  && !Number.isNaN(value)
  && Math.floor(value) === value
);

const formatMode = (mode: number): string => mode.toString(8);

const getOriginalStatValues = (args: IpluginInputArgs): StatValues => (
  (args.originalLibraryFile.statSync || {}) as unknown as StatValues
);

const getOriginalMode = (args: IpluginInputArgs): number => {
  const { mode } = getOriginalStatValues(args);

  if (!isInteger(mode)) {
    throw new Error('Original file stat data does not include a valid mode.');
  }

  return mode % fileTypeModeModulo;
};

const getOriginalOwnership = (args: IpluginInputArgs): { uid: number, gid: number } => {
  const { uid, gid } = getOriginalStatValues(args);

  if (!isInteger(uid) || !isInteger(gid)) {
    throw new Error('Original file stat data does not include a valid uid/gid.');
  }

  return { uid, gid };
};

const parseCustomMode = (customPermissions: string): number => {
  const normalizedPermissions = customPermissions.trim().replace(/^0o/i, '');

  if (!/^[0-7]{3,4}$/.test(normalizedPermissions)) {
    throw new Error('Custom permissions must be an octal value such as 664, 775, or 1777.');
  }

  return parseInt(normalizedPermissions, 8);
};

const validateOwnershipInput = (value: string, label: string): void => {
  if (value.includes(':')) {
    throw new Error(`${label} cannot contain ':'. Enter the user and group in separate inputs.`);
  }
};

const getCustomOwnerSpec = (customUser: string, customGroup: string): string => {
  const user = customUser.trim();
  const group = customGroup.trim();

  validateOwnershipInput(user, 'Custom user');
  validateOwnershipInput(group, 'Custom group');

  if (user.startsWith('-')) {
    throw new Error("Custom owner/group cannot start with '-' because chown can parse it as an option.");
  }

  if (user && group) {
    return `${user}:${group}`;
  }

  if (group) {
    return `:${group}`;
  }

  return user;
};

const parseFileToUpdate = (fileToUpdate: string): FileToUpdate => {
  if (
    fileToUpdate === 'workingFile'
    || fileToUpdate === 'originalFile'
  ) {
    return fileToUpdate;
  }

  throw new Error(`Invalid file to update: ${fileToUpdate}`);
};

const getFilePathToUpdate = (args: IpluginInputArgs, fileToUpdate: FileToUpdate): string => {
  if (fileToUpdate === 'workingFile') {
    return args.inputFileObj._id;
  }

  return args.originalLibraryFile._id;
};

const getFileToUpdateLogLabel = (fileToUpdate: FileToUpdate): string => {
  if (fileToUpdate === 'workingFile') {
    return 'working file';
  }

  return 'original file';
};

const parseMetadataSource = (source: string, label: string): MetadataSource => {
  if (
    source === 'originalFile'
    || source === 'custom'
    || source === 'unchanged'
  ) {
    return source;
  }

  throw new Error(`Invalid ${label} source: ${source}`);
};

const resolvePermissionAction = (
  args: IpluginInputArgs,
  permissionSource: MetadataSource,
  fileToUpdate: FileToUpdate,
): PermissionAction => {
  if (permissionSource === 'custom') {
    return {
      type: 'set',
      source: 'custom',
      mode: parseCustomMode(String(args.inputs.customPermissions)),
    };
  }

  if (permissionSource === 'originalFile') {
    return {
      type: 'set',
      source: 'originalFile',
      mode: getOriginalMode(args),
    };
  }

  return {
    type: 'skip',
    logMessage: `Leaving ${getFileToUpdateLogLabel(fileToUpdate)} permissions unchanged`,
  };
};

const resolveOwnerGroupAction = (
  args: IpluginInputArgs,
  ownerGroupSource: MetadataSource,
  fileToUpdate: FileToUpdate,
): OwnerGroupAction => {
  const isWindows = args.platform === 'win32';

  if (ownerGroupSource === 'unchanged') {
    return {
      type: 'skip',
      logMessage: `Leaving ${getFileToUpdateLogLabel(fileToUpdate)} owner/group unchanged`,
    };
  }

  if (ownerGroupSource === 'custom') {
    const customUser = String(args.inputs.customUser);
    const customGroup = String(args.inputs.customGroup);

    if (!customUser.trim() && !customGroup.trim()) {
      return {
        type: 'skip',
        logMessage: 'Skipping custom owner/group because user and group are blank',
      };
    }

    if (isWindows) {
      return {
        type: 'skip',
        logMessage: 'Skipping custom owner/group on Windows because changing file ownership is not supported',
      };
    }

    const ownerSpec = getCustomOwnerSpec(
      customUser,
      customGroup,
    );

    return {
      type: 'setCustom',
      ownerSpec,
    };
  }

  if (isWindows) {
    return {
      type: 'skip',
      logMessage: 'Skipping original file owner/group on Windows because changing file ownership is not supported',
    };
  }

  const { uid, gid } = getOriginalOwnership(args);

  return {
    type: 'setOriginal',
    uid,
    gid,
  };
};

const applyFilePermissions = async (
  args: IpluginInputArgs,
  filePath: string,
  action: PermissionAction,
): Promise<void> => {
  if (action.type === 'skip') {
    args.jobLog(action.logMessage);
    return;
  }

  if (action.source === 'custom') {
    args.jobLog(`Setting custom permissions: ${formatMode(action.mode)}`);
  } else {
    args.jobLog(`Setting permissions to match original file: ${formatMode(action.mode)}`);
  }

  await fsp.chmod(filePath, action.mode);
};

const applyOwnerGroup = async (
  args: IpluginInputArgs,
  filePath: string,
  action: OwnerGroupAction,
): Promise<void> => {
  if (action.type === 'skip') {
    args.jobLog(action.logMessage);
    return;
  }

  if (action.type === 'setCustom') {
    args.jobLog(`Setting custom owner/group: ${action.ownerSpec}`);
    await execFileAsync('chown', [action.ownerSpec, filePath]);
    return;
  }

  args.jobLog(`Setting owner/group to match original file: ${action.uid}:${action.gid}`);
  await fsp.chown(filePath, action.uid, action.gid);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const fileToUpdate = parseFileToUpdate(String(args.inputs.fileToUpdate));
  const filePath = getFilePathToUpdate(args, fileToUpdate);
  const permissionSource = parseMetadataSource(String(args.inputs.permissionSource), 'permissions');
  const ownerGroupSource = parseMetadataSource(String(args.inputs.ownerGroupSource), 'owner/group');
  const permissionAction = resolvePermissionAction(args, permissionSource, fileToUpdate);
  const ownerGroupAction = resolveOwnerGroupAction(args, ownerGroupSource, fileToUpdate);

  args.jobLog(`Updating ${fileToUpdate}: ${filePath}`);

  await applyOwnerGroup(args, filePath, ownerGroupAction);
  await applyFilePermissions(args, filePath, permissionAction);

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
