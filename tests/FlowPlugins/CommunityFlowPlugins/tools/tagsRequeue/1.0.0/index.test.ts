import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/tagsRequeue/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('tagsRequeue Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        useBasicQueueTags: 'true',
        basicQueueTags: 'requireCPU',
        customQueueTags: 'requireCPUorGPU,tag1',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Queue Tags', () => {
    it.each([
      'requireCPU',
      'requireGPU',
      'requireGPU:nvenc',
      'requireGPU:qsv',
      'requireGPU:vaapi',
      'requireGPU:videotoolbox',
      'requireGPU:amf',
      'requireCPUorGPU',
    ])('should use %s tag when useBasicQueueTags is true', (tag) => {
      baseArgs.inputs.useBasicQueueTags = 'true';
      baseArgs.inputs.basicQueueTags = tag;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.queueTags).toBe(tag);
    });
  });

  describe('Custom Queue Tags', () => {
    it('should use custom tags when useBasicQueueTags is false', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = 'requireCPUorGPU,tag1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPUorGPU,tag1');
    });

    it('should handle custom tags with multiple tags', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = 'requireGPU:nvenc,tag1,tag2,tag3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU:nvenc,tag1,tag2,tag3');
    });

    it('should handle custom tags with requireCPU', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = 'requireCPU,customTag1,customTag2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPU,customTag1,customTag2');
    });

    it('should handle custom tags with requireGPU variants', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = 'requireGPU:qsv,intel,hardware';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU:qsv,intel,hardware');
    });

    it('should handle single custom tag', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = 'requireGPU';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU');
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean true for useBasicQueueTags', () => {
      baseArgs.inputs.useBasicQueueTags = true as unknown as string;
      baseArgs.inputs.basicQueueTags = 'requireCPU';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPU');
    });

    it('should handle boolean false for useBasicQueueTags', () => {
      baseArgs.inputs.useBasicQueueTags = false as unknown as string;
      baseArgs.inputs.customQueueTags = 'requireGPU,custom';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU,custom');
    });

    it('should handle empty custom tags', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // When customQueueTags is empty, lib.loadDefaultValues fills it with the default
      expect(result.variables.queueTags).toBe('requireCPUorGPU,tag1');
    });

    it('should preserve existing variables', () => {
      (baseArgs.variables as unknown as Record<string, unknown>).existingVar = 'testValue';
      baseArgs.inputs.useBasicQueueTags = 'true';
      baseArgs.inputs.basicQueueTags = 'requireCPU';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPU');
      expect((result.variables as unknown as Record<string, unknown>).existingVar).toBe('testValue');
    });

    it('should handle file object correctly', () => {
      const originalFileObj = baseArgs.inputFileObj;

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(originalFileObj);
      expect(result.outputFileObj).toEqual(originalFileObj);
    });
  });

  describe('Input Types', () => {
    it('should handle numeric inputs converted to strings', () => {
      baseArgs.inputs.useBasicQueueTags = 0 as unknown as string;
      baseArgs.inputs.customQueueTags = 'requireGPU,custom';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Since useBasicQueueTags is falsy (0), it uses customQueueTags
      expect(result.variables.queueTags).toBe('requireGPU,custom');
    });

    it('should handle null inputs', () => {
      baseArgs.inputs.useBasicQueueTags = 'false';
      baseArgs.inputs.customQueueTags = null as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('null');
    });

    it('should handle undefined inputs', () => {
      baseArgs.inputs.useBasicQueueTags = 'true';
      baseArgs.inputs.basicQueueTags = undefined as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // When basicQueueTags is undefined, lib.loadDefaultValues fills it with the default
      expect(result.variables.queueTags).toBe('requireCPU');
    });
  });
});
