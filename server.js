import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const maxCodeLength = Number(process.env.MAX_CODE_LENGTH || 100000);
const supportedLanguages = new Set(['java', 'c', 'cpp', 'python']);
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function lineNumber(code, index) {
  return code.slice(0, index).split(/\r?\n/).length;
}

function estimateNesting(code, language) {
  if (language === 'python') {
    let depth = 0;
    let maxDepth = 0;
    for (const line of code.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const spaces = (line.match(/^\s*/) || [''])[0].replace(/\t/g, '    ').length;
      const level = Math.floor(spaces / 4);
      depth = level;
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
  }
  let depth = 0;
  let maxDepth = 0;
  for (const ch of code) {
    if (ch === '{') { depth += 1; maxDepth = Math.max(maxDepth, depth); }
    if (ch === '}') depth = Math.max(0, depth - 1);
  }
  return maxDepth;
}

function analyzeStatically(code, language) {
  const lines = code.split(/\r?\n/);
  const loopMatches = [...code.matchAll(/\b(for|while|do)\b/g)];
  const branchMatches = [...code.matchAll(/\b(if|else\s+if|switch|case|catch)\b|\?/g)];
  const functionMatches = language === 'python'
    ? [...code.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)]
    : [...code.matchAll(/\b(?:public|private|protected|static|inline|virtual|final|async|const)?\s*[A-Za-z_][\w:<>,\[\]]*\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g)];
  const functions = functionMatches.map((m) => m[1]).filter(Boolean);
  const recursiveFunctionCount = functions.filter((name) => {
    const bodyPattern = language === 'python'
      ? new RegExp(`^\\s*def\\s+${name}\\b[\\s\\S]*?(?=^\\s*def\\s+|$)`, 'm')
      : new RegExp(`(?:${name}\\s*\\([^)]*\\)[^{]*\\{)([\\s\\S]*?)(?=\\n\\s*\\}|$)`, 'm');
    const body = code.match(bodyPattern)?.[0] || '';
    return new RegExp(`\\b${name}\\s*\\(`).test(body.replace(/^(?:.|\n)*?\{/, ''));
  }).length;
  const variableMatches = code.match(/\b(?:int|long|float|double|char|boolean|bool|string|String|auto|var|let|const)\s+[A-Za-z_]\w*/g) || [];
  const collectionMatches = code.match(/\b(?:new\s+(?:ArrayList|HashMap|HashSet|Vector|LinkedList)|\[\s*\]|\b(?:list|dict|set)\s*\()/g) || [];
  const maxNestingDepth = estimateNesting(code, language);
  const loopCount = loopMatches.length;
  const branchCount = branchMatches.length;
  const functionCount = functions.length;
  const cyclomaticComplexity = 1 + branchCount + loopCount + recursiveFunctionCount;

  let timeComplexity = 'O(1)';
  let confidence = 'medium';
  if (recursiveFunctionCount > 0) {
    timeComplexity = recursiveFunctionCount > 1 ? 'O(2^n) (approx.)' : 'O(n) to O(2^n) (depends on recursion branching)';
    confidence = 'low';
  } else if (loopCount >= 3 || maxNestingDepth >= 3) {
    timeComplexity = `O(n^${Math.min(3, Math.max(2, maxNestingDepth))}) (approx.)`;
    confidence = 'medium';
  } else if (loopCount === 2) {
    timeComplexity = 'O(n²) (approx.)';
    confidence = 'medium';
  } else if (loopCount === 1) {
    timeComplexity = 'O(n) (approx.)';
    confidence = 'medium';
  } else if (/\b(?:sort|sorted|Arrays\.sort)\s*\(/.test(code)) {
    timeComplexity = 'O(n log n) (operation-dependent)';
    confidence = 'low';
  }

  const spaceComplexity = recursiveFunctionCount > 0 || collectionMatches.length > 0 ? 'O(n) (approx.)' : 'O(1)';
  const smells = [];
  if (maxNestingDepth >= 4) smells.push({ severity: 'high', message: 'Deep control-flow nesting may reduce readability and maintainability.' });
  if (branchCount >= 8) smells.push({ severity: 'medium', message: 'High branch count increases decision complexity.' });
  if (lines.length > 120) smells.push({ severity: 'medium', message: 'Large source file may benefit from decomposition into smaller modules.' });
  if (functions.some((name) => {
    const start = code.indexOf(name);
    return lines.slice(lineNumber(code, start) - 1, lineNumber(code, start) + 50).length > 40;
  })) smells.push({ severity: 'medium', message: 'At least one function appears long; consider extracting cohesive helpers.' });

  const suggestions = [];
  if (loopCount >= 2) suggestions.push('Review nested loops and determine whether the inner work can be reduced, indexed, or precomputed.');
  if (collectionMatches.length > 0) suggestions.push('Choose collection types according to the dominant access pattern rather than using a single structure everywhere.');
  if (branchCount >= 6) suggestions.push('Consider simplifying complex conditional paths into smaller functions or clearer guard clauses.');
  if (suggestions.length === 0) suggestions.push('The current structure has no obvious structural optimization from this lightweight static pass.');

  return {
    timeComplexity,
    spaceComplexity,
    confidence,
    explanation: `Static inspection found ${loopCount} loop construct(s), ${branchCount} branch construct(s), ${functionCount} function(s), and an estimated maximum nesting depth of ${maxNestingDepth}. Complexity is an approximation because source-only analysis cannot know runtime input distributions or hidden library costs.`,
    metrics: {
      loopCount,
      maxNestingDepth,
      branchCount,
      functionCount,
      recursiveFunctionCount,
      variableCount: variableMatches.length,
      cyclomaticComplexity,
      collectionAllocations: collectionMatches.length,
    },
    codeSmells: smells,
    suggestions,
  };
}

async function askGemini(code, language, staticAnalysis) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { available: false, error: 'Gemini API key is not configured.' };

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a code-complexity reviewer. Analyze this ${language} source without executing it. Use the deterministic static findings below as evidence, but correct them when the source clearly contradicts them. Do not invent runtime facts. Return ONLY valid JSON with keys summary, explanation, suggestions (array), confidence (high|medium|low). Keep suggestions concrete and conditional.\n\nStatic findings:\n${JSON.stringify(staticAnalysis)}\n\nSource:\n${code}`;
  try {
    const response = await ai.models.generateContent({ model: geminiModel, contents: prompt, config: { responseMimeType: 'application/json' } });
    const text = response.text || '{}';
    const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
    return {
      available: true,
      model: geminiModel,
      summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : undefined,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((x) => typeof x === 'string').slice(0, 8) : [],
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error instanceof Error ? error.message : error);
    return { available: false, model: geminiModel, error: 'Gemini analysis was unavailable. Static analysis results are still shown.' };
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, online: true, version: '0.2.0-analysis', analysisEngine: 'static-plus-gemini', geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) });
});

app.post('/api/analyze', async (req, res) => {
  const { code, language, filename, options } = req.body ?? {};
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ success: false, message: 'Code is required.' });
  if (code.length > maxCodeLength) return res.status(413).json({ success: false, message: `Code is too large. Maximum supported length is ${maxCodeLength.toLocaleString()} characters.` });
  if (typeof language !== 'string' || !supportedLanguages.has(language)) return res.status(400).json({ success: false, message: 'Unsupported language. Supported languages are Java, C, C++, and Python.' });
  if (filename !== undefined && filename !== null && typeof filename !== 'string') return res.status(400).json({ success: false, message: 'Filename must be a string when provided.' });

  const staticAnalysis = analyzeStatically(code, language);
  const gemini = await askGemini(code, language, staticAnalysis);
  const lines = code.split(/\r?\n/);
  return res.json({
    success: true,
    message: gemini.available ? 'Static analysis completed and Gemini review added.' : 'Static analysis completed. Gemini review is unavailable for this request.',
    analysisReady: true,
    submittedAt: new Date().toISOString(),
    source: { language, filename: filename || null, lines: lines.length, nonEmptyLines: lines.filter((line) => line.trim()).length, characters: code.length },
    staticAnalysis,
    gemini,
    options: options ?? {},
  });
});

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  const vite = await createViteServer({ configFile: path.join(__dirname, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.listen(port, '0.0.0.0', () => console.log(`Code Complexity Analyser server running on http://localhost:${port}`));
