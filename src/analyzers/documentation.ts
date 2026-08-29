/**
 * Documentation Analyzer - Evaluates repository documentation quality
 */

import { AnalysisResult } from '@/types';
import GitHubClient from '@/lib/github';

export class DocumentationAnalyzer {
  private github: GitHubClient;

  constructor(token?: string) {
    this.github = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let score = 100;

    // Check for README
    const readme = await this.github.getReadme(owner, repo);
    if (!readme || readme.length === 0) {
      score -= 30;
      results.push({
        id: 'doc-001',
        category: 'documentation',
        score: 0,
        maxScore: 30,
        severity: 'high',
        title: 'Missing README.md',
        description: 'No README.md file found - essential for project documentation',
        recommendation: 'Create a comprehensive README.md with project description, installation, and usage',
        fileLocation: 'README.md',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Analyze README quality
      const readmeQuality = this.analyzeReadmeQuality(readme);
      if (readmeQuality < 100) {
        const deduction = 100 - readmeQuality;
        score -= deduction * 0.3; // Partial deduction
        results.push({
          id: 'doc-002',
          category: 'documentation',
          score: readmeQuality,
          maxScore: 100,
          severity: readmeQuality < 50 ? 'high' : 'medium',
          title: 'README.md could be improved',
          description: `README.md quality score: ${readmeQuality}%`,
          recommendation: 'Add missing sections: installation, usage examples, configuration',
          fileLocation: 'README.md',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for CONTRIBUTING.md
    const hasContributing = await this.github.checkFileExists(owner, repo, 'CONTRIBUTING.md');
    if (!hasContributing) {
      score -= 15;
      results.push({
        id: 'doc-003',
        category: 'documentation',
        score: 0,
        maxScore: 15,
        severity: 'medium',
        title: 'Missing CONTRIBUTING.md',
        description: 'No CONTRIBUTING.md file found - important for community contributions',
        recommendation: 'Create CONTRIBUTING.md with guidelines for contributors',
        fileLocation: 'CONTRIBUTING.md',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for CODE_OF_CONDUCT.md
    const hasCodeOfConduct = await this.github.checkFileExists(owner, repo, 'CODE_OF_CONDUCT.md');
    if (!hasCodeOfConduct) {
      score -= 10;
      results.push({
        id: 'doc-004',
        category: 'documentation',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'Missing CODE_OF_CONDUCT.md',
        description: 'No CODE_OF_CONDUCT.md file found - important for community standards',
        recommendation: 'Add CODE_OF_CONDUCT.md to establish community standards',
        fileLocation: 'CODE_OF_CONDUCT.md',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for CHANGELOG.md
    const hasChangelog = await this.github.checkFileExists(owner, repo, 'CHANGELOG.md');
    if (!hasChangelog) {
      score -= 10;
      results.push({
        id: 'doc-005',
        category: 'documentation',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'Missing CHANGELOG.md',
        description: 'No CHANGELOG.md file found - useful for tracking changes',
        recommendation: 'Create CHANGELOG.md to track version changes and updates',
        fileLocation: 'CHANGELOG.md',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for API documentation
    const hasApiDocs = await this.github.checkFileExists(owner, repo, 'docs/API.md') ||
                       await this.github.checkFileExists(owner, repo, 'API.md');
    if (!hasApiDocs) {
      score -= 5;
      results.push({
        id: 'doc-006',
        category: 'documentation',
        score: 0,
        maxScore: 5,
        severity: 'info',
        title: 'No API documentation found',
        description: 'API documentation would be helpful if this is a library',
        recommendation: 'Create API.md or docs/API.md with API reference',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for docs directory
    const docsFiles = await this.github.getRepositoryFiles(owner, repo, 'docs');
    if (docsFiles.length === 0) {
      score -= 5;
      results.push({
        id: 'doc-007',
        category: 'documentation',
        score: 0,
        maxScore: 5,
        severity: 'info',
        title: 'No docs directory found',
        description: 'Documentation directory not found - useful for organizing docs',
        recommendation: 'Create a docs/ directory for additional documentation',
        timestamp: new Date().toISOString(),
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    if (results.length === 0) {
      results.push({
        id: 'doc-000',
        category: 'documentation',
        score: 95,
        maxScore: 100,
        severity: 'info',
        title: 'Documentation is comprehensive',
        description: 'Found all expected documentation files',
        recommendation: 'Continue maintaining documentation quality',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  private analyzeReadmeQuality(readme: string): number {
    let score = 50; // Start with base score

    // Check for key sections
    const sections = [
      { pattern: /installation|setup/i, points: 15 },
      { pattern: /usage|getting started/i, points: 15 },
      { pattern: /features|description/i, points: 10 },
      { pattern: /contribution|contributing/i, points: 10 },
      { pattern: /license/i, points: 5 },
      { pattern: /example|demo/i, points: 10 },
      { pattern: /configuration|config/i, points: 10 },
      { pattern: /api|endpoint|method/i, points: 10 },
    ];

    for (const section of sections) {
      if (section.pattern.test(readme)) {
        score += section.points;
      }
    }

    // Check for code examples
    if (/```[\s\S]*?```/m.test(readme)) {
      score += 10;
    }

    // Check for badges
    if (/\!\[.*\]\(.*\)/g.test(readme)) {
      score += 5;
    }

    return Math.min(100, score);
  }
}
