import { AnalyzeRequest, AnalyzeResponse } from '../types';

class AnalyzerService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  async submitForAnalysis(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch {
      throw new Error('Could not connect to the analysis backend. Check that the server is running and your network connection is available, then select Try Again. Your code remains in the editor.');
    }

    let payload: AnalyzeResponse;
    try {
      payload = await response.json();
    } catch {
      throw new Error('The analysis server returned an invalid response.');
    }

    if (!response.ok || !payload.success) {
      if (response.status >= 500) {
        throw new Error(payload.message || `The analysis backend returned a server error (HTTP ${response.status}). Your code remains in the editor; please try again shortly.`);
      }
      throw new Error(payload.message || `The analysis request failed (HTTP ${response.status}). Check the code and try again.`);
    }

    return payload;
  }

  async checkEngineStatus(): Promise<{ online: boolean; version?: string; aiConfigured?: boolean; aiModel?: unknown }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const payload = await response.json();
      return {
        online: response.ok && Boolean(payload.online),
        version: payload.version,
        aiConfigured: payload.aiConfigured,
        aiModel: payload.aiModel,
      };
    } catch {
      return { online: false };
    }
  }
}

export const analyzerService = new AnalyzerService();
