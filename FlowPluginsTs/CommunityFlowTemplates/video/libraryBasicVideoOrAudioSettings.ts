/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */

import { IflowTemplate } from '../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = () :IflowTemplate => ({
  name: 'Library Basic Video or Audio Settings',
  description: `Basic Video or Audio settings designed to replicate
  the Basic Video or Basic Audio settings in the library settings`,
  tags: '',
  flowPlugins: [
    {
      name: 'Input File',
      sourceRepo: 'Community',
      pluginName: 'inputFile',
      version: '1.0.0',
      id: '7jgXVq0nr',
      position: {
        x: 718.59375,
        y: 119,
      },
    },
    {
      name: 'Replace Original File',
      sourceRepo: 'Community',
      pluginName: 'replaceOriginalFile',
      version: '1.0.0',
      id: 'jiZxqk6Mn',
      position: {
        x: 596.6254413959128,
        y: 400.40716566510395,
      },
    },
    {
      name: 'Basic Video or Audio Settings',
      sourceRepo: 'Community',
      pluginName: 'basicVideoOrAudio',
      version: '1.0.0',
      id: '1Ic5EqipX',
      position: {
        x: 718.640625,
        y: 256.50785828325525,
      },
    },
    {
      name: 'Delete Original File',
      sourceRepo: 'Community',
      pluginName: 'deleteFile',
      version: '1.0.0',
      id: 'GFVi2TyC5',
      position: {
        x: 1023.512757091562,
        y: 507.4711636025485,
      },
      inputsDB: {
        fileToDelete: 'originalFile',
      },
    },
    {
      name: 'Move To Directory',
      sourceRepo: 'Community',
      pluginName: 'moveToDirectory',
      version: '2.0.0',
      id: 'paWDXnDMV',
      position: {
        x: 831.7746114279963,
        y: 397.5817125305445,
      },
    },
    {
      name: `By default this flow will replace the original file. If you'd like to move the
 file to an output directory and delete the original file then connect the 'Basic Video or Audio
 Settings' plugin to the 'Move To Directory'`,
      sourceRepo: 'Community',
      pluginName: 'comment',
      version: '1.0.0',
      id: 'CuLcKZmvH',
      position: {
        x: 934.0854796674475,
        y: 187.65496806885437,
      },
    },
  ],
  flowEdges: [
    {
      source: '7jgXVq0nr',
      sourceHandle: '1',
      target: '1Ic5EqipX',
      targetHandle: null,
      id: 'kSxxYNCmG',
    },
    {
      source: '1Ic5EqipX',
      sourceHandle: '1',
      target: 'jiZxqk6Mn',
      targetHandle: null,
      id: 'CNPsr76ct',
    },
    {
      source: 'paWDXnDMV',
      sourceHandle: '1',
      target: 'GFVi2TyC5',
      targetHandle: null,
      id: 'f2s4CS2H5',
    },
  ],
});

export {
  details,
};
