import { plugin } from
  // eslint-disable-next-line max-len
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandKeepOriginalLanguageAudio/1.0.0/index';
import { IpluginInputArgs, IffmpegCommandStream } from
  '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const stream = (index: number, codecType: string, language?: string): IffmpegCommandStream => ({
  index,
  codec_name: codecType === 'video' ? 'h264' : 'ac3',
  codec_type: codecType,
  tags: language === undefined ? {} : { language },
  removed: false,
  forceEncoding: false,
  mapArgs: ['-map', `0:${index}`],
  inputArgs: [],
  outputArgs: [],
});

describe('ffmpegCommandKeepOriginalLanguageAudio Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let axios: jest.Mock;

  const setAudio = (...languages: (string | undefined)[]) => {
    baseArgs.variables.ffmpegCommand.streams = [
      stream(0, 'video'),
      ...languages.map((language, i) => stream(i + 1, 'audio', language)),
    ];
  };
  const removed = () => baseArgs.variables.ffmpegCommand.streams
    .filter((s) => s.removed)
    .map((s) => s.index);
  const movieLanguage = (name: string) => axios.mockResolvedValue({
    data: { movie: { originalLanguage: { id: 1, name } } },
  });

  beforeEach(() => {
    axios = jest.fn();
    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test-key',
        arr_host: 'http://192.168.1.100:7878/',
        keepLanguages: 'eng',
        keepUntagged: true,
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [],
          container: 'mkv',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      originalLibraryFile: { _id: '/library/Seven Samurai (1954)/Seven Samurai (1954) Bluray-1080p.mkv' },
      jobLog: jest.fn(),
      deps: { axios },
    } as unknown as IpluginInputArgs;
  });

  it('should keep the original language and listed languages, and remove dubs', async () => {
    setAudio('jpn', 'eng', 'fre', 'ger');
    movieLanguage('Japanese');

    await plugin(baseArgs);

    expect(removed()).toEqual([3, 4]);
    expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
  });

  it('should keep a foreign language film audible when the keep list does not include it', async () => {
    setAudio('jpn');
    baseArgs.variables.ffmpegCommand.streams.push(stream(2, 'audio', 'ita'));
    movieLanguage('Japanese');

    await plugin(baseArgs);

    expect(removed()).toEqual([2]);
  });

  it('should query the parse endpoint with the original file name and API key', async () => {
    setAudio('eng', 'fre');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'get',
      url: 'http://192.168.1.100:7878/api/v3/parse?title='
        + `${encodeURIComponent('Seven Samurai (1954) Bluray-1080p')}`,
      headers: expect.objectContaining({ 'X-Api-Key': 'test-key' }),
    }));
  });

  it('should read the series original language from Sonarr', async () => {
    baseArgs.inputs.arr = 'sonarr';
    setAudio('kor', 'eng', 'spa');
    axios.mockResolvedValue({ data: { series: { originalLanguage: { name: 'Korean' } } } });

    await plugin(baseArgs);

    expect(removed()).toEqual([3]);
  });

  it('should match regional language names such as Portuguese (Brazil)', async () => {
    setAudio('por', 'eng', 'spa');
    movieLanguage('Portuguese (Brazil)');

    await plugin(baseArgs);

    expect(removed()).toEqual([3]);
  });

  it('should match ISO 639-1 and 639-2/T tags, case-insensitively', async () => {
    setAudio('FR', 'fra', 'eng', 'deu');
    movieLanguage('French');

    await plugin(baseArgs);

    expect(removed()).toEqual([4]);
  });

  it('should keep untagged audio by default', async () => {
    setAudio('eng', undefined, 'und', 'fre');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(removed()).toEqual([4]);
  });

  it('should remove untagged audio when keepUntagged is off', async () => {
    baseArgs.inputs.keepUntagged = false;
    setAudio('eng', undefined, 'und');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(removed()).toEqual([2, 3]);
  });

  it('should keep all audio when the lookup fails, without logging the request', async () => {
    setAudio('eng', 'fre');
    axios.mockRejectedValue(Object.assign(new Error('Request failed'), {
      response: { status: 401 },
      config: { headers: { 'X-Api-Key': 'test-key' } },
    }));

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
    const logs = (baseArgs.jobLog as jest.Mock).mock.calls.flat().join('\n');
    expect(logs).toContain('HTTP 401');
    expect(logs).not.toContain('test-key');
  });

  it('should keep all audio when the title is not found', async () => {
    setAudio('eng', 'fre');
    axios.mockResolvedValue({ data: {} });

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
  });

  it('should keep all audio when the original language has no known codes', async () => {
    setAudio('eng', 'fre');
    movieLanguage('Klingon');

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
  });

  it('should keep all audio rather than remove every track', async () => {
    baseArgs.inputs.keepUntagged = false;
    setAudio('ita', 'spa');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
  });

  it('should not look anything up when there is only one audio stream', async () => {
    setAudio('fre');

    await plugin(baseArgs);

    expect(axios).not.toHaveBeenCalled();
    expect(removed()).toEqual([]);
  });

  it('should ignore audio streams already removed by an earlier plugin', async () => {
    setAudio('eng', 'fre');
    baseArgs.variables.ffmpegCommand.streams[2].removed = true;

    await plugin(baseArgs);

    expect(axios).not.toHaveBeenCalled();
  });

  it('should leave shouldProcess unchanged when nothing is removed', async () => {
    setAudio('eng', 'jpn');
    movieLanguage('Japanese');

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
  });

  it.each([
    ['Spanish (Latino)', 'spa'],
    ['Flemish', 'dut'],
    ['Bosnian', 'bos'],
  ])('should map the arr language name %s', async (name, code) => {
    setAudio(code, 'eng', 'ita');
    movieLanguage(name);

    await plugin(baseArgs);

    expect(removed()).toEqual([3]);
  });

  it.each(['Unknown', 'Any', 'Original'])('should keep all audio for the arr language %s', async (name) => {
    setAudio('eng', 'fre');
    movieLanguage(name);

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
  });

  it('should match keep list codes to every variant of the language, including region subtags', async () => {
    setAudio('en', 'en-US', 'eng', 'jpn', 'fre');
    movieLanguage('Japanese');

    await plugin(baseArgs);

    expect(removed()).toEqual([5]);
  });

  it('should keep every Chinese tag variant when the keep list says chi', async () => {
    baseArgs.inputs.keepLanguages = 'chi';
    setAudio('cmn', 'yue', 'zh', 'eng', 'fre');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(removed()).toEqual([5]);
  });

  it('should treat zxx, mul and mis like untagged audio', async () => {
    setAudio('eng', 'zxx', 'mul', 'mis', 'fre');
    movieLanguage('English');

    await plugin(baseArgs);

    expect(removed()).toEqual([5]);
  });

  it('should log a title that is not found separately from a missing language', async () => {
    setAudio('eng', 'fre');
    axios.mockResolvedValue({ data: { title: 'unmatched' } });

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('was not found in radarr'));
  });

  it('should keep all audio for a Sonarr v3 series without originalLanguage', async () => {
    baseArgs.inputs.arr = 'sonarr';
    setAudio('eng', 'fre');
    axios.mockResolvedValue({ data: { series: { id: 5, title: 'Show' } } });

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('did not return an original language'));
  });

  it('should keep all audio on a network error without a response, without logging the key', async () => {
    setAudio('eng', 'fre');
    axios.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await plugin(baseArgs);

    expect(removed()).toEqual([]);
    const logs = (baseArgs.jobLog as jest.Mock).mock.calls.flat().join('\n');
    expect(logs).toContain('ECONNREFUSED');
    expect(logs).not.toContain('test-key');
  });

  it('should throw when the ffmpeg command has not been initialised', async () => {
    baseArgs.variables.ffmpegCommand.init = false;
    await expect(plugin(baseArgs)).rejects.toThrow();
  });
});
