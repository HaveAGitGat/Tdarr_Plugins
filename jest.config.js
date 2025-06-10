module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/FlowPlugins'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: false }],
  },
  collectCoverageFrom: [
    'FlowPluginsTs/**/*.ts',
    '!FlowPluginsTs/**/*.d.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: [],
};