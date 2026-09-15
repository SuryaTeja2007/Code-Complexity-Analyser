import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { recommendOptimizations, recommendationModelInfo } from './ml/recommendationModel.js';

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

// Control-flow nesting and loop nesting are different. A Java class and main()
// method add braces, but they must not turn two nested loops into O(n^3).
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
    const bodyPattern = language === 'python'
      ? new RegExp(`^\\s*def\\s+${name}\\b[\\s\\S]*?(?=^\\s*def\\s+|$)`, 'm')
      : new RegExp(`(?:${name}\\s*\\([^)]*\\)[^{]*\\{)([\\s\\S]*?)(?=\\n\\s*\\}|$)`, 'm');
    const body = code.match(bodyPattern)?.[0] || '';
    return new RegExp(`\\b${name}\\s*\\(`).test(body.replace(/^(?:.|\n)*?\{/, ''));
  }).length;
  const variableMatches = code.match(/\b(?:int|long|float|double|char|boolean|bool|string|String|auto|var|let|const)\s+[A-Za-z_]\w*/g) || [];

  // Do not count primitive array declarations such as int[] or String[] as
  // collection allocations. They are variables, not dynamic collection objects.
  const collectionMatches = code.match(/\bnew\s+(?:ArrayList|HashMap|HashSet|Vector|LinkedList)\s*\(|\b(?:list|dict|set)\s*\(/g) || [];

  const maxNestingDepth = estimateNesting(code, language);
  const maxLoopNesting = estimateLoopNesting(code, language);
  const loopCount = loopMatches.length;
  const branchCount = branchMatches.length;
  const functionCount = functions.length;
  const cyclomaticComplexity = 1 + branchCount + loopCount + recursiveFunctionCount;

  let timeComplexity = 'O(1)';
  let confidence = 'medium';
  if (recursiveFunctionCount > 0) {
    timeComplexity = recursiveFunctionCount > 1 ? 'O(2^n) (approx.)' : 'O(n) to O(2^n) (depends on recursion branching)';
    confidence = 'low';
  } else if (maxLoopNesting >= 3) {
    timeComplexity = `O(n^${Math.min(3, maxLoopNesting)}) (approx.)`;
    confidence = 'medium';
  } else if (maxLoopNesting === 2) {
    timeComplexity = 'O(n²) (approx.)';
    confidence = 'medium';
  } else if (loopCount > 0) {
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
  if (maxLoopNesting >= 2) suggestions.push('Review nested loops and determine whether the inner work can be reduced, indexed, or precomputed.');
  if (collectionMatches.length > 0) suggestions.push('Choose collection types according to the dominant access pattern rather than using a single structure everywhere.');
  if (branchCount >= 6) suggestions.push('Consider simplifying complex conditional paths into smaller functions or clearer guard clauses.');
  if (suggestions.length === 0) suggestions.push('The current structure has no obvious structural optimization from this static pass.');

  return {
    timeComplexity,
    spaceComplexity,
    confidence,
    explanation: `Static inspection found ${loopCount} loop construct(s), ${branchCount} branch construct(s), ${functionCount} function(s), and an estimated maximum nesting depth of ${maxNestingDepth}. Loop nesting depth is estimated separately for complexity analysis: ${maxLoopNesting}. Complexity is an approximation because source-only analysis cannot know runtime input distributions or hidden library costs.`,
    metrics: {
      loopCount,
      maxNestingDepth,
      maxLoopNesting,
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
    version: '0.3.2-local-ai',
    analysisEngine: 'static-plus-local-ml',
    aiConfigured: true,
    aiModel: recommendationModelInfo
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
  const lines = code.split(/\r?\n/);
  return res.json({
    success: true,
    message: 'Static analysis completed and local optimization AI recommendation added.',
    analysisReady: true,
    submittedAt: new Date().toISOString(),
    source: { language, filename: filename || null, lines: lines.length, nonEmptyLines: lines.filter((line) => line.trim()).length, characters: code.length },
    staticAnalysis,
    aiRecommendation,
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
