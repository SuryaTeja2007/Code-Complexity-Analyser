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

export interface StaticAnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  metrics: {
    loopCount: number;
    maxNestingDepth: number;
    branchCount: number;
    functionCount: number;
    recursiveFunctionCount: number;
    variableCount: number;
    cyclomaticComplexity: number;
    collectionAllocations: number;
  };
  codeSmells: Array<{ severity: 'low' | 'medium' | 'high'; message: string; line?: number }>;
  suggestions: string[];
}

export interface GeminiAnalysisResult {
  available: boolean;
  model?: string;
  summary?: string;
  suggestions?: string[];
  explanation?: string;
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
  analysisReady?: boolean;
  submittedAt?: string;
  source?: AnalysisSourceSummary;
  staticAnalysis?: StaticAnalysisResult;
  gemini?: GeminiAnalysisResult;
  options?: AnalyzeRequest['options'];
}
