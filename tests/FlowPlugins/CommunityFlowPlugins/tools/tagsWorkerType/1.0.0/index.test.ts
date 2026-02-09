import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/tagsWorkerType/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('tagsWorkerType Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        requiredWorkerType: 'CPUorGPU',
        requiredNodeTags: '',
      },
      variables: {
        queueTags: '',
      } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      workerType: 'transcodecpu',
      nodeHardwareType: '-',
      nodeTags: '',
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('CPUorGPU Worker Type', () => {
    it('should continue when requiredWorkerType is CPUorGPU (always matches)', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.workerType = 'transcodecpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should continue when requiredWorkerType is CPUorGPU with GPU worker', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.workerType = 'transcodegpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });
  });

  describe('CPU Worker Type', () => {
    it('should continue when workerType is transcodecpu and requiredWorkerType is CPU', () => {
      baseArgs.inputs.requiredWorkerType = 'CPU';
      baseArgs.workerType = 'transcodecpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should requeue when workerType is transcodegpu and requiredWorkerType is CPU', () => {
      baseArgs.inputs.requiredWorkerType = 'CPU';
      baseArgs.workerType = 'transcodegpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPU');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required tags are not subset of current tags, requeueing.');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Requeueing with tags requireCPU');
    });
  });

  describe('GPU Worker Type', () => {
    it('should continue when workerType is transcodegpu and requiredWorkerType is GPU', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU';
      baseArgs.workerType = 'transcodegpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should requeue when workerType is transcodecpu and requiredWorkerType is GPU', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU';
      baseArgs.workerType = 'transcodecpu';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required tags are not subset of current tags, requeueing.');
    });

    it('should continue when GPU worker has matching specific hardware type', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU:nvenc';
      baseArgs.workerType = 'transcodegpu';
      baseArgs.nodeHardwareType = 'nvenc';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should requeue when GPU worker has different hardware type', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU:nvenc';
      baseArgs.workerType = 'transcodegpu';
      baseArgs.nodeHardwareType = 'qsv';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireGPU:nvenc');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required tags are not subset of current tags, requeueing.');
    });
  });

  describe('Node Tags', () => {
    it('should continue when current node tags include all required tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.inputs.requiredNodeTags = 'high-priority,server1';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = 'high-priority,server1,other-tag';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should requeue when current node tags are missing some required tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.inputs.requiredNodeTags = 'high-priority,special-server';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = 'high-priority';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe(
        'requireCPUorGPU,high-priority,special-server',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required tags are not subset of current tags, requeueing.');
    });

    it('should handle empty required node tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPU';
      baseArgs.inputs.requiredNodeTags = '';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = 'some-tag';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should handle empty current node tags when required tags exist', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.inputs.requiredNodeTags = 'required-tag';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('requireCPUorGPU,required-tag');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required tags are not subset of current tags, requeueing.');
    });
  });

  describe('Hardware Types', () => {
    it.each([
      'nvenc',
      'qsv',
      'vaapi',
      'videotoolbox',
      'amf',
    ])('should handle GPU:%s hardware type correctly', (hardwareType) => {
      baseArgs.inputs.requiredWorkerType = `GPU:${hardwareType}`;
      baseArgs.workerType = 'transcodegpu';
      baseArgs.nodeHardwareType = hardwareType;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Required tags are subset of current tags, continuing to next plugin.',
      );
    });

    it('should handle GPU without specific hardware type', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU';
      baseArgs.workerType = 'transcodegpu';
      baseArgs.nodeHardwareType = '-';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
    });
  });

  describe('Tag Processing', () => {
    it('should trim whitespace from tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.inputs.requiredNodeTags = ' tag1 , tag2 ';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = ' tag1 , tag2 , tag3 ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
    });

    it('should filter out empty tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.inputs.requiredNodeTags = 'tag1,,tag2,';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = 'tag1,tag2,tag3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
    });
  });

  describe('Logging', () => {
    it('should log required and current tags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPU';
      baseArgs.inputs.requiredNodeTags = 'tag1,tag2';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = 'tag1,tag2,tag3';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Required Tags: requireCPU,tag1,tag2');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Current Tags: requireCPU,tag1,tag2,tag3');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('Is Subset: true'));
    });

    it('should log subset check result when tags do not match', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU:nvenc';
      baseArgs.workerType = 'transcodecpu';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('Is Subset: false'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined nodeTags', () => {
      baseArgs.inputs.requiredWorkerType = 'CPUorGPU';
      baseArgs.workerType = 'transcodecpu';
      baseArgs.nodeTags = undefined as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
    });

    it('should handle undefined nodeHardwareType', () => {
      baseArgs.inputs.requiredWorkerType = 'GPU';
      baseArgs.workerType = 'transcodegpu';
      baseArgs.nodeHardwareType = undefined as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.queueTags).toBe('');
    });

    it('should return the same input file object', () => {
      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should return variables object', () => {
      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
    });
  });
});
