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
          'workingFile',
        ],
      },
      tooltip: 'Choose how to set numeric file permissions. workingFile leaves the target file permissions unchanged.',
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
          'workingFile',
        ],
      },
      tooltip: 'Choose how to set the owner/group. workingFile leaves the target file owner/group unchanged.',
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

type PermissionSource = 'originalFile' | 'custom' | 'workingFile';
type OwnerGroupSource = 'originalFile' | 'custom' | 'workingFile';

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

  if (user && group) {
    return `${user}:${group}`;
  }

  if (group) {
    return `:${group}`;
  }

  return user;
};

const getFilePathToUpdate = (args: IpluginInputArgs, fileToUpdate: string): string => {
  if (fileToUpdate === 'workingFile') {
    return args.inputFileObj._id;
  }

  if (fileToUpdate === 'originalFile') {
    return args.originalLibraryFile._id;
  }

  throw new Error(`Invalid file to update: ${fileToUpdate}`);
};

const parsePermissionSource = (permissionSource: string): PermissionSource => {
  if (
    permissionSource === 'originalFile'
    || permissionSource === 'custom'
    || permissionSource === 'workingFile'
  ) {
    return permissionSource;
  }

  throw new Error(`Invalid permissions source: ${permissionSource}`);
};

const parseOwnerGroupSource = (ownerGroupSource: string): OwnerGroupSource => {
  if (
    ownerGroupSource === 'originalFile'
    || ownerGroupSource === 'custom'
    || ownerGroupSource === 'workingFile'
  ) {
    return ownerGroupSource;
  }

  throw new Error(`Invalid owner/group source: ${ownerGroupSource}`);
};

const applyCustomFilePermissions = async (args: IpluginInputArgs, filePath: string): Promise<void> => {
  const customMode = parseCustomMode(String(args.inputs.customPermissions));
  args.jobLog(`Setting custom permissions: ${formatMode(customMode)}`);
  await fsp.chmod(filePath, customMode);
};

const applyOriginalFilePermissions = async (args: IpluginInputArgs, filePath: string): Promise<void> => {
  const originalMode = getOriginalMode(args);

  args.jobLog(`Setting permissions to match original file: ${formatMode(originalMode)}`);
  await fsp.chmod(filePath, originalMode);
};

const applyCustomOwnerGroup = async (args: IpluginInputArgs, filePath: string): Promise<void> => {
  const ownerSpec = getCustomOwnerSpec(
    String(args.inputs.customUser),
    String(args.inputs.customGroup),
  );

  if (ownerSpec) {
    args.jobLog(`Setting custom owner/group: ${ownerSpec}`);
    await execFileAsync('chown', [ownerSpec, filePath]);
  } else {
    args.jobLog('Skipping custom owner/group because user and group are blank');
  }
};

const applyOriginalOwnerGroup = async (args: IpluginInputArgs, filePath: string): Promise<void> => {
  const { uid, gid } = getOriginalOwnership(args);

  args.jobLog(`Setting owner/group to match original file: ${uid}:${gid}`);
  await fsp.chown(filePath, uid, gid);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const fileToUpdate = String(args.inputs.fileToUpdate);
  const filePath = getFilePathToUpdate(args, fileToUpdate);
  const permissionSource = parsePermissionSource(String(args.inputs.permissionSource));
  const ownerGroupSource = parseOwnerGroupSource(String(args.inputs.ownerGroupSource));

  args.jobLog(`Updating ${fileToUpdate}: ${filePath}`);

  if (permissionSource === 'custom') {
    await applyCustomFilePermissions(args, filePath);
  } else if (permissionSource === 'originalFile') {
    await applyOriginalFilePermissions(args, filePath);
  } else if (permissionSource === 'workingFile') {
    args.jobLog('Leaving working file permissions unchanged');
  }

  if (ownerGroupSource === 'custom') {
    await applyCustomOwnerGroup(args, filePath);
  } else if (ownerGroupSource === 'originalFile') {
    await applyOriginalOwnerGroup(args, filePath);
  } else if (ownerGroupSource === 'workingFile') {
    args.jobLog('Leaving working file owner/group unchanged');
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
