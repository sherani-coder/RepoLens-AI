/**
 * Testing Analyzer - Detects test coverage and testing framework
 */

import { AnalysisResult } from '@/types';
import GitHubClient from '@/lib/github';

export class TestingAnalyzer {
  private github: GitHubClient;

  constructor(token?: string) {
    this.github = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let score = 100;

    // Check for test directories
    const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
    let hasTests = false;

    for (const dir of testDirs) {
      try {
        const files = await this.github.getRepositoryFiles(owner, repo, dir);
        if (files.length > 0) {
          hasTests = true;
          break;
        }
      } catch {
        // Directory doesn't exist
      }
    }

    if (!hasTests) {
      score -= 40;
      results.push({
        id: 'test-001',
        category: 'testing',
        score: 0,
        maxScore: 40,
        severity: 'high',
        title: 'No test directory found',
        description: 'No test/tests/__tests__/spec directory detected',
        recommendation: 'Create a test directory and add unit tests',
        timestamp: new Date().toISOString(),
      });
    } else {
      results.push({
        id: 'test-001',
        category: 'testing',
        score: 40,
        maxScore: 40,
        severity: 'info',
        title: 'Test directory found',
        description: 'Test files detected in repository',
        recommendation: 'Continue adding tests for better coverage',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for test configuration files
    const testConfigs = [
      'jest.config.js',
      'jest.config.ts',
      'vitest.config.js',
      'vitest.config.ts',
      '.mocharc.json',
      'pytest.ini',
      'phpunit.xml',
      'Gemfile',
      'setup.cfg',
    ];

    let hasTestConfig = false;
    for (const config of testConfigs) {
      if (await this.github.checkFileExists(owner, repo, config)) {
        hasTestConfig = true;
        results.push({
          id: 'test-002',
          category: 'testing',
          score: 20,
          maxScore: 20,
          severity: 'info',
          title: 'Test framework configured',
          description: `Found test configuration: ${config}`,
          recommendation: 'Ensure tests are running in CI/CD pipeline',
          fileLocation: config,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    if (!hasTestConfig) {
      score -= 20;
      results.push({
        id: 'test-002',
        category: 'testing',
        score: 0,
        maxScore: 20,
        severity: 'medium',
        title: 'No test configuration found',
        description: 'No test framework configuration detected',
        recommendation: 'Set up a testing framework (Jest, Vitest, Pytest, etc.)',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for CI/CD workflows with tests
    const workflows = await this.github.getWorkflows(owner, repo);
    let hasCITests = false;

    for (const workflow of workflows) {
      try {
        const content = await this.github.getFileContent(owner, repo, `.github/workflows/${workflow}`);
        if (/test|coverage|jest|pytest|mocha|vitest/i.test(content)) {
          hasCITests = true;
          break;
        }
      } catch {
        // File read error
      }
    }

    if (hasCITests) {
      results.push({
        id: 'test-003',
        category: 'testing',
        score: 30,
        maxScore: 30,
        severity: 'info',
        title: 'CI/CD tests configured',
        description: 'Tests are running in CI/CD pipeline',
        recommendation: 'Ensure coverage reports are generated',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 30;
      results.push({
        id: 'test-003',
        category: 'testing',
        score: 0,
        maxScore: 30,
        severity: 'high',
        title: 'No CI/CD tests found',
        description: 'Tests are not running in GitHub Actions or other CI/CD',
        recommendation: 'Add test commands to CI/CD workflow (.github/workflows)',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for coverage configuration
    const coverageConfigs = ['coverage', '.nyc_output', 'codecov.yml', '.coveragerc'];
    let hasCoverage = false;

    for (const config of coverageConfigs) {
      if (await this.github.checkFileExists(owner, repo, config)) {
        hasCoverage = true;
        break;
      }
    }

    if (hasCoverage) {
      results.push({
        id: 'test-004',
        category: 'testing',
        score: 10,
        maxScore: 10,
        severity: 'info',
        title: 'Coverage tracking configured',
        description: 'Test coverage is being tracked',
        recommendation: 'Aim for at least 80% code coverage',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 10;
      results.push({
        id: 'test-004',
        category: 'testing',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'No coverage tracking found',
        description: 'Test coverage configuration not detected',
        recommendation: 'Configure coverage tracking (Istanbul, Codecov, etc.)',
        timestamp: new Date().toISOString(),
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    if (results.length === 0) {
      results.push({
        id: 'test-000',
        category: 'testing',
        score: 100,
        maxScore: 100,
        severity: 'info',
        title: 'Testing infrastructure complete',
        description: 'All testing best practices are implemented',
        recommendation: 'Continue maintaining test quality and coverage',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }
}
