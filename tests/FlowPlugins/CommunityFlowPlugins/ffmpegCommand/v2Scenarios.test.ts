import { spawnSync } from 'child_process';
import { renderFfmpegCommandV2 } from
  '../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/index';
import { getEncoder } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import ffmpegCommandV2Scenarios from './scenarios';
import {
  createV2MockEncoder,
  createV2ScenarioArgs,
} from './scenarios/scenarioUtils';
import type {
  IffmpegCommandV2Scenario,
  IffmpegCommandV2ScenarioRun,
} from './scenarios/scenarioUtils';

jest.mock('../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils', () => ({
  getEncoder: jest.fn(),
}));

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

const mockGetEncoder = getEncoder as jest.MockedFunction<typeof getEncoder>;
const mockSpawnSync = spawnSync as jest.Mock;

const makeLoudnormOutput = (): string => [
  'Some other output',
  `[Parsed_loudnorm_0 @ 0x123456] ${JSON.stringify({
    input_i: '-16.42',
    input_tp: '-0.23',
    input_lra: '11.32',
    input_thresh: '-26.83',
    target_offset: '0.59',
  }, null, 2)}`,
  'More output',
].join('\n');

const renderScenario = async (
  scenario: IffmpegCommandV2Scenario,
  operationIndex: number,
): Promise<IffmpegCommandV2ScenarioRun> => {
  const operationVariants = scenario.operationVariants || [scenario.operations];
  const args = createV2ScenarioArgs(scenario, operationVariants[operationIndex]);

  mockGetEncoder.mockResolvedValue(scenario.encoder || createV2MockEncoder());

  return {
    args,
    result: await renderFfmpegCommandV2(args),
  };
};

const expectScenarioLogs = (
  scenario: IffmpegCommandV2Scenario,
  args: IffmpegCommandV2ScenarioRun['args'],
): void => {
  (scenario.expected.jobLogs || []).forEach((jobLog) => {
    expect(args.jobLog).toHaveBeenCalledWith(jobLog);
  });
};

const expectScenarioResult = (
  scenario: IffmpegCommandV2Scenario,
  run: IffmpegCommandV2ScenarioRun,
): void => {
  const { expected } = scenario;

  if (expected.spawnArgs) {
    expect(run.result.spawnArgs).toEqual(expected.spawnArgs);
  }

  if (expected.shouldProcess !== undefined) {
    expect(run.result.shouldProcess).toBe(expected.shouldProcess);
  }

  if (expected.container) {
    expect(run.result.container).toBe(expected.container);
  }

  if (expected.sourceIndexes) {
    expect(run.result.streams.map((stream) => stream.sourceIndex)).toEqual(expected.sourceIndexes);
  }

  if (expected.codecTypes) {
    expect(run.result.streams.map((stream) => stream.codec_type)).toEqual(expected.codecTypes);
  }

  expectScenarioLogs(scenario, run.args);
};

describe('FFmpeg command v2 scenario rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpawnSync.mockReturnValue({
      stdout: '',
      stderr: makeLoudnormOutput(),
      status: 0,
      signal: null,
    });
  });

  it.each(ffmpegCommandV2Scenarios.map((scenario) => [
    scenario.id,
    scenario.description,
    scenario,
  ] as const))(
    '%s: %s',
    async (_id, _description, scenario) => {
      const operationVariants = scenario.operationVariants || [scenario.operations];

      if (scenario.expected.errorMessage) {
        const argsByVariant = operationVariants.map((operations) => createV2ScenarioArgs(scenario, operations));

        await Promise.all(argsByVariant.map(async (args) => {
          mockGetEncoder.mockResolvedValue(scenario.encoder || createV2MockEncoder());

          await expect(renderFfmpegCommandV2(args)).rejects.toThrow(scenario.expected.errorMessage);
        }));

        argsByVariant.forEach((args) => {
          expectScenarioLogs(scenario, args);
        });
        return;
      }

      let canonicalSpawnArgs: string[] | undefined;
      let canonicalShouldProcess: boolean | undefined;
      let canonicalContainer: string | undefined;
      let canonicalSourceIndexes: number[] | undefined;
      let canonicalCodecTypes: string[] | undefined;

      const runs = await Promise.all(operationVariants.map((_operations, index) => renderScenario(scenario, index)));

      runs.forEach((run) => {
        expectScenarioResult(scenario, run);

        if (canonicalSpawnArgs) {
          expect(run.result.spawnArgs).toEqual(canonicalSpawnArgs);
          expect(run.result.shouldProcess).toBe(canonicalShouldProcess);
          expect(run.result.container).toBe(canonicalContainer);
          expect(run.result.streams.map((stream) => stream.sourceIndex)).toEqual(canonicalSourceIndexes);
          expect(run.result.streams.map((stream) => stream.codec_type)).toEqual(canonicalCodecTypes);
        } else {
          canonicalSpawnArgs = run.result.spawnArgs;
          canonicalShouldProcess = run.result.shouldProcess;
          canonicalContainer = run.result.container;
          canonicalSourceIndexes = run.result.streams.map((stream) => stream.sourceIndex);
          canonicalCodecTypes = run.result.streams.map((stream) => stream.codec_type);
        }
      });
    },
  );
});
