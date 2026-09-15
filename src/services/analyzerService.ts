import { AnalyzeRequest, AnalyzeResponse } from '../types';

/**
 * Service Layer: AnalyzerService
 *
 * Prepared for Phase 2 integration when the backend analysis engine
 * (AST analysis, static analysis, Gemini API) is connected to POST /analyze.
 *
 * NOTE: For Phase 1, this service acts as the client contract boundary
 * without executing mock or simulated analysis.
 */
class AnalyzerService {
  private apiBaseUrl: string;

  constructor() {
    // Configurable endpoint prefix for future backend deployment
    this.apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Future Phase 2 backend analysis caller:
   * Will dispatch to POST /api/analyze (or POST /analyze)
   */
  async submitForAnalysis(_request: AnalyzeRequest): Promise<AnalyzeResponse> {
    // In Phase 1, the backend is not yet implemented.
    // This signature guarantees architectural readiness without simulated calculations.
    return {
      success: true,
      message: 'Analysis engine will be connected in Phase 2.',
    };
  }

  /**
   * Healthcheck or status verification for future backend connectivity
   */
  async checkEngineStatus(): Promise<{ online: boolean; version?: string }> {
    return {
      online: false,
      version: 'Phase 1 Frontend Foundation',
    };
  }
}

export const analyzerService = new AnalyzerService();
