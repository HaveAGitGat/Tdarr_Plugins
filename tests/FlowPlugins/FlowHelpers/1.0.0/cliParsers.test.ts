import { nvenccParser } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliParsers';

describe('nvenccParser', () => {
  it('parses a full progress line', () => {
    expect(nvenccParser({
      str: '[12.3%] 1234/56789 frames: 45.67 fps, 3200 kbps, remain 0:08:13, est out size 1234.5MB',
    })).toEqual({ percentage: 12.3, fps: 46 });
  });

  it('parses fps before the total frame count is known', () => {
    expect(nvenccParser({
      str: '1234 frames: 136.07 fps, 3200 kbps',
    })).toEqual({ percentage: 0, fps: 136 });
  });

  it('keeps the newest update when one chunk carries several', () => {
    expect(nvenccParser({
      str: '[10.0%] 100/1000 frames: 40.00 fps\r[20.0%] 200/1000 frames: 41.50 fps\r',
    })).toEqual({ percentage: 20, fps: 42 });
  });

  it('ignores the startup banner, which also contains "fps"', () => {
    expect(nvenccParser({
      str: 'Input Info  avsw: yuv420p10le, 3840x2160, 24000/1001 fps',
    })).toEqual({ percentage: 0, fps: 0 });
  });

  it('ignores the final summary, which reads "frames," not "frames:"', () => {
    expect(nvenccParser({
      str: 'encoded 56789 frames, 45.67 fps, 3200.12 kbps, 1234.50 MB',
    })).toEqual({ percentage: 0, fps: 0 });
  });

  it('handles the ANSI escapes present in real output', () => {
    expect(nvenccParser({
      str: '[39m[45.5%] 252/600 frames: 125.48 fps, 714 kbps, GPU 73%, VE 40%',
    })).toEqual({ percentage: 45.5, fps: 125 });
  });

  it('clamps percentage to 100', () => {
    expect(nvenccParser({
      str: '[100.4%] 601/600 frames: 60.00 fps',
    }).percentage).toBe(100);
  });

  it('returns zeros for non-string input', () => {
    expect(nvenccParser({ str: (undefined as unknown as string) })).toEqual({ percentage: 0, fps: 0 });
  });
});
