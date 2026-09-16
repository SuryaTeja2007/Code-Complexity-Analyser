import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { recommendOptimizations, recommendationModelInfo } from './ml/recommendationModel.js';
import { executeSourceCode, executionInfo } from './server/codeExecution.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const maxCodeLength = Number(process.env.MAX_CODE_LENGTH || 100000);
const supportedLanguages = new Set(['java', 'c', 'cpp', 'python']);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function lineNumber(code, index) {
  return code.slice(0, index).split(/\r?\n/).length;
}

function estimateNesting(code, language) {
  if (language === 'python') {
    let maxDepth = 0;
    for (const line of code.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const spaces = (line.match(/^\s*/) || [''])[0].replace(/\t/g, '    ').length;
      maxDepth = Math.max(maxDepth, Math.floor(spaces / 4));
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

function estimateLoopNesting(code, language) {
  if (language === 'python') {
    let maxDepth = 0;
    const stack = [];
    for (const line of code.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const indent = (line.match(/^\s*/) || [''])[0].replace(/\t/g, '    ').length;
      while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
      if (/^\s*(for|while)\b/.test(line)) {
        stack.push(indent);
        maxDepth = Math.max(maxDepth, stack.length);
      }
    }
    return maxDepth;
  }

  const braceStack = [];
  let loopDepth = 0;
  let maxLoopDepth = 0;
  for (const line of code.split(/\r?\n/)) {
    const loopMatch = line.match(/\b(for|while|do)\b/);
    const loopBodyStarts = Boolean(loopMatch && line.slice(loopMatch.index).includes('{'));
    let loopBodyMarked = false;

    for (const ch of line) {
      if (ch === '{') {
        const isLoopBody = loopBodyStarts && !loopBodyMarked;
        braceStack.push(isLoopBody);
        if (isLoopBody) {
          loopBodyMarked = true;
          loopDepth += 1;
          maxLoopDepth = Math.max(maxLoopDepth, loopDepth);
        }
      } else if (ch === '}' && braceStack.length) {
        if (braceStack.pop()) loopDepth = Math.max(0, loopDepth - 1);
      }
    }
  }
  return maxLoopDepth;
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
    const fn = language === 'python'
      ? new RegExp(`^\\s*def\\s+${name}\\b[\\s\\S]*?(?=^\\s*def\\s+|$)`, 'm').exec(code)?.[0] || ''
      : code;
    return new RegExp(`\\b${name}\\s*\\(`).test(fn);
  }).length;
  const loopCount = loopMatches.length;
  const maxNestingDepth = estimateNesting(code, language);
  const maxLoopNesting = estimateLoopNesting(code, language);
  const branchCount = branchMatches.length;
  const variableMatches = language === 'python'
    ? [...code.matchAll(/\b(?:[A-Za-z_]\w*)\s*=/g)]
    : [...code.matchAll(/\b(?:int|long|float|double|char|boolean|bool|string|String|auto|size_t)\s+[A-Za-z_]\w*/g)];
  const variableCount = variableMatches.length;
  const collectionMatches = code.match(/\b(?:vector|list|map|unordered_map|set|unordered_set|ArrayList|HashMap|HashSet|LinkedList|List|Dict|Set)\b|\[\s*\]|\b(?:malloc|calloc|realloc|new)\b/g) || [];
  const collectionAllocations = collectionMatches.length;
  const cyclomaticComplexity = 1 + branchCount + loopCount;

  let timeComplexity = 'O(1)';
  if (maxLoopNesting >= 3) timeComplexity = 'O(n³)';
  else if (maxLoopNesting === 2) timeComplexity = 'O(n²)';
  else if (loopCount >= 2) timeComplexity = 'O(n²)';
  else if (loopCount === 1) timeComplexity = 'O(n)';
  if (/\b(?:sort|sorted|Arrays\.sort|std::sort)\s*\(/i.test(code) && loopCount <= 1) timeComplexity = 'O(n log n)';
  if (/\b(?:binary.?search|lower_bound|upper_bound)\b/i.test(code) && loopCount === 0) timeComplexity = 'O(log n)';
  if (recursiveFunctionCount > 0 && /\b(?:fibonacci|fib|subset|permutation|backtrack)\b/i.test(code)) timeComplexity = 'O(2^n)';

  let spaceComplexity = collectionAllocations > 0 ? 'O(n)' : 'O(1)';
  if (recursiveFunctionCount > 0) spaceComplexity = 'O(n)';

  const confidence = (maxLoopNesting >= 1 || loopCount > 0 || recursiveFunctionCount > 0) ? 'medium' : 'low';
  const smells = [];
  if (maxNestingDepth >= 4) smells.push({ severity: 'high', message: 'Deep nesting makes this code harder to read and maintain.' });
  if (cyclomaticComplexity >= 8) smells.push({ severity: 'medium', message: 'High cyclomatic complexity indicates many independent execution paths.' });
  if (lines.length > 120) smells.push({ severity: 'low', message: 'Large source file; consider splitting responsibilities into smaller functions or modules.' });
  const suggestions = [];
  if (maxLoopNesting >= 2) suggestions.push('Consider reducing nested traversal or using a more direct data structure.');
  if (loopCount >= 2) suggestions.push('Check whether repeated passes can be combined safely.');
  if (collectionAllocations >= 2) suggestions.push('Review collection allocations to avoid unnecessary memory usage.');
  if (suggestions.length === 0) suggestions.push('No major structural optimization was detected from the static scan.');

  return {
    timeComplexity,
    spaceComplexity,
    confidence,
    explanation: `Estimated from ${loopCount} loop(s), maximum loop nesting of ${maxLoopNesting}, ${branchCount} branch(es), and ${recursiveFunctionCount} recursive function(s).`,
    metrics: {
      loopCount,
      maxNestingDepth,
      maxLoopNesting,
      branchCount,
      functionCount: functions.length,
      recursiveFunctionCount,
      variableCount,
      cyclomaticComplexity,
      collectionAllocations,
    },
    codeSmells: smells,
    suggestions,
  };
}

function extractOptimizationFeatures(code, language, staticAnalysis) {
  const normalized = code.toLowerCase();
  const repeatedSearch = /\b(indexof|find|search|contains|includes|findindex|linear search)\b/.test(normalized)
    || /for\s*\([^)]*\)[\s\S]{0,500}(?:==|===|equals\s*\()/.test(normalized);
  const sorting = /\b(sort|sorted|arrays\.sort|std::sort)\s*\(/.test(normalized);
  const binarySearch = /\b(binary.?search|lower_bound|upper_bound)\b/.test(normalized);
  const repeatedComputation = /(?:Math\.|math\.|pow\s*\(|sqrt\s*\(|factorial|fibonacci)/.test(normalized)
    && staticAnalysis.loopCount > 0;
  const largeAllocation = staticAnalysis.metrics.collectionAllocations >= 2
    || /\b(?:malloc|calloc|realloc|new\s+\w+\s*\[|new\s+ArrayList|new\s+HashMap)\b/.test(normalized);
  const unnecessaryTraversal = staticAnalysis.loopCount >= 2
    || /\.forEach\s*\(|\.map\s*\(|\.filter\s*\(/.test(normalized);
  const spacePressure = largeAllocation || staticAnalysis.metrics.collectionAllocations >= 2 || staticAnalysis.metrics.recursiveFunctionCount > 0;
  const branchDepth = Math.min(1, staticAnalysis.metrics.maxNestingDepth / 4);
  const linearScan = staticAnalysis.loopCount > 0 || repeatedSearch;

  return {
    nestedLoops: staticAnalysis.metrics.maxLoopNesting >= 2 ? Math.min(1, staticAnalysis.metrics.maxLoopNesting / 2) : 0,
    repeatedSearch: repeatedSearch ? 1 : 0,
    sorting: sorting ? 1 : 0,
    binarySearch: binarySearch ? 1 : 0,
    recursion: staticAnalysis.metrics.recursiveFunctionCount > 0 ? 1 : 0,
    largeAllocation: largeAllocation ? 1 : 0,
    repeatedComputation: repeatedComputation ? 1 : 0,
    unnecessaryTraversal: unnecessaryTraversal ? 1 : 0,
    collectionUsage: Math.min(1, staticAnalysis.metrics.collectionAllocations / 2),
    spacePressure: spacePressure ? 1 : 0,
    branchDepth,
    linearScan: linearScan ? 1 : 0,
    language,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    online: true,
    version: '0.4.0-local-ai-execution',
    analysisEngine: 'static-plus-local-ml-plus-execution',
    aiConfigured: true,
    aiModel: recommendationModelInfo,
    codeExecution: executionInfo,
  });
});

app.post('/api/analyze', async (req, res) => {
  const { code, language, filename, options } = req.body ?? {};
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ success: false, message: 'Code is required.' });
  if (code.length > maxCodeLength) return res.status(413).json({ success: false, message: `Code is too large. Maximum supported length is ${maxCodeLength.toLocaleString()} characters.` });
  if (typeof language !== 'string' || !supportedLanguages.has(language)) return res.status(400).json({ success: false, message: 'Unsupported language. Supported languages are Java, C, C++, and Python.' });
  if (filename !== undefined && filename !== null && typeof filename !== 'string') return res.status(400).json({ success: false, message: 'Filename must be a string when provided.' });

  const staticAnalysis = analyzeStatically(code, language);
  const features = extractOptimizationFeatures(code, language, staticAnalysis);
  let aiRecommendation;
  try {
    aiRecommendation = recommendOptimizations(features);
  } catch (error) {
    aiRecommendation = {
      available: false,
      model: recommendationModelInfo.name,
      modelType: recommendationModelInfo.type,
      trainingExamples: recommendationModelInfo.trainingExamples,
      recommendation: 'MODEL_ERROR',
      title: 'Local AI model error',
      area: 'none',
      explanation: error instanceof Error ? error.message : 'Unknown local recommendation model error.',
      guard: 'Check the server logs and model implementation.',
      confidence: 'low',
      score: 0,
      alternatives: []
    };
  }

  let execution;
  try {
    execution = await executeSourceCode(code, language, filename || '');
  } catch (error) {
    execution = {
      available: false,
      executed: false,
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Code execution failed unexpectedly.',
      stdout: '',
      stderr: '',
    };
  }

  const lines = code.split(/\r?\n/);
  return res.json({
    success: true,
    message: 'Static analysis, local optimization AI recommendation, and program execution completed.',
    analysisReady: true,
    submittedAt: new Date().toISOString(),
    source: { language, filename: filename || null, lines: lines.length, nonEmptyLines: lines.filter((line) => line.trim()).length, characters: code.length },
    staticAnalysis,
    aiRecommendation,
    execution,
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
