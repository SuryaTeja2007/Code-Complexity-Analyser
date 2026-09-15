import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const maxCodeLength = Number(process.env.MAX_CODE_LENGTH || 100000);
const supportedLanguages = new Set(['java', 'c', 'cpp', 'python']);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    online: true,
    version: '0.1.0-phase-2',
    analysisEngine: 'api-foundation',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  });
});

app.post('/api/analyze', (req, res) => {
  const { code, language, filename, options } = req.body ?? {};

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Code is required.' });
  }

  if (code.length > maxCodeLength) {
    return res.status(413).json({
      success: false,
      message: `Code is too large. Maximum supported length is ${maxCodeLength.toLocaleString()} characters.`,
    });
  }

  if (typeof language !== 'string' || !supportedLanguages.has(language)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported language. Supported languages are Java, C, C++, and Python.',
    });
  }

  if (filename !== undefined && filename !== null && typeof filename !== 'string') {
    return res.status(400).json({ success: false, message: 'Filename must be a string when provided.' });
  }

  const lines = code.split(/\r?\n/).length;
  const nonEmptyLines = code.split(/\r?\n/).filter((line) => line.trim().length > 0).length;

  return res.json({
    success: true,
    message: 'Backend connection successful. Static analysis and Gemini reasoning are the next analysis-engine phase.',
    analysisReady: false,
    submittedAt: new Date().toISOString(),
    source: {
      language,
      filename: filename || null,
      lines,
      nonEmptyLines,
      characters: code.length,
    },
    options: options ?? {},
  });
});

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(__dirname, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Code Complexity Analyser server running on http://localhost:${port}`);
});
