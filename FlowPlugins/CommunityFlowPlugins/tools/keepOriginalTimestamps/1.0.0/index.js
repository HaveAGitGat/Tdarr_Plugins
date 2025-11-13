"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;

/* eslint-disable no-param-reassign */
const details = () => ({
  name: 'Keep Original File Timestamps',
  description: 'Preserves original file modification and access times through transcoding. Run AFTER Replace Original File plugin.',
  style: {
    borderColor: '#6efefd',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faCalendar',
  inputs: [
    {
      label: 'Enable Logging',
      name: 'enableLogging',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Enable detailed logging for debugging',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Timestamps applied successfully',
    },
    {
      number: 2,
      tooltip: 'Error occurred',
    },
  ],
});

exports.details = details;

const plugin = async (args) => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const fs = require('fs');
  
  const enableLogging = args.inputs.enableLogging === true || args.inputs.enableLogging === 'true';

  const log = (msg) => {
    if (enableLogging) {
      args.jobLog(msg);
    }
  };

  try {
    log('===== Keep Original Timestamps Plugin =====');
    log(`Current working file: ${args.inputFileObj._id}`);

    let originalAtimeMs = null;
    let originalMtimeMs = null;

    if (args.variables && args.variables.user && args.variables.user.originalTimestamps) {
      log('Found saved timestamps in flow variables');
      originalAtimeMs = args.variables.user.originalTimestamps.atimeMs;
      originalMtimeMs = args.variables.user.originalTimestamps.mtimeMs;
    } else {
      log('Timestamps not in variables, capturing from original file...');
      
      if (args.originalLibraryFile && args.originalLibraryFile.statSync) {
        originalAtimeMs = args.originalLibraryFile.statSync.atimeMs;
        originalMtimeMs = args.originalLibraryFile.statSync.mtimeMs;
        
        log(`Captured from originalLibraryFile: atime=${new Date(originalAtimeMs).toISOString()}, mtime=${new Date(originalMtimeMs).toISOString()}`);
        
        // Save for future use in this flow
        if (!args.variables.user) {
          args.variables.user = {};
        }
        args.variables.user.originalTimestamps = {
          atimeMs: originalAtimeMs,
          mtimeMs: originalMtimeMs,
        };
        log('Saved timestamps to flow variables for later use');
      } else {
        throw new Error('originalLibraryFile.statSync not available');
      }
    }

    if (!originalAtimeMs || !originalMtimeMs) {
      throw new Error('Could not find original timestamps');
    }

    const atime = new Date(originalAtimeMs);
    const mtime = new Date(originalMtimeMs);
    
    const targetFile = args.inputFileObj._id;
    log(`Applying timestamps to: ${targetFile}`);
    log(`  atime: ${atime.toISOString()}`);
    log(`  mtime: ${mtime.toISOString()}`);
    
    fs.utimesSync(targetFile, atime, mtime);
    
    log('Timestamps applied correctly');
    log('============================');

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  } catch (err) {
    args.jobLog(`ERROR in Keep Original Timestamps: ${err.message}`);
    args.jobLog(err.stack || '');
    
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }
};

exports.plugin = plugin;

