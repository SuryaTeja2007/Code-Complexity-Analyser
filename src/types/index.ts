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

export interface AnalysisSourceSummary {
  language: SupportedLanguage;
  filename: string | null;
  lines: number;
  nonEmptyLines: number;
  characters: number;
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
  analysisReady?: boolean;
  submittedAt?: string;
  source?: AnalysisSourceSummary;
  options?: AnalyzeRequest['options'];
}
