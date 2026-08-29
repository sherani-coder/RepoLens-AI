/**
 * Scoring Engine - Calculates health scores based on analysis results
 */

import { AnalysisResult, HealthReport } from '@/types';

interface ScoreWeight {
  security: number;
  codeQuality: number;
  testing: number;
  documentation: number;
  dependencies: number;
  architecture: number;
  performance: number;
  maintainability: number;
}

const DEFAULT_WEIGHTS: ScoreWeight = {
  security: 0.20,
  codeQuality: 0.20,
  testing: 0.15,
  documentation: 0.15,
  dependencies: 0.10,
  architecture: 0.10,
  performance: 0.05,
  maintainability: 0.05,
};

export class ScoringEngine {
  private weights: ScoreWeight;

  constructor(weights: Partial<ScoreWeight> = {}) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  calculateCategoryScore(results: AnalysisResult[]): number {
    if (results.length === 0) return 100;

    const totalScore = results.reduce((sum, result) => {
      return sum + (result.score / result.maxScore) * 100;
    }, 0);

    return Math.round(totalScore / results.length);
  }

  calculateOverallScore(categoryScores: Record<string, number>): number {
    let totalScore = 0;

    for (const [category, score] of Object.entries(categoryScores)) {
      const weight = this.weights[category as keyof ScoreWeight] || 0;
      totalScore += score * weight;
    }

    return Math.round(totalScore);
  }

  getSeverityDeduction(severity: string): number {
    const deductions: Record<string, number> = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5,
      info: 2,
    };
    return deductions[severity] || 0;
  }

  explainScore(score: number): string {
    if (score >= 90) return 'Excellent - Your repository is in great shape!';
    if (score >= 80) return 'Good - Minor improvements recommended';
    if (score >= 70) return 'Fair - Several areas need attention';
    if (score >= 60) return 'Poor - Significant improvements needed';
    return 'Critical - Urgent action required';
  }

  getScoreBadgeColor(score: number): string {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    if (score >= 60) return '#ef4444';
    return '#dc2626';
  }
}

export default new ScoringEngine();
