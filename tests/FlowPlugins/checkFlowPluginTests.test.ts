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

/**
   * Normalize path separators for cross-platform compatibility
   */
const normalizePath = (filePath: string): string => filePath.replace(/\\/g, '/');

describe('Flow Plugin Test Coverage', () => {
  const PLUGINS_DIR = './FlowPluginsTs/CommunityFlowPlugins';
  const TESTS_DIR = './tests/FlowPlugins/CommunityFlowPlugins';
  const SKIP_TEST_COMMENT = '// tdarrSkipTest';

  /**
   * Recursively find all files with the specified filename in a directory
   */
  const findFiles = (dir: string, filename: string, basePath = ''): string[] => {
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          return findFiles(fullPath, filename, relativePath);
        }

        return entry.name === filename ? [basePath] : [];
      });
  };

  /**
   * Check if a plugin file contains the tdarrSkipTest comment
   */
  const shouldSkipTest = (pluginPath: string): boolean => {
    try {
      const pluginFilePath = path.join(PLUGINS_DIR, pluginPath, 'index.ts');
      const fileContent = fs.readFileSync(pluginFilePath, 'utf-8');
      return fileContent.includes(SKIP_TEST_COMMENT);
    } catch {
      return false;
    }
  };

  /**
   * Check if a test file exists for the given plugin path
   */
  const hasTestFile = (pluginPath: string): boolean => {
    const testFilePath = path.join(TESTS_DIR, pluginPath, 'index.test.ts');
    return fs.existsSync(testFilePath);
  };

  /**
   * Calculate the expected import path from a test file to its corresponding plugin file
   */
  const getExpectedImportPath = (testPath: string): string => {
    const pathSegments = testPath.split(path.sep).filter(Boolean);
    const levelsUp = pathSegments.length + 3; // +3 for CommunityFlowPlugins, FlowPlugins, tests
    const upPath = '../'.repeat(levelsUp);
    const normalizedTestPath = testPath.replace(/\\/g, '/');

    return `${upPath}FlowPluginsTs/CommunityFlowPlugins/${normalizedTestPath}/index`;
  };

  /**
   * Check if a test file contains the expected import
   */
  const hasCorrectImport = (testPath: string): boolean => {
    try {
      const testFilePath = path.join(TESTS_DIR, testPath, 'index.test.ts');
      const fileContent = fs.readFileSync(testFilePath, 'utf-8');
      const expectedImportPath = getExpectedImportPath(testPath);
      const normalizedContent = fileContent.replace(/\s+/g, ' ');

      const importPatterns = [
        `'${expectedImportPath}'`,
        `"${expectedImportPath}"`,
      ];

      return importPatterns.some((pattern) => normalizedContent.includes(pattern));
    } catch {
      return false;
    }
  };

  it('should have test files for all plugins (strict check)', () => {
    if (!fs.existsSync(PLUGINS_DIR)) {
      throw new Error(`Plugins directory not found: ${PLUGINS_DIR}`);
    }

    const allPluginPaths = findFiles(PLUGINS_DIR, 'index.ts');
    const pluginPaths = allPluginPaths.filter((pluginPath) => !shouldSkipTest(pluginPath));
    const skippedCount = allPluginPaths.length - pluginPaths.length;

    const missingTests = pluginPaths
      .filter((pluginPath) => !hasTestFile(pluginPath))
      .map(normalizePath);

    if (missingTests.length > 0) {
      const errorMessage = `${missingTests.length} plugins are missing test files `
        + `(${skippedCount} skipped via tdarrSkipTest). Run this test with --verbose to see details.`;
      // eslint-disable-next-line no-console
      console.log(errorMessage);
      expect(missingTests).toHaveLength(0);
    }
  });

  it('should have correct imports in all test files', () => {
    if (!fs.existsSync(TESTS_DIR)) {
      throw new Error(`Tests directory not found: ${TESTS_DIR}`);
    }

    const testPaths = findFiles(TESTS_DIR, 'index.test.ts');

    const incorrectImports = testPaths
      .filter((testPath) => !hasCorrectImport(testPath))
      .map((testPath) => ({
        testPath: normalizePath(testPath),
        expectedImport: `'${getExpectedImportPath(testPath)}'`,
      }));

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
