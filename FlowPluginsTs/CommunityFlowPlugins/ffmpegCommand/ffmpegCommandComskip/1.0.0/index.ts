import { promises as fsp } from 'fs';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  getContainer, getFileName, getPluginWorkDir, fileExists,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Comskip - Detect and Remove Commercials',
  description:
    `Uses comskip to detect commercials and configures ffmpeg to remove them.
     \\nComskip must be installed and accessible on the system.
     \\nThis plugin reads comskip output (EDL or TXT format) to identify commercial segments,
     then uses the ffmpeg concat demuxer to join the non-commercial segments.
     \\nAll stream types (video, audio, subtitles, data) are preserved with correct timing.
     \\nMust be used between Begin Command and Execute plugins.
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

interface IcommercialEntry {
  start: number,
  end: number,
}

const parseEdlFile = (edlContent: string): IcommercialEntry[] => {
  const lines = edlContent.trim().split('\n');
  const entries: IcommercialEntry[] = [];

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
        entries.push({ start, end });
      }
    }
  }

  return entries;
};

// Parses comskip .txt output (frame-based) and converts to seconds
// Header format: "FILE PROCESSING COMPLETE  <frames> FRAMES AT  <rate>"
// where rate is fps * 100 (e.g. 2996 = 29.96 fps)
// Data lines: <start_frame>\t<end_frame>
const parseTxtFile = (txtContent: string): IcommercialEntry[] => {
  const lines = txtContent.trim().split('\n');
  const entries: IcommercialEntry[] = [];

  if (lines.length < 3) return entries;

  // Parse framerate from header: "FILE PROCESSING COMPLETE  20489 FRAMES AT  2996"
  const headerMatch = lines[0].match(/FRAMES\s+AT\s+(\d+)/);
  if (!headerMatch) return entries;

  const fps = parseInt(headerMatch[1], 10) / 100;
  if (fps <= 0 || Number.isNaN(fps)) return entries;

  // Skip header and separator line, parse frame ranges
  for (let i = 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === '') {
      continue; // eslint-disable-line no-continue
    }
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const startFrame = parseInt(parts[0], 10);
      const endFrame = parseInt(parts[1], 10);

      if (!Number.isNaN(startFrame) && !Number.isNaN(endFrame)) {
        entries.push({
          start: startFrame / fps,
          end: endFrame / fps,
        });
      }
    }
  }

  return entries;
};

const buildKeepSegments = (
  commercials: IcommercialEntry[],
  duration: number,
): { start: number; end: number }[] => {
  // Sort entries by start time
  const sorted = [...commercials].sort((a, b) => a.start - b.start);
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

  checkFfmpegCommandInit(args);

  const comskipPath = String(args.inputs.comskipPath);
  const useCustomIni = args.inputs.useCustomIni === true || args.inputs.useCustomIni === 'true';
  const customIniPath = String(args.inputs.customIniPath);
  let container = String(args.inputs.container);

  const inputFilePath = args.inputFileObj._id;
  const fileName = getFileName(inputFilePath);

  if (container === 'original') {
    container = getContainer(inputFilePath);
  }

  // Update the ffmpegCommand container
  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.container = container;

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

  // Check for EDL file first, then fall back to TXT
  const edlPath = normJoinPath({
    upath: args.deps.upath,
    paths: [workDir, `${fileName}.edl`],
  });
  const txtPath = normJoinPath({
    upath: args.deps.upath,
    paths: [workDir, `${fileName}.txt`],
  });

  let commercials: IcommercialEntry[] = [];

  if (await fileExists(edlPath)) {
    const edlContent = await fsp.readFile(edlPath, 'utf8');
    args.jobLog(`EDL file contents:\n${edlContent}`);
    commercials = parseEdlFile(edlContent);
  } else if (await fileExists(txtPath)) {
    const txtContent = await fsp.readFile(txtPath, 'utf8');
    args.jobLog(`TXT file contents:\n${txtContent}`);
    commercials = parseTxtFile(txtContent);
  } else {
    args.jobLog('No EDL or TXT file generated - no commercials detected.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  if (commercials.length === 0) {
    args.jobLog('Comskip output contained no commercial segments.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`Found ${commercials.length} commercial segment(s) to remove.`);

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
  const keepSegments = buildKeepSegments(commercials, duration);

  if (keepSegments.length === 0) {
    args.jobLog('No content segments remaining after commercial removal - skipping.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog(`Keeping ${keepSegments.length} content segment(s).`);

  // Write a concat demuxer file listing the keep segments.
  // The concat demuxer handles ALL stream types (video, audio, subtitles, data)
  // with correct timestamp adjustment, so nothing is lost.
  const escapedPath = inputFilePath.replace(/'/g, "'\\''");
  const concatLines: string[] = ['ffconcat version 1.0'];
  for (let i = 0; i < keepSegments.length; i++) {
    concatLines.push(`file '${escapedPath}'`);
    concatLines.push(`inpoint ${keepSegments[i].start}`);
    concatLines.push(`outpoint ${keepSegments[i].end}`);
  }

  const concatFilePath = normJoinPath({
    upath: args.deps.upath,
    paths: [workDir, `${fileName}.concat`],
  });
  await fsp.writeFile(concatFilePath, concatLines.join('\n'), 'utf8');

  args.jobLog(`Wrote concat demuxer file: ${concatFilePath}`);

  // Tell Execute to read the input via the concat demuxer
  args.variables.ffmpegCommand.overallInputArguments.push(
    '-f', 'concat', '-safe', '0',
  );

  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;

  args.jobLog('Configured ffmpeg command for commercial removal.');

  return {
    outputFileObj: {
      _id: concatFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
