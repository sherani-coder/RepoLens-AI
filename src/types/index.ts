/**
 * Core type definitions for RepoLens AI
 */

export interface RepositoryInfo {
  owner: string;
  repo: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  lastUpdated: string;
  isPrivate: boolean;
  topics: string[];
}

export interface AnalysisScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
}

export interface AnalysisResult {
  id: string;
  category: string;
  score: number;
  maxScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  fileLocation?: string;
  lineNumber?: number;
  documentationUrl?: string;
  timestamp: string;
}

export interface HealthReport {
  repositoryInfo: RepositoryInfo;
  overallScore: number;
  scores: {
    security: number;
    codeQuality: number;
    testing: number;
    documentation: number;
    dependencies: number;
    architecture: number;
    performance: number;
    maintainability: number;
  };
  categories: {
    security: AnalysisResult[];
    codeQuality: AnalysisResult[];
    testing: AnalysisResult[];
    documentation: AnalysisResult[];
    dependencies: AnalysisResult[];
    architecture: AnalysisResult[];
    performance: AnalysisResult[];
    maintainability: AnalysisResult[];
  };
  recommendations: string[];
  generatedAt: string;
  analyzedFiles: string[];
}

export interface AnalyzerConfig {
  maxFileSize: number;
  maxFiles: number;
  timeout: number;
  githubToken?: string;
}

export interface AnalysisRequest {
  repository: string;
  includeAI?: boolean;
  format?: 'json' | 'html' | 'markdown';
}

export interface AnalysisResponse {
  success: boolean;
  data?: HealthReport;
  error?: string;
  message?: string;
}
