/**
 * Dependencies Analyzer - Analyzes dependencies for outdated and security issues
 */

import { AnalysisResult } from '@/types';
import GitHubClient from '@/lib/github';

export class DependenciesAnalyzer {
  private github: GitHubClient;

  constructor(token?: string) {
    this.github = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let score = 100;

    // Check for package.json (Node.js)
    const packageJson = await this.github.getPackageJson(owner, repo);
    if (packageJson) {
      const packageResults = await this.analyzeNodeDependencies(packageJson);
      results.push(...packageResults);
      score -= packageResults.reduce((sum, r) => sum + (r.maxScore - r.score), 0);
    }

    // Check for requirements.txt (Python)
    const hasRequirements = await this.github.checkFileExists(owner, repo, 'requirements.txt');
    if (hasRequirements) {
      try {
        const content = await this.github.getFileContent(owner, repo, 'requirements.txt');
        const pythonResults = await this.analyzePythonDependencies(content);
        results.push(...pythonResults);
        score -= pythonResults.reduce((sum, r) => sum + (r.maxScore - r.score), 0);
      } catch {
        // Silently fail
      }
    }

    // Check for Gemfile (Ruby)
    const hasGemfile = await this.github.checkFileExists(owner, repo, 'Gemfile');
    if (hasGemfile) {
      results.push({
        id: 'dep-003',
        category: 'dependencies',
        score: 20,
        maxScore: 20,
        severity: 'info',
        title: 'Ruby dependencies detected',
        description: 'Gemfile found - Ruby dependencies are managed',
        recommendation: 'Keep gems updated and review Gemfile.lock',
        fileLocation: 'Gemfile',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for dependency lock files
    const lockFiles = [
      { name: 'package-lock.json', type: 'npm' },
      { name: 'yarn.lock', type: 'yarn' },
      { name: 'pnpm-lock.yaml', type: 'pnpm' },
      { name: 'Gemfile.lock', type: 'bundler' },
      { name: 'poetry.lock', type: 'poetry' },
      { name: 'Cargo.lock', type: 'cargo' },
    ];

    let hasLockFile = false;
    for (const lockFile of lockFiles) {
      if (await this.github.checkFileExists(owner, repo, lockFile.name)) {
        hasLockFile = true;
        results.push({
          id: 'dep-004',
          category: 'dependencies',
          score: 15,
          maxScore: 15,
          severity: 'info',
          title: 'Dependency lock file found',
          description: `${lockFile.name} found - dependencies are locked to specific versions`,
          recommendation: 'Commit lock files to version control',
          fileLocation: lockFile.name,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    if (!hasLockFile) {
      score -= 15;
      results.push({
        id: 'dep-004',
        category: 'dependencies',
        score: 0,
        maxScore: 15,
        severity: 'medium',
        title: 'No dependency lock file found',
        description: 'Lock file not detected - dependency versions may vary',
        recommendation: 'Generate and commit a lock file (package-lock.json, yarn.lock, etc.)',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for .dependabot.yml or Renovate config
    const hasDependabot = await this.github.checkFileExists(owner, repo, '.github/dependabot.yml');
    const hasRenovate = await this.github.checkFileExists(owner, repo, 'renovate.json');

    if (hasDependabot || hasRenovate) {
      results.push({
        id: 'dep-005',
        category: 'dependencies',
        score: 20,
        maxScore: 20,
        severity: 'info',
        title: 'Automated dependency updates configured',
        description: `${hasDependabot ? 'Dependabot' : 'Renovate'} is configured for automatic updates`,
        recommendation: 'Review and merge automated dependency update PRs regularly',
        fileLocation: hasDependabot ? '.github/dependabot.yml' : 'renovate.json',
        timestamp: new Date().toISOString(),
      });
    } else {
      score -= 20;
      results.push({
        id: 'dep-005',
        category: 'dependencies',
        score: 0,
        maxScore: 20,
        severity: 'medium',
        title: 'Automated dependency updates not configured',
        description: 'Neither Dependabot nor Renovate is configured',
        recommendation: 'Set up Dependabot or Renovate for automated dependency updates',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for SBOM (Software Bill of Materials)
    const hasSbom = await this.github.checkFileExists(owner, repo, 'sbom.json') ||
                    await this.github.checkFileExists(owner, repo, 'sbom.xml') ||
                    await this.github.checkFileExists(owner, repo, '.github/dependabot.json');

    if (!hasSbom) {
      score -= 10;
      results.push({
        id: 'dep-006',
        category: 'dependencies',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'No SBOM found',
        description: 'Software Bill of Materials not detected',
        recommendation: 'Generate SBOM for supply chain security',
        timestamp: new Date().toISOString(),
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    if (results.length === 0) {
      results.push({
        id: 'dep-000',
        category: 'dependencies',
        score: 100,
        maxScore: 100,
        severity: 'info',
        title: 'Dependencies well managed',
        description: 'Dependency management best practices are implemented',
        recommendation: 'Continue keeping dependencies updated',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  private async analyzeNodeDependencies(packageJson: any): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    // Check for security-related packages
    const securityPackages = [
      'helmet',
      'express-rate-limit',
      'dotenv',
      'bcrypt',
      'jsonwebtoken',
    ];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let securityCount = 0;
    for (const pkg of securityPackages) {
      if (allDeps[pkg]) {
        securityCount++;
      }
    }

    if (securityCount > 0) {
      results.push({
        id: 'dep-001',
        category: 'dependencies',
        score: Math.min(20, securityCount * 5),
        maxScore: 20,
        severity: 'info',
        title: 'Security packages detected',
        description: `Found ${securityCount} security-related packages`,
        recommendation: 'Ensure all security packages are up to date',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for testing frameworks
    const testingPackages = ['jest', 'mocha', 'vitest', '@testing-library/react'];
    let testingCount = 0;
    for (const pkg of testingPackages) {
      if (allDeps[pkg]) {
        testingCount++;
      }
    }

    if (testingCount > 0) {
      results.push({
        id: 'dep-002',
        category: 'dependencies',
        score: 15,
        maxScore: 15,
        severity: 'info',
        title: 'Testing framework included',
        description: `Found ${testingCount} testing framework(s)`,
        recommendation: 'Maintain testing dependencies for CI/CD',
        timestamp: new Date().toISOString(),
      });
    } else {
      results.push({
        id: 'dep-002',
        category: 'dependencies',
        score: 0,
        maxScore: 15,
        severity: 'medium',
        title: 'No testing framework found',
        description: 'No testing dependencies detected in package.json',
        recommendation: 'Add a testing framework (Jest, Vitest, Mocha)',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  private async analyzePythonDependencies(content: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    // Check for pinned versions
    const lines = content.split('\n');
    const pinnedCount = lines.filter((line) => /==|>=|<=/.test(line)).length;

    if (pinnedCount > 0) {
      results.push({
        id: 'dep-007',
        category: 'dependencies',
        score: 10,
        maxScore: 10,
        severity: 'info',
        title: 'Python dependencies have version constraints',
        description: `Found ${pinnedCount} packages with version constraints`,
        recommendation: 'Consider using pin versions (==) for production stability',
        fileLocation: 'requirements.txt',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }
}
