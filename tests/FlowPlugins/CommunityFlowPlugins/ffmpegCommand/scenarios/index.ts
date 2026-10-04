import type { IffmpegCommandV2Scenario } from './scenarioUtils';
import customScenarios from './customScenarios';
import hardwareScenarios from './hardwareScenarios';
import orderIndependenceScenarios from './orderIndependence';
import streamScenarios from './streamScenarios';

const ffmpegCommandV2Scenarios: IffmpegCommandV2Scenario[] = [
  ...orderIndependenceScenarios,
  ...hardwareScenarios,
  ...streamScenarios,
  ...customScenarios,
];

export default ffmpegCommandV2Scenarios;
