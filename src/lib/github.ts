/**
 * GitHub API utilities and integration
 */

import { Octokit } from 'octokit';
import { RepositoryInfo } from '@/types';

class GitHubClient {
  private octokit: Octokit;
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({ owner, repo });
      return true;
    } catch {
      return false;
    }
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<RepositoryInfo> {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });

      return {
        owner: data.owner?.login || '',
        repo: data.name,
        url: data.html_url,
        description: data.description || '',
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        language: data.language || 'Unknown',
        lastUpdated: data.updated_at,
        isPrivate: data.private,
        topics: data.topics || [],
      };
    } catch (error) {
      throw new Error(`Failed to fetch repository info: ${error}`);
    }
  }

  async getRepositoryFiles(owner: string, repo: string, path: string = ''): Promise<Array<{ name: string; type: string; path: string }>> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: path || '.',
      });

      if (!Array.isArray(data)) return [];

      return data
        .filter((item) => item.type === 'file' || item.type === 'dir')
        .map((item) => ({
          name: item.name,
          type: item.type,
          path: item.path,
        }));
    } catch (error) {
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (typeof data === 'object' && 'content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return '';
    } catch {
      return '';
    }
  }

  async checkFileExists(owner: string, repo: string, path: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getReadme(owner: string, repo: string): Promise<string> {
    return this.getFileContent(owner, repo, 'README.md').catch(() => '');
  }

  async getLicense(owner: string, repo: string): Promise<string> {
    return this.getFileContent(owner, repo, 'LICENSE').catch(() => '');
  }

  async getPackageJson(owner: string, repo: string): Promise<any> {
    try {
      const content = await this.getFileContent(owner, repo, 'package.json');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getPyprojectToml(owner: string, repo: string): Promise<string> {
    return this.getFileContent(owner, repo, 'pyproject.toml').catch(() => '');
  }

  async getWorkflows(owner: string, repo: string): Promise<string[]> {
    try {
      const files = await this.getRepositoryFiles(owner, repo, '.github/workflows');
      return files.filter((f) => f.name.endsWith('.yml') || f.name.endsWith('.yaml')).map((f) => f.name);
    } catch {
      return [];
    }
  }

  async searchFiles(owner: string, repo: string, query: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.rest.search.code({
        q: `repo:${owner}/${repo} ${query}`,
        per_page: 10,
      });

      return data.items?.map((item: any) => item.path) || [];
    } catch {
      return [];
    }
  }
}

export default GitHubClient;
