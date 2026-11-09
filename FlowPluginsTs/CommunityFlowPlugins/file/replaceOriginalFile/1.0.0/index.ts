import { createHash, randomBytes } from 'crypto';
import { constants, createReadStream, promises as fsp } from 'fs';
import path from 'path';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

interface IReplaceOwnership {
  schema: 'tdarr/file-replacement/v1',
  sourcePath: string,
  sourceSha256: string,
  workingPath: string,
  workingSha256: string,
  destinationPath: string,
  scratchDir: string,
  journalPath: string,
  retainOriginal: boolean,
}

interface IReplacementJournal {
  schema: 'tdarr/file-replacement-journal/v1',
  actions: Array<Record<string, unknown>>,
}

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Replace Original File',
  description: `
  This plugin will replace the original file with the new file. It should be used in the last stages of the flow.
  It is important to remember that the original file will be replaced and therefore will be lost.
  `,
  style: { borderColor: 'green' },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [],
  outputs: [{ number: 1, tooltip: 'Continue to next plugin' }],
});

const sha256 = async (filePath: string): Promise<string> => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const input = createReadStream(filePath);
  input.on('error', reject);
  input.on('data', (chunk: Buffer) => hash.update(chunk));
  input.on('end', () => resolve(hash.digest('hex')));
});

const isMissing = (error: unknown): boolean => (
  typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT'
);

const errorCode = (error: unknown): string | undefined => (
  typeof error === 'object' && error !== null ? (error as NodeJS.ErrnoException).code : undefined
);

const refuse = (message: string): never => {
  throw new Error(`RECOVERY_REQUIRED: ${message}`);
};

const assertRegularFile = async (filePath: string): Promise<void> => {
  const stat = await fsp.lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) refuse(`expected regular file at ${filePath}`);
};

const assertAbsent = async (filePath: string): Promise<void> => {
  try {
    await fsp.lstat(filePath);
    refuse(`refusing occupied path ${filePath}`);
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
};
const assertJournalTarget = async (journalPath: string): Promise<void> => {
  try {
    await fsp.lstat(journalPath);
    refuse(`plugin journal path already occupied at ${journalPath}`);
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
};


const copyExclusive = async (sourcePath: string, destinationPath: string): Promise<void> => {
  await fsp.copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
  const destination = await fsp.open(destinationPath, 'r');
  try {
    await destination.sync();
  } finally {
    await destination.close();
  }
};

const stageExclusive = async (sourcePath: string, stagePath: string): Promise<void> => {
  try {
    await fsp.link(sourcePath, stagePath);
  } catch (error) {
    if (errorCode(error) === 'EXDEV') {
      await copyExclusive(sourcePath, stagePath);
      return;
    }
    throw error;
  }
};

const writeJournal = async (journalPath: string, journal: IReplacementJournal): Promise<void> => {
  const directory = path.dirname(journalPath);
  const temporary = path.join(directory, `.${path.basename(journalPath)}.${randomBytes(8).toString('hex')}`);
  const file = await fsp.open(temporary, 'wx', 0o600);
  try {
    await file.writeFile(`${JSON.stringify(journal)}\n`, 'utf8');
    await file.sync();
  } finally {
    await file.close();
  }
  await fsp.rename(temporary, journalPath);
  const parent = await fsp.open(directory, 'r');
  try {
    await parent.sync();
  } catch (error) {
    if (!['EINVAL', 'ENOTSUP'].includes(errorCode(error) ?? '')) throw error;
  } finally {
    await parent.close();
  }
};

const appendJournal = async (
  journalPath: string,
  journal: IReplacementJournal,
  action: Record<string, unknown>,
): Promise<void> => {
  journal.actions.push({ ...action, at: new Date().toISOString() });
  await writeJournal(journalPath, journal);
};

const ownershipFrom = (args: IpluginInputArgs): IReplaceOwnership | undefined => {
  const raw = args.variables.user.replaceOwnership;
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    refuse('replaceOwnership is not JSON');
  }
  const value = parsed as Partial<IReplaceOwnership>;
  if (value.schema !== 'tdarr/file-replacement/v1'
    || typeof value.sourcePath !== 'string'
    || typeof value.sourceSha256 !== 'string'
    || typeof value.workingPath !== 'string'
    || typeof value.workingSha256 !== 'string'
    || typeof value.destinationPath !== 'string'
    || typeof value.scratchDir !== 'string'
    || typeof value.journalPath !== 'string'
    || value.retainOriginal !== true) {
    refuse('replaceOwnership is incomplete or unsafe');
  }
  return value as IReplaceOwnership;
};

const privateDirectory = async (sourcePath: string, ownership: IReplaceOwnership | undefined): Promise<string> => {
  const parent = path.dirname(sourcePath);
  const privatePath = ownership?.scratchDir
    ?? path.join(parent, `.mmh-${randomBytes(16).toString('hex')}.partial`);
  if (path.dirname(privatePath) !== parent || !/^\.mmh-[A-Za-z0-9_-]+\.partial$/.test(path.basename(privatePath))) {
    refuse(`unsafe private directory ${privatePath}`);
  }
  try {
    await fsp.mkdir(privatePath, { mode: 0o700 });
  } catch (error) {
    if (errorCode(error) === 'EEXIST') refuse(`private directory already occupied at ${privatePath}`);
    throw error;
  }
  const stat = await fsp.lstat(privatePath);
  if (!stat.isDirectory() || stat.isSymbolicLink()
    || (process.platform !== 'win32' && (stat.mode & 0o077) !== 0)) {
    refuse(`unsafe private directory ${privatePath}`);
  }
  return privatePath;
};

const restoreNoClobber = async (
  asidePath: string,
  sourcePath: string,
  sourceHash: string,
  journalPath: string,
  journal: IReplacementJournal,
  operation: 'restore' | 'rollback',
): Promise<boolean> => {
  await appendJournal(journalPath, journal, {
    operation, sourcePath: asidePath, destinationPath: sourcePath, expectedHash: sourceHash, state: 'intent',
  });
  try {
    await fsp.link(asidePath, sourcePath);
  } catch (error) {
    await appendJournal(journalPath, journal, {
      operation, destinationPath: sourcePath, state: errorCode(error) === 'EEXIST' ? 'occupied' : 'failed', error: String(error),
    });
    return false;
  }
  if (await sha256(sourcePath) !== sourceHash) {
    await appendJournal(journalPath, journal, { operation, destinationPath: sourcePath, state: 'hash-mismatch' });
    return false;
  }
  await fsp.unlink(asidePath);
  await appendJournal(journalPath, journal, { operation, destinationPath: sourcePath, state: 'complete' });
  return true;
};

const safeReplace = async (args: IpluginInputArgs, ownership: IReplaceOwnership | undefined): Promise<string> => {
  const sourcePath = ownership?.sourcePath ?? args.originalLibraryFile._id;
  const workingPath = ownership?.workingPath ?? args.inputFileObj._id;
  const extension = path.extname(args.inputFileObj._id);
  const destinationPath = ownership?.destinationPath
    ?? path.join(path.dirname(sourcePath), `${path.basename(args.inputFileObj._id, extension)}${extension}`);
  const originalExists = await fsp.lstat(sourcePath).then(() => true).catch((error: unknown) => {
    if (isMissing(error)) return false;
    throw error;
  });

  if (path.dirname(destinationPath) !== path.dirname(sourcePath)) refuse('destination must be a sibling of the original');
  if (ownership && !originalExists) refuse(`guarded original is missing at ${sourcePath}`);
  if (originalExists) await assertRegularFile(sourcePath);
  await assertRegularFile(workingPath);
  const sourceHash = originalExists ? (ownership?.sourceSha256 ?? await sha256(sourcePath)) : undefined;
  const workingHash = ownership?.workingSha256 ?? await sha256(workingPath);
  if ((sourceHash && await sha256(sourcePath) !== sourceHash) || await sha256(workingPath) !== workingHash) {
    refuse('source or working file drifted before staging');
  }
  if (destinationPath !== sourcePath) await assertAbsent(destinationPath);
  if (ownership) await assertJournalTarget(ownership.journalPath);

  const privatePath = await privateDirectory(sourcePath, ownership);
  const stagePath = path.join(privatePath, 'stage');
  const asidePath = path.join(privatePath, 'original');
  const journalPath = ownership?.journalPath ?? path.join(privatePath, 'replacement.json');
  const journal: IReplacementJournal = { schema: 'tdarr/file-replacement-journal/v1', actions: [] };
  await appendJournal(journalPath, journal, {
    operation: 'stage', sourcePath: workingPath, destinationPath: stagePath, expectedHash: workingHash, state: 'intent',
  });
  await stageExclusive(workingPath, stagePath);
  if (await sha256(stagePath) !== workingHash) refuse('staged output hash mismatch');
  await appendJournal(journalPath, journal, { operation: 'stage', destinationPath: stagePath, state: 'complete' });

  if (sourceHash) {
    await appendJournal(journalPath, journal, {
      operation: 'aside', sourcePath, destinationPath: asidePath, expectedHash: sourceHash, state: 'intent',
    });
    await fsp.rename(sourcePath, asidePath);
    const movedHash = await sha256(asidePath);
    if (movedHash !== sourceHash) {
      await appendJournal(journalPath, journal, {
        operation: 'aside', destinationPath: asidePath, actualHash: movedHash, state: 'unexpected',
      });
      const restored = await restoreNoClobber(asidePath, sourcePath, movedHash, journalPath, journal, 'restore');
      if (!restored) args.jobLog(`RECOVERY_REQUIRED: unexpected bytes preserved at ${asidePath}`);
      refuse(`unexpected bytes moved aside to ${asidePath}`);
    }
    await appendJournal(journalPath, journal, { operation: 'aside', destinationPath: asidePath, state: 'complete' });
  }

  await appendJournal(journalPath, journal, {
    operation: 'publish', sourcePath: stagePath, destinationPath, expectedHash: workingHash, state: 'intent',
  });
  try {
    await fsp.link(stagePath, destinationPath);
  } catch (error) {
    await appendJournal(journalPath, journal, {
      operation: 'publish', destinationPath, state: errorCode(error) === 'EEXIST' ? 'occupied' : 'failed', error: String(error),
    });
    if (sourceHash) {
      const restored = await restoreNoClobber(asidePath, sourcePath, sourceHash, journalPath, journal, 'rollback');
      if (!restored) {
        await appendJournal(journalPath, journal, {
          operation: 'recovery-required',
          sourcePath,
          destinationPath,
          asidePath,
          state: 'preserved-both-occupants',
        });
        args.jobLog(`RECOVERY_REQUIRED: publish occupant at ${destinationPath}; original occupant at ${sourcePath}; aside preserved at ${asidePath}`);
        refuse(`publish and rollback occupants preserved at ${destinationPath}, ${sourcePath}, and ${asidePath}`);
      }
    }
    throw error;
  }
  if (await sha256(destinationPath) !== workingHash) refuse(`published output hash mismatch at ${destinationPath}`);
  await appendJournal(journalPath, journal, { operation: 'publish', destinationPath, state: 'complete' });

  if (ownership) {
    await appendJournal(journalPath, journal, { operation: 'retain', destinationPath: asidePath, state: 'complete' });
  } else {
    if (sourceHash && await sha256(asidePath) !== sourceHash) refuse(`standalone aside drifted at ${asidePath}`);
    if (sourceHash) await fsp.unlink(asidePath);
    if (await sha256(stagePath) !== workingHash) refuse(`standalone stage drifted at ${stagePath}`);
    await appendJournal(journalPath, journal, { operation: 'retire', destinationPath: privatePath, state: 'complete' });
    await fsp.unlink(stagePath);
    await fsp.unlink(journalPath);
    await fsp.rmdir(privatePath);
  }
  return destinationPath;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  if (args.inputFileObj._id === args.originalLibraryFile._id
    && args.inputFileObj.file_size === args.originalLibraryFile.file_size) {
    args.jobLog('File has not changed, no need to replace file');
    return { outputFileObj: args.inputFileObj, outputNumber: 1, variables: args.variables };
  }
  const destinationPath = await safeReplace(args, ownershipFrom(args));
  return { outputFileObj: { _id: destinationPath }, outputNumber: 1, variables: args.variables };
};

export { details, plugin, sha256 };
