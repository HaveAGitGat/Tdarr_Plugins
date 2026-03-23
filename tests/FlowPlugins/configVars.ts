/**
 * Shared configVars object for flow plugin tests
 * This provides a consistent configuration structure across all test files
 */

import { IconfigVars } from '../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

// eslint-disable-next-line import/prefer-default-export
const getConfigVars = () : IconfigVars => ({
  config: {
    serverIP: '127.0.0.1',
    serverPort: '8266',
    apiKey: '',
    nodeID: '123',
    nodeName: 'test',
    serverURL: 'http://localhost:8266',
    handbrakePath: '/usr/bin/HandBrake',
    ffmpegPath: '/usr/bin/ffmpeg',
    mkvpropeditPath: '/usr/bin/mkvpropedit',
    pathTranslators: [],
    platform_arch_isdocker: 'linux_x64_false',
    logLevel: 'info',
    processPid: 123,
    priority: 1,
    cronPluginUpdate: '',
    nodeType: 'mapped',
    unmappedNodeCache: '/tmp/unmapped_node_cache',
    startPaused: false,
    maxLogSizeMB: 10,
    pollInterval: 1000,
  },
});

export default getConfigVars;
