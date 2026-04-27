import fs from 'fs';
import os from 'os';
import path from 'path';

import { CLI } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

type LiveSizeCompare = NonNullable<IpluginInputArgs['variables']['liveSizeCompare']>;

// Use a tiny input size so the temp output file stays small.
// CLI math: ratio = (estSize / inputGB) * 100, estSize = outputGB * 100 / perc
// so outputBytes needed for ratio R at progress P = inputBytes * R * P / 10000.
// file_size on inputFileObj is in MB; 1/1024 MB = 1 KB.
const INPUT_MB = 1 / 1024;
const INPUT_BYTES = 1024;

const bytesForRatio = (ratioPerc: number, progressPerc: number) => (
  Math.round((INPUT_BYTES * ratioPerc * progressPerc) / 10000)
);

interface Fixture {
  cli: CLI;
  jobLog: jest.Mock;
  killThread: jest.Mock;
  liveSizeCompare: LiveSizeCompare;
}

const pendingCleanups: Array<() => void> = [];

const makeFixture = (options: {
  outputBytes: number;
  liveSizeCompare?: Partial<LiveSizeCompare>;
  startedSecondsAgo?: number;
}): Fixture => {
  const {
    outputBytes,
    liveSizeCompare: overrides = {},
    startedSecondsAgo = 10,
  } = options;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cliUtils-test-'));
  const outputFilePath = path.join(tmpDir, 'output.mkv');
  fs.writeFileSync(outputFilePath, Buffer.alloc(outputBytes));
  pendingCleanups.push(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const liveSizeCompare: LiveSizeCompare = {
    enabled: true,
    compareMethod: 'estimatedFinalSize',
    thresholdPerc: 60,
    lowerThresholdPerc: 20,
    checkDelaySeconds: 0,
    error: false,
    errorType: '',
    ...overrides,
  };

  const jobLog = jest.fn();
  const killThread = jest.fn();

  const config = {
    cli: 'ffmpeg',
    spawnArgs: [],
    spawnOpts: {},
    jobLog,
    outputFilePath,
    updateWorker: jest.fn(),
    logFullCliOutput: false,
    inputFileObj: { file_size: INPUT_MB } as IpluginInputArgs['inputFileObj'],
    args: {
      variables: { liveSizeCompare },
    } as unknown as IpluginInputArgs,
  };

  const cli = new CLI(config);
  cli.killThread = killThread;
  // Seed progress state so updateETA treats this as a subsequent tick, not the first one.
  cli.lastProgCheck = Date.now() - 10_000;
  cli.oldProgress = 10;
  cli.startTime = Date.now() - startedSecondsAgo * 1000;

  return {
    cli, jobLog, killThread, liveSizeCompare,
  };
};

describe('CLI', () => {
  afterEach(() => {
    while (pendingCleanups.length > 0) {
      try {
        pendingCleanups.pop()?.();
      } catch {
        // best-effort cleanup
      }
    }
  });

  describe('liveSizeCompare (estimatedFinalSize)', () => {
    it('should set errorType to upperThreshold when estimated size exceeds upper bound', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(100, 50),
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(true);
      expect(fixture.liveSizeCompare.errorType).toBe('upperThreshold');
      expect(fixture.killThread).toHaveBeenCalled();
      expect(fixture.cli.cancelled).toBe(true);
      expect(fixture.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Ratio is greater than threshold: 60%'),
      );
    });

    it('should set errorType to lowerThreshold when estimated size falls below lower bound', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(10, 50),
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(true);
      expect(fixture.liveSizeCompare.errorType).toBe('lowerThreshold');
      expect(fixture.killThread).toHaveBeenCalled();
      expect(fixture.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Ratio is less than lower threshold: 20%'),
      );
    });

    it('should not trigger when ratio is between bounds', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(40, 50),
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(false);
      expect(fixture.liveSizeCompare.errorType).toBe('');
      expect(fixture.killThread).not.toHaveBeenCalled();
    });

    it('should disable lower bound check when lowerThresholdPerc is 0', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(10, 50),
        liveSizeCompare: { lowerThresholdPerc: 0 },
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(false);
      expect(fixture.liveSizeCompare.errorType).toBe('');
    });
  });

  describe('liveSizeCompare (currentSize)', () => {
    it('should skip lower bound check even when current size is tiny', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(5, 100),
        liveSizeCompare: { compareMethod: 'currentSize' },
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(false);
      expect(fixture.liveSizeCompare.errorType).toBe('');
    });

    it('should set errorType to upperThreshold when current size exceeds upper bound', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(70, 100),
        liveSizeCompare: { compareMethod: 'currentSize' },
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(true);
      expect(fixture.liveSizeCompare.errorType).toBe('upperThreshold');
    });
  });

  describe('liveSizeCompare (guards)', () => {
    it('should do nothing when liveSizeCompare is disabled', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(100, 50),
        liveSizeCompare: { enabled: false },
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(false);
      expect(fixture.liveSizeCompare.errorType).toBe('');
      expect(fixture.killThread).not.toHaveBeenCalled();
    });

    it('should do nothing before checkDelaySeconds has elapsed', async () => {
      const fixture = makeFixture({
        outputBytes: bytesForRatio(100, 50),
        startedSecondsAgo: 1,
        liveSizeCompare: { checkDelaySeconds: 60 },
      });

      await fixture.cli.updateETA(50);

      expect(fixture.liveSizeCompare.error).toBe(false);
      expect(fixture.liveSizeCompare.errorType).toBe('');
      expect(fixture.killThread).not.toHaveBeenCalled();
    });
  });
});
