export type SupportedLanguage = 'java' | 'c' | 'cpp' | 'python';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  extensions: string[];
  monacoLanguage: string;
  defaultSample: string;
  description: string;
}

export interface AnalysisSubmissionState {
  code: string;
  language: SupportedLanguage;
  timestamp?: string;
  filename?: string;
  status: 'idle' | 'pending_engine' | 'ready';
}

/**
 * Service Layer contracts for future Phase 2+ backend integration.
 * No mock data or fake calculations are performed in Phase 1.
 */
export interface AnalyzeRequest {
  code: string;
  language: SupportedLanguage;
  filename?: string;
  options?: {
    includeAst?: boolean;
    includeOptimizations?: boolean;
    includeCodeSmells?: boolean;
  };
}

export interface AnalysisMetricPlaceholder {
  category: string;
  status: 'pending_engine';
  message: string;
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
  // Future fields for Phase 2:
  // timeComplexity?: string;
  // spaceComplexity?: string;
  // explanations?: string[];
  // metrics?: Record<string, unknown>;
}
