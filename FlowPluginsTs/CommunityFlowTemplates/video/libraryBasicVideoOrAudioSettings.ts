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
        x: 718.6406249999999,
        y: 385.25,
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
        y: 255.75,
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
  ],
});

export {
  details,
};
