/* global jest */
/* eslint-disable no-redeclare */
// Jest setup file for Tdarr Flow Plugin tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
