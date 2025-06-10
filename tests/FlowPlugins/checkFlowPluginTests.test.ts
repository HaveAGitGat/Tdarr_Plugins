/**
 * Test file to ensure all plugins in FlowPluginsTs/CommunityFlowPlugins
 * have corresponding test files in tests/FlowPlugins/CommunityFlowPlugins
 *
 * This test helps maintain test coverage by identifying plugins that are missing tests.
 * It also ensures that test files contain the correct imports to their corresponding plugin files.
 *
 * Expected structure:
 * - Plugin: FlowPluginsTs/CommunityFlowPlugins/{category}/{pluginName}/{version}/index.ts
 * - Test:   tests/FlowPlugins/CommunityFlowPlugins/{category}/{pluginName}/{version}/index.test.ts
 *
 * Skip test requirement:
 * - Plugins can include the comment "// tdarrSkipTest" to skip the test requirement
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Flow Plugin Test Coverage', () => {
  const pluginsDir = './FlowPluginsTs/CommunityFlowPlugins';
  const testsDir = './tests/FlowPlugins/CommunityFlowPlugins';

  /**
   * Recursively find all plugin files (index.ts) in the plugins directory
   */
  const findPluginFiles = (dir: string, basePath = ''): string[] => {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findPluginFiles(fullPath, relativePath));
      } else if (entry.isFile() && entry.name === 'index.ts') {
        // Found a plugin file, store its relative path (without the filename)
        files.push(basePath);
      }
    }

    return files;
  };

  /**
   * Recursively find all test files (index.test.ts) in the tests directory
   */
  const findTestFiles = (dir: string, basePath = ''): string[] => {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findTestFiles(fullPath, relativePath));
      } else if (entry.isFile() && entry.name === 'index.test.ts') {
        // Found a test file, store its relative path (without the filename)
        files.push(basePath);
      }
    }

    return files;
  };

  /**
   * Check if a plugin file contains the tdarrSkipTest comment
   */
  const shouldSkipTest = (pluginPath: string): boolean => {
    try {
      const pluginFilePath = path.join(pluginsDir, pluginPath, 'index.ts');
      if (!fs.existsSync(pluginFilePath)) {
        return false;
      }

      const fileContent = fs.readFileSync(pluginFilePath, 'utf-8');
      return fileContent.includes('// tdarrSkipTest');
    } catch (error) {
      // If we can't read the file, don't skip the test requirement
      return false;
    }
  };

  /**
   * Check if a test file exists for the given plugin path
   */
  const hasTestFile = (pluginPath: string): boolean => {
    const testFilePath = path.join(testsDir, pluginPath, 'index.test.ts');
    return fs.existsSync(testFilePath);
  };

  /**
   * Calculate the expected import path from a test file to its corresponding plugin file
   */
  const getExpectedImportPath = (testPath: string): string => {
    // Count the directory depth to determine how many '../' we need
    const pathSegments = testPath.split(path.sep).filter((segment) => segment.length > 0);
    const levelsUp = pathSegments.length + 3; // +3 for CommunityFlowPlugins, FlowPlugins, tests

    const upPath = '../'.repeat(levelsUp);
    // Always use forward slashes for import paths, regardless of OS
    const normalizedTestPath = testPath.replace(/\\/g, '/');
    const pluginPath = `FlowPluginsTs/CommunityFlowPlugins/${normalizedTestPath}/index`;

    return `${upPath}${pluginPath}`;
  };

  /**
   * Check if a test file contains the expected import
   */
  const hasCorrectImport = (testPath: string): boolean => {
    try {
      const testFilePath = path.join(testsDir, testPath, 'index.test.ts');
      if (!fs.existsSync(testFilePath)) {
        return false;
      }

      const fileContent = fs.readFileSync(testFilePath, 'utf-8');
      const expectedImportPath = getExpectedImportPath(testPath);

      // Normalize whitespace and line breaks for comparison
      const normalizedContent = fileContent.replace(/\s+/g, ' ');

      // Check for various import patterns with different quote styles
      const importPatterns = [
        `'${expectedImportPath}'`,
        `"${expectedImportPath}"`,
        `'${expectedImportPath}';`,
        `"${expectedImportPath}";`,
      ];

      return importPatterns.some((pattern) => normalizedContent.includes(pattern));
    } catch (error) {
      return false;
    }
  };

  /**
   * Normalize path separators for cross-platform compatibility
   */
  const normalizePath = (filePath: string): string => filePath.replace(/\\/g, '/');

  it('should have test files for all plugins (strict check)', () => {
    // fail test if directories don't exist
    if (!fs.existsSync(pluginsDir)) {
      throw new Error(`Plugins directory not found: ${pluginsDir}`);
    }

    // Find all plugin files
    const allPluginPaths = findPluginFiles(pluginsDir);

    // Filter out plugins that have the tdarrSkipTest comment
    const pluginPaths = allPluginPaths.filter((pluginPath) => !shouldSkipTest(pluginPath));
    const skippedPlugins = allPluginPaths.filter((pluginPath) => shouldSkipTest(pluginPath));

    const missingTests: string[] = [];

    // Check each plugin for corresponding test file
    for (let i = 0; i < pluginPaths.length; i += 1) {
      const pluginPath = pluginPaths[i];
      if (!hasTestFile(pluginPath)) {
        missingTests.push(normalizePath(pluginPath));
      }
    }

    // This test will fail if there are missing tests
    if (missingTests.length > 0) {
      const errorMessage = `${missingTests.length} plugins are missing test files (${skippedPlugins.length}`
      + ' skipped via tdarrSkipTest). Run this test with --verbose to see details.';
      // eslint-disable-next-line no-console
      console.log(errorMessage);
      expect(missingTests).toHaveLength(0);
    }
  });

  it('should have correct imports in all test files', () => {
    // fail test if test directory doesn't exist
    if (!fs.existsSync(testsDir)) {
      throw new Error(`Tests directory not found: ${testsDir}`);
    }

    // Find all test files
    const testPaths = findTestFiles(testsDir);
    const incorrectImports: { testPath: string; expectedImport: string }[] = [];

    // Check each test file for correct import
    for (let i = 0; i < testPaths.length; i += 1) {
      const testPath = testPaths[i];
      if (!hasCorrectImport(testPath)) {
        incorrectImports.push({
          testPath: normalizePath(testPath),
          expectedImport: `'${getExpectedImportPath(testPath)}'`,
        });
      }
    }

    // This test will fail if there are incorrect imports
    if (incorrectImports.length > 0) {
      const errorMessage = `${incorrectImports.length} test files have incorrect or missing imports. Expected imports:`;
      // eslint-disable-next-line no-console
      console.log(errorMessage);
      incorrectImports.forEach(({ testPath, expectedImport }) => {
        // eslint-disable-next-line no-console
        console.log(`  ${testPath}: should import ${expectedImport}`);
      });
      expect(incorrectImports).toHaveLength(0);
    }
  });
});
