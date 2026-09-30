import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkDolbyVision/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

// DOVI configuration records as reported by FFprobe 8.x for real files.
const doviRecord = (
  profile: number,
  compat: number,
  el: number,
  bl = 1,
) => ({
  side_data_type: 'DOVI configuration record',
  dv_version_major: 1,
  dv_version_minor: 0,
  dv_profile: profile,
  dv_level: 6,
  rpu_present_flag: 1,
  el_present_flag: el,
  bl_present_flag: bl,
  dv_bl_signal_compatibility_id: compat,
  dv_md_compression: 'none',
});

describe('checkDolbyVision Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let video: Istreams;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH265)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
    [video] = baseArgs.inputFileObj.ffProbeData.streams as Istreams[];
  });

  it('should route files without Dolby Vision to output 5 (H265 sample)', () => {
    const result = plugin(baseArgs);
    expect(result.outputNumber).toBe(5);
    expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
  });

  it('should route files without Dolby Vision to output 5 (H264 sample)', () => {
    baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264));
    expect(plugin(baseArgs).outputNumber).toBe(5);
  });

  it('should ignore HDR10 side data that is not a DOVI record', () => {
    video.side_data_list = [
      { side_data_type: 'Mastering display metadata', max_luminance: '1000/1' },
      { side_data_type: 'Content light level metadata', max_content: 1000, max_average: 400 },
    ];
    expect(plugin(baseArgs).outputNumber).toBe(5);
  });

  it('should detect profile 5', () => {
    video.side_data_list = [doviRecord(5, 0, 0)];
    expect(plugin(baseArgs).outputNumber).toBe(1);
  });

  it('should detect profile 7 (single track, BL+EL+RPU)', () => {
    video.side_data_list = [doviRecord(7, 6, 1)];
    const result = plugin(baseArgs);
    expect(result.outputNumber).toBe(2);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('enhancement layer present'),
    );
  });

  it('should detect profile 7 when the EL and RPU are in a separate video track', () => {
    // UHD Blu-ray remux layout: 2160p base layer with no DV record, followed by a
    // 1080p enhancement layer track that carries the record (bl_present_flag 0).
    const streams = baseArgs.inputFileObj.ffProbeData.streams as Istreams[];
    const elTrack = {
      ...JSON.parse(JSON.stringify(video)),
      index: streams.length,
      width: 1920,
      height: 1080,
      side_data_list: [doviRecord(7, 6, 1, 0)],
    };
    streams.push(elTrack);
    expect(plugin(baseArgs).outputNumber).toBe(2);
  });

  it('should detect profile 8', () => {
    video.side_data_list = [doviRecord(8, 1, 0)];
    const result = plugin(baseArgs);
    expect(result.outputNumber).toBe(3);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('compatibility id 1, enhancement layer absent'),
    );
  });

  it('should route AV1 profile 10 to output 4', () => {
    video.codec_name = 'av1';
    video.side_data_list = [doviRecord(10, 1, 0)];
    expect(plugin(baseArgs).outputNumber).toBe(4);
  });

  it('should route an MP4 Dolby Vision codec tag without a record to output 4', () => {
    video.codec_tag_string = 'dvh1';
    expect(plugin(baseArgs).outputNumber).toBe(4);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('profile unknown'));
  });

  it('should route a DOVI record without a profile to output 4', () => {
    video.side_data_list = [{ side_data_type: 'DOVI configuration record' }];
    expect(plugin(baseArgs).outputNumber).toBe(4);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('profile unknown'));
  });

  it('should prefer the DOVI record over the codec tag', () => {
    video.codec_tag_string = 'dvhe';
    video.side_data_list = [doviRecord(5, 0, 0)];
    expect(plugin(baseArgs).outputNumber).toBe(1);
  });

  it('should not treat audio side data as Dolby Vision', () => {
    const streams = baseArgs.inputFileObj.ffProbeData.streams as Istreams[];
    streams.push({
      index: streams.length,
      codec_name: 'eac3',
      codec_type: 'audio',
      side_data_list: [doviRecord(8, 1, 0)],
    });
    expect(plugin(baseArgs).outputNumber).toBe(5);
  });

  it('should throw when the file has no stream data', () => {
    baseArgs.inputFileObj.ffProbeData = {};
    expect(() => plugin(baseArgs)).toThrow('File has no stream data');
  });
});
