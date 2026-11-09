/* eslint-disable import/first */
import { createHash } from 'crypto';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const mockLib = { loadDefaultValues: jest.fn((inputs) => inputs) };
jest.mock('../../../../../../methods/lib', () => () => mockLib);

import { plugin, sha256 } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/replaceOriginalFile/1.0.0/index';

const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

const makeArgs = (sourcePath: string, workingPath: string, ownership?: Record<string, unknown>): IpluginInputArgs => ({
  inputs: {},
  variables: { user: ownership ? { replaceOwnership: JSON.stringify(ownership) } : {} },
  inputFileObj: { _id: workingPath, file_size: 1 },
  originalLibraryFile: { _id: sourcePath, file_size: 2 },
  jobLog: jest.fn(),
} as unknown as IpluginInputArgs);

const replaceOwnership = (
  sourcePath: string,
  workingPath: string,
  destinationPath: string,
  root: string,
): Record<string, unknown> => ({
  schema: 'tdarr/file-replacement/v1',
  sourcePath,
  sourceSha256: digest('original'),
  workingPath,
  workingSha256: digest('replacement'),
  destinationPath,
  scratchDir: path.join(path.dirname(sourcePath), '.mmh-test.partial'),
  journalPath: path.join(root, 'journal.json'),
  retainOriginal: true,
});

describe('replaceOriginalFile Plugin', () => {
  let root: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    root = await fsp.mkdtemp(path.join(os.tmpdir(), 'replace-original-'));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsp.rm(root, { recursive: true, force: true });
  });

  it('streams hashes for sparse files larger than 2 GiB', async () => {
    const sparsePath = path.join(root, 'large.mkv');
    await fsp.writeFile(sparsePath, 'x');
    await fsp.truncate(sparsePath, (2 * 1024 * 1024 * 1024) + 1024);

    await expect(sha256(sparsePath)).resolves.toMatch(/^[a-f0-9]{64}$/);
  }, 120000);

  it('returns unchanged files without filesystem work', async () => {
    const sourcePath = path.join(root, 'video.mkv');
    await fsp.writeFile(sourcePath, 'original');
    const args = makeArgs(sourcePath, sourcePath);
    args.inputFileObj.file_size = args.originalLibraryFile.file_size;

    const result = await plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expect(args.jobLog).toHaveBeenCalledWith('File has not changed, no need to replace file');
  });

  it('uses the guarded private journaled directory and retains the owned original', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const ownership = replaceOwnership(sourcePath, workingPath, sourcePath, root);

    await plugin(makeArgs(sourcePath, workingPath, ownership));

    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('replacement');
    await expect(fsp.readFile(path.join(root, '.mmh-test.partial', 'original'), 'utf8')).resolves.toBe('original');
    const journal = await fsp.readFile(path.join(root, 'journal.json'), 'utf8');
    expect(journal).toContain('"retain"');
  });

  it('rejects mismatched, symlinked, and occupied guarded scratch directories', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const ownership = replaceOwnership(sourcePath, workingPath, sourcePath, root);
    ownership.scratchDir = path.join(root, 'other', '.mmh-test.partial');

    await expect(plugin(makeArgs(sourcePath, workingPath, ownership))).rejects.toThrow('unsafe private directory');
    ownership.scratchDir = path.join(root, '.mmh-test.partial');
    await fsp.mkdir(ownership.scratchDir as string);
    await expect(plugin(makeArgs(sourcePath, workingPath, ownership))).rejects.toThrow('private directory already occupied');
    await fsp.rmdir(ownership.scratchDir as string);
    await fsp.symlink(root, ownership.scratchDir as string);
    await expect(plugin(makeArgs(sourcePath, workingPath, ownership))).rejects.toThrow('private directory already occupied');
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('original');
  });

  it('refuses an occupied supplied journal leaf without altering it or media', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    const journalPath = path.join(root, 'journal.json');
    const journalContent = 'pre-existing untrusted journal';
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    await fsp.writeFile(journalPath, journalContent, { mode: 0o600 });

    await expect(plugin(makeArgs(sourcePath, workingPath, replaceOwnership(
      sourcePath, workingPath, sourcePath, root,
    )))).rejects.toThrow('plugin journal path already occupied');
    await expect(fsp.readFile(journalPath, 'utf8')).resolves.toBe(journalContent);
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('original');
    await expect(fsp.readFile(workingPath, 'utf8')).resolves.toBe('replacement');
  });

  it('falls back to exclusive copy when staging crosses filesystems', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const realLink = fsp.link;
    jest.spyOn(fsp, 'link').mockImplementation(async (from, to) => {
      if (path.basename(to.toString()) === 'stage') throw Object.assign(new Error('cross-device'), { code: 'EXDEV' });
      return realLink(from, to);
    });

    await plugin(makeArgs(sourcePath, workingPath, replaceOwnership(sourcePath, workingPath, sourcePath, root)));
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('replacement');
  });

  it('refuses symlink working inputs and same-size changed source bytes', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.symlink(sourcePath, workingPath);
    await expect(plugin(makeArgs(sourcePath, workingPath, replaceOwnership(
      sourcePath, workingPath, sourcePath, root,
    )))).rejects.toThrow('expected regular file');
    await fsp.unlink(workingPath);
    await fsp.writeFile(sourcePath, 'changed!!');
    await fsp.writeFile(workingPath, 'replacement');
    await expect(plugin(makeArgs(sourcePath, workingPath, replaceOwnership(
      sourcePath, workingPath, sourcePath, root,
    )))).rejects.toThrow('source or working file drifted');
  });

  it('rolls back via no-clobber link after publish fails and can restart safely', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const realLink = fsp.link;
    const link = jest.spyOn(fsp, 'link').mockImplementation(async (from, to) => {
      if (path.basename(from.toString()) === 'stage') throw new Error('injected publish failure');
      return realLink(from, to);
    });
    const args = makeArgs(sourcePath, workingPath, replaceOwnership(sourcePath, workingPath, sourcePath, root));

    await expect(plugin(args)).rejects.toThrow('injected publish failure');
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('original');
    await fsp.unlink(path.join(root, 'journal.json'));
    link.mockRestore();
    await fsp.rm(path.join(root, '.mmh-test.partial'), { recursive: true });
    await plugin(args);
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('replacement');
  });

  it('preserves both paths when a late arrival occupies the rollback slot', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    const destinationPath = path.join(root, 'final.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const realLink = fsp.link;
    jest.spyOn(fsp, 'link').mockImplementation(async (from, to) => {
      if (path.basename(to.toString()) === 'stage') return realLink(from, to);
      if (from.toString().endsWith('/stage')) {
        await fsp.writeFile(destinationPath, 'late-final');
      } else {
        await fsp.writeFile(sourcePath, 'late-arr');
      }
      throw Object.assign(new Error('occupied'), { code: 'EEXIST' });
    });
    const args = makeArgs(sourcePath, workingPath, replaceOwnership(sourcePath, workingPath, destinationPath, root));
    await expect(plugin(args)).rejects.toThrow('RECOVERY_REQUIRED: publish and rollback occupants preserved');
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('late-arr');
    await expect(fsp.readFile(destinationPath, 'utf8')).resolves.toBe('late-final');
    await expect(fsp.readFile(path.join(root, '.mmh-test.partial', 'original'), 'utf8')).resolves.toBe('original');
    expect(args.jobLog).toHaveBeenCalledWith(expect.stringContaining('RECOVERY_REQUIRED'));
    expect(await fsp.readFile(path.join(root, 'journal.json'), 'utf8')).toContain('preserved-both-occupants');
  });

  it('journals an unexpected aside race and preserves a late original-slot arrival', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    const realRename = fsp.rename;
    jest.spyOn(fsp, 'rename').mockImplementation(async (from, to) => {
      await realRename(from, to);
      if (path.basename(to.toString()) === 'original') await fsp.writeFile(to, 'late-arr');
    });

    await expect(plugin(makeArgs(sourcePath, workingPath, replaceOwnership(
      sourcePath, workingPath, sourcePath, root,
    )))).rejects.toThrow('unexpected bytes moved aside');
    await expect(fsp.readFile(sourcePath, 'utf8')).resolves.toBe('late-arr');
    expect(await fsp.readFile(path.join(root, 'journal.json'), 'utf8')).toContain('"restore"');
  });

  it('refuses a guarded restart with a pre-existing private aside without touching it', async () => {
    const sourcePath = path.join(root, 'video.mp4');
    const workingPath = path.join(root, 'working.mkv');
    const scratchDir = path.join(root, '.mmh-test.partial');
    await fsp.writeFile(sourcePath, 'original');
    await fsp.writeFile(workingPath, 'replacement');
    await fsp.mkdir(scratchDir);
    await fsp.writeFile(path.join(scratchDir, 'original'), 'original');

    await expect(plugin(makeArgs(sourcePath, workingPath, replaceOwnership(
      sourcePath, workingPath, sourcePath, root,
    )))).rejects.toThrow('private directory already occupied');
    await expect(fsp.readFile(path.join(scratchDir, 'original'), 'utf8')).resolves.toBe('original');
  });

  it('publishes standalone work when the original is absent and retires all private artifacts', async () => {
    const sourcePath = path.join(root, 'missing.mp4');
    const cacheDirectory = path.join(root, 'cache');
    const workingPath = path.join(cacheDirectory, 'working.mkv');
    await fsp.mkdir(cacheDirectory);
    await fsp.writeFile(workingPath, 'replacement');

    const result = await plugin(makeArgs(sourcePath, workingPath));

    await expect(fsp.readFile(result.outputFileObj._id, 'utf8')).resolves.toBe('replacement');
    expect((await fsp.readdir(root)).filter((entry) => entry.startsWith('.mmh-'))).toEqual([]);
  });
});
