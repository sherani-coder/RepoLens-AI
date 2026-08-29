/**
 * Code Quality Analyzer
 */

import { AnalysisResult } from '@/types';
import GitHubClient from '@/lib/github';

export class CodeQualityAnalyzer {
  private github: GitHubClient;

  constructor(token?: string) {
    this.github = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let score = 100;

    // Check for linting config
    const lintConfigs = ['.eslintrc.json', '.eslintrc.js', '.prettierrc', '.pylintrc', 'flake8.cfg'];
    let hasLinting = false;
    for (const config of lintConfigs) {
      if (await this.github.checkFileExists(owner, repo, config)) {
        hasLinting = true;
        break;
      }
    }

    if (hasLinting) {
      results.push({
        id: 'cq-001',
        category: 'codeQuality',
        score: 25,
        maxScore: 25,
        severity: 'info',
        title: 'Linting configured',
        description: 'ESLint, Prettier, or similar tool found',
        recommendation: 'Enforce linting in CI/CD pipeline',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 25;
      results.push({
        id: 'cq-001',
        category: 'codeQuality',
        score: 0,
        maxScore: 25,
        severity: 'high',
        title: 'No linting configuration',
        description: 'ESLint, Prettier not configured',
        recommendation: 'Set up ESLint and Prettier for code consistency',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for TypeScript
    const tsConfig = await this.github.checkFileExists(owner, repo, 'tsconfig.json');
    if (tsConfig) {
      results.push({
        id: 'cq-002',
        category: 'codeQuality',
        score: 20,
        maxScore: 20,
        severity: 'info',
        title: 'TypeScript configured',
        description: 'Type safety enabled with TypeScript',
        recommendation: 'Maintain strict TypeScript settings',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 10;
      results.push({
        id: 'cq-002',
        category: 'codeQuality',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'No TypeScript found',
        description: 'Project not using TypeScript',
        recommendation: 'Consider adopting TypeScript for type safety',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for editorconfig
    const hasEditorConfig = await this.github.checkFileExists(owner, repo, '.editorconfig');
    if (hasEditorConfig) {
      results.push({
        id: 'cq-003',
        category: 'codeQuality',
        score: 10,
        maxScore: 10,
        severity: 'info',
        title: 'EditorConfig present',
        description: 'Consistent editor settings configured',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 5;
    }

    // Check for code analysis tools
    const analysisTools = ['sonarqube', 'codacy', 'codecov', '.deepsource.toml'];
    let hasAnalysis = false;
    for (const tool of analysisTools) {
      if (await this.github.checkFileExists(owner, repo, tool)) {
        hasAnalysis = true;
        break;
      }
    }

    if (hasAnalysis) {
      results.push({
        id: 'cq-004',
        category: 'codeQuality',
        score: 20,
        maxScore: 20,
        severity: 'info',
        title: 'Code analysis tools configured',
        description: 'Quality gates and analysis configured',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 15;
      results.push({
        id: 'cq-004',
        category: 'codeQuality',
        score: 0,
        maxScore: 15,
        severity: 'medium',
        title: 'No code analysis tools',
        description: 'Consider using SonarQube, Codacy, or similar',
        recommendation: 'Set up automated code quality checks',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for .gitignore
    const hasGitignore = await this.github.checkFileExists(owner, repo, '.gitignore');
    if (hasGitignore) {
      results.push({
        id: 'cq-005',
        category: 'codeQuality',
        score: 10,
        maxScore: 10,
        severity: 'info',
        title: '.gitignore configured',
        description: 'Proper git ignore rules in place',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 10;
      results.push({
        id: 'cq-005',
        category: 'codeQuality',
        score: 0,
        maxScore: 10,
        severity: 'medium',
        title: 'Missing .gitignore',
        description: 'No .gitignore file found',
        recommendation: 'Create .gitignore to exclude unnecessary files',
        timestamp: new Date().toISOString(),
      });
    }

    score = Math.max(0, score);

    if (results.length === 0) {
      results.push({
        id: 'cq-000',
        category: 'codeQuality',
        score: 100,
        maxScore: 100,
        severity: 'info',
        title: 'Code quality standards met',
        description: 'Best practices implemented',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }
}
