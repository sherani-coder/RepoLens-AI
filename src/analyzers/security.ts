/**
 * Security Analyzer - Detects security issues in repositories
 */

import { AnalysisResult } from '@/types';
import GitHubClient from '@/lib/github';

export class SecurityAnalyzer {
  private github: GitHubClient;

  constructor(token?: string) {
    this.github = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let score = 100;

    // Check for SECURITY.md
    const hasSecurityMd = await this.github.checkFileExists(owner, repo, 'SECURITY.md');
    if (!hasSecurityMd) {
      score -= 15;
      results.push({
        id: 'sec-001',
        category: 'security',
        score: 0,
        maxScore: 15,
        severity: 'medium',
        title: 'Missing SECURITY.md',
        description: 'No SECURITY.md file found for reporting vulnerabilities',
        recommendation: 'Create a SECURITY.md file with vulnerability reporting guidelines',
        documentationUrl: 'https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for exposed secrets patterns
    try {
      const secretPatterns = [
        'PRIVATE_KEY',
        'SECRET_KEY',
        'API_KEY',
        'PASSWORD',
        'TOKEN',
        'aws_access_key_id',
        'aws_secret_access_key',
      ];

      // Search for potential secrets in common config files
      const configFiles = [
        '.env',
        '.env.local',
        'config.js',
        'secrets.json',
      ];

      for (const file of configFiles) {
        const exists = await this.github.checkFileExists(owner, repo, file);
        if (exists) {
          score -= 20;
          results.push({
            id: 'sec-002',
            category: 'security',
            score: 0,
            maxScore: 20,
            severity: 'critical',
            title: 'Sensitive configuration file found',
            description: `Found ${file} in repository root - this should not be committed`,
            recommendation: 'Remove sensitive files from repository and use .gitignore',
            fileLocation: file,
            documentationUrl: 'https://git-scm.com/docs/gitignore',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      // Silently fail on search errors
    }

    // Check for LICENSE
    const hasLicense = await this.github.checkFileExists(owner, repo, 'LICENSE');
    if (!hasLicense) {
      score -= 10;
      results.push({
        id: 'sec-003',
        category: 'security',
        score: 0,
        maxScore: 10,
        severity: 'low',
        title: 'Missing LICENSE file',
        description: 'No LICENSE file found - legal clarity is important',
        recommendation: 'Add a LICENSE file (MIT, Apache 2.0, GPL, etc.)',
        documentationUrl: 'https://choosealicense.com',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for branch protection
    try {
      // This would require more GitHub API calls
      // For now, we'll note it as a recommendation
      results.push({
        id: 'sec-004',
        category: 'security',
        score: 50,
        maxScore: 100,
        severity: 'info',
        title: 'Branch protection settings',
        description: 'Unable to verify branch protection rules from public API',
        recommendation: 'Enable branch protection on main/master branch',
        documentationUrl: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail
    }

    // Check for dependabot
    const hasDependabot = await this.github.checkFileExists(owner, repo, '.github/dependabot.yml');
    if (!hasDependabot) {
      score -= 5;
      results.push({
        id: 'sec-005',
        category: 'security',
        score: 0,
        maxScore: 5,
        severity: 'low',
        title: 'Dependabot not configured',
        description: 'No Dependabot configuration found for automated dependency updates',
        recommendation: 'Enable Dependabot for automated security updates',
        documentationUrl: 'https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates',
        timestamp: new Date().toISOString(),
      });
    }

    // Overall security score
    if (results.length === 0) {
      results.push({
        id: 'sec-000',
        category: 'security',
        score: 95,
        maxScore: 100,
        severity: 'info',
        title: 'Security checks passed',
        description: 'No obvious security issues detected',
        recommendation: 'Continue monitoring for vulnerabilities',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }
}
