/* eslint-env jest */
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/failFlow/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('failFlow Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Core Functionality', () => {
    it('should throw an error to force flow failure', () => {
      expect(() => {
        plugin(baseArgs);
      }).toThrow('Forcing flow to fail!');
    });

    it('should throw Error type specifically', () => {
      expect(() => {
        plugin(baseArgs);
      }).toThrow(Error);
    });

    it('should handle different input configurations', () => {
      // Test with empty inputs
      baseArgs.inputs = {};
      expect(() => {
        plugin(baseArgs);
      }).toThrow('Forcing flow to fail!');

      // Test with undefined inputs
      baseArgs.inputs = undefined as unknown as Record<string, unknown>;
      expect(() => {
        plugin(baseArgs);
      }).toThrow('Forcing flow to fail!');
    });
  });
});
