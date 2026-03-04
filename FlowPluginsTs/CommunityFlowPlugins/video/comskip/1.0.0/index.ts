import { promises as fsp } from 'fs';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  getContainer, getFileName, getPluginWorkDir, fileExists,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Comskip - Detect and Remove Commercials',
  description:
    `Uses comskip to detect commercials in a video file and ffmpeg to remove them.
     \\nComskip must be installed and accessible on the system.
     \\nThis plugin generates an EDL (Edit Decision List) via comskip,
     then uses ffmpeg to cut out the detected commercial segments and produce a clean output file.
     \\nUseful for DVR recordings from OTA or cable TV.`,
  style: {
    borderColor: '#6EB5FF',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faScissors',
  inputs: [
    {
      label: 'Comskip Path',
      name: 'comskipPath',
      type: 'string',
      defaultValue: 'comskip',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Path to the comskip binary. If comskip is on your PATH, you can just use "comskip".'
        + ' Otherwise, provide the full path (e.g. /usr/bin/comskip).',
    },
    {
      label: 'Use Custom comskip.ini?',
      name: 'useCustomIni',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Enable this to specify a custom comskip.ini configuration file.',
    },
    {
      label: 'Custom comskip.ini Path',
      name: 'customIniPath',
      type: 'string',
      defaultValue: '/config/comskip.ini',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useCustomIni',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Full path to a custom comskip.ini configuration file.',
    },
    {
      label: 'Output Container',
      name: 'container',
      type: 'string',
      defaultValue: 'original',
      inputUI: {
        type: 'dropdown',
        options: [
          'original',
          'mkv',
          'mp4',
          'ts',
        ],
      },
      tooltip: 'Container format for the output file after commercial removal.'
        + ' "original" will use the same container as the input file.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Commercials detected and removed',
    },
    {
      number: 2,
      tooltip: 'No commercials detected',
    },
  ],
});

interface IedlEntry {
  start: number,
  end: number,
  type: number,
}

const parseEdlFile = (edlContent: string): IedlEntry[] => {
  const lines = edlContent.trim().split('\n');
  const entries: IedlEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === '') {
      continue; // eslint-disable-line no-continue
    }
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      const start = parseFloat(parts[0]);
      const end = parseFloat(parts[1]);
      const type = parseInt(parts[2], 10);

      // Type 0 = cut (commercial), Type 3 = commercial
      if (!Number.isNaN(start) && !Number.isNaN(end) && (type === 0 || type === 3)) {
        entries.push({ start, end, type });
      }
    }
  }

  return entries;
};

const buildKeepSegments = (
  edlEntries: IedlEntry[],
  duration: number,
): { start: number; end: number }[] => {
  // Sort EDL entries by start time
  const sorted = [...edlEntries].sort((a, b) => a.start - b.start);
  const segments: { start: number; end: number }[] = [];
  let currentPos = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].start > currentPos) {
      segments.push({ start: currentPos, end: sorted[i].start });
    }
    currentPos = sorted[i].end;
  }

  // Add final segment after last commercial
  if (currentPos < duration) {
    segments.push({ start: currentPos, end: duration });
  }

  return segments;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const comskipPath = String(args.inputs.comskipPath);
  const useCustomIni = args.inputs.useCustomIni === true || args.inputs.useCustomIni === 'true';
  const customIniPath = String(args.inputs.customIniPath);
  let container = String(args.inputs.container);

  const inputFilePath = args.inputFileObj._id;
  const fileName = getFileName(inputFilePath);

  if (container === 'original') {
    container = getContainer(inputFilePath);
  }
  const workDir = getPluginWorkDir(args);

  args.jobLog('Starting comskip commercial detection...');

  // Build comskip arguments
  const comskipArgs: string[] = [
    '--output', workDir,
  ];

  if (useCustomIni) {
    comskipArgs.push('--ini', customIniPath);
  }

  comskipArgs.push(inputFilePath);

  args.jobLog(`Running: ${comskipPath} ${comskipArgs.join(' ')}`);

  // Run comskip to generate EDL file
  const comskipCli = new CLI({
    cli: comskipPath,
    spawnArgs: comskipArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '',
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const comskipRes = await comskipCli.runCli();

  if (comskipRes.cliExitCode !== 0 && comskipRes.cliExitCode !== 1) {
    args.jobLog(`Comskip exited with code ${comskipRes.cliExitCode}`);
    throw new Error(`Comskip failed with exit code ${comskipRes.cliExitCode}`);
  }

  // Check for EDL file
  const edlPath = normJoinPath({
    upath: args.deps.upath,
    paths: [workDir, `${fileName}.edl`],
  });

  if (!(await fileExists(edlPath))) {
    args.jobLog('No EDL file generated - no commercials detected.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const edlContent = await fsp.readFile(edlPath, 'utf8');
  args.jobLog(`EDL file contents:\\n${edlContent}`);

  const edlEntries = parseEdlFile(edlContent);

  if (edlEntries.length === 0) {
    args.jobLog('EDL file contained no commercial segments.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`Found ${edlEntries.length} commercial segment(s) to remove.`);

  // Get video duration from ffprobe data
  let duration = 0;
  try {
    duration = parseFloat(args.inputFileObj.ffProbeData?.format?.duration || '0');
  } catch (err) {
    // fallback
  }

  if (duration <= 0) {
    args.jobLog('Could not determine video duration, using large fallback value.');
    duration = 999999;
  }

  // Build keep segments (inverse of commercials)
  const keepSegments = buildKeepSegments(edlEntries, duration);

  if (keepSegments.length === 0) {
    args.jobLog('No content segments remaining after commercial removal - skipping.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`Keeping ${keepSegments.length} content segment(s).`);

  // Build ffmpeg complex filter to concatenate the keep segments
  const outputFilePath = `${workDir}/${fileName}.${container}`;

  // Use ffmpeg segment approach: multiple -ss/-to with concat
  // Build a filter_complex with trim and concat
  const filterParts: string[] = [];
  for (let i = 0; i < keepSegments.length; i++) {
    const seg = keepSegments[i];
    filterParts.push(
      `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];`
      + `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`,
    );
  }

  // Build concat input labels
  const concatInputs = keepSegments.map((_seg, i) => `[v${i}][a${i}]`).join('');
  const filterComplex = `${filterParts.join('')}`
    + `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`;

  const ffmpegArgs: string[] = [
    '-y',
    '-i', inputFilePath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[outa]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    outputFilePath,
  ];

  args.jobLog('Running ffmpeg to remove commercials...');

  const ffmpegCli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: ffmpegArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const ffmpegRes = await ffmpegCli.runCli();

  if (ffmpegRes.cliExitCode !== 0) {
    args.jobLog('FFmpeg commercial removal failed.');
    throw new Error('FFmpeg commercial removal failed');
  }

  args.jobLog(`Commercials removed successfully. Output: ${outputFilePath}`);

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
