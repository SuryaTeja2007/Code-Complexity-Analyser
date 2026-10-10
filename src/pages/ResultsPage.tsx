import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Brain, AlertTriangle, Zap, Code2, Info, Target, ListChecks } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { AnalyzeResponse } from '../types';

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const { lastSubmittedCode, lastSubmittedLanguage, lastSubmittedFilename } = useCodeContext();
  const [showSource, setShowSource] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showComplexityLegend, setShowComplexityLegend] = useState(false);
  const [showWhySuggestion, setShowWhySuggestion] = useState(false);
  const [showRecommendationDetails, setShowRecommendationDetails] = useState(false);
  const analysis = (location.state as { analysis?: AnalyzeResponse } | null)?.analysis;
  const staticAnalysis = analysis?.staticAnalysis;
  const ai = analysis?.aiRecommendation;
  const detectedLanguage = analysis?.source?.language || lastSubmittedLanguage;
  const language = detectedLanguage ? SUPPORTED_LANGUAGES[detectedLanguage] : null;

  if (!analysis || !staticAnalysis) {
    return <div className="max-w-4xl w-full mx-auto px-4 py-12 text-center"><Info className="w-10 h-10 mx-auto mb-3 text-zinc-400" /><h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No analysis result available</h1><p className="text-sm text-zinc-500 mt-2">Run an analysis from the Analyzer workspace first.</p><Link to="/analyzer" className="inline-flex mt-5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-emerald-600 text-white text-sm">Open Analyzer</Link></div>;
  }

  const recommendationCount = staticAnalysis.suggestions.length + (ai?.available ? 1 : 0);
  const summaryRows: Array<{ label: string; value: string | number }> = [
    { label: 'Language', value: language?.name || 'Unknown' },
    { label: 'Estimated time complexity', value: staticAnalysis.timeComplexity || 'Not available' },
    { label: 'Estimated auxiliary space', value: staticAnalysis.spaceComplexity || 'Not available' },
    { label: 'Maximum loop nesting', value: staticAnalysis.metrics.maxLoopNesting ?? 'Not measured' },
    { label: 'Functions detected', value: staticAnalysis.metrics.functionCount },
    { label: 'Code-quality issues', value: staticAnalysis.codeSmells.length },
    { label: 'Optimization recommendations', value: recommendationCount },
  ];



  return <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3"><Link to="/analyzer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium"><ArrowLeft className="w-3.5 h-3.5" />Back</Link><h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analysis Results</h1></div>
    </div>

    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"><div className="flex items-center gap-3"><Code2 className="w-5 h-5 text-emerald-600" /><div><div className="text-xs text-zinc-500">Source</div><div className="font-semibold text-zinc-900 dark:text-zinc-100">{lastSubmittedFilename || `Untitled ${language?.name || ''}`}</div></div><span className="ml-auto text-xs font-mono text-zinc-500">{analysis.source?.lines} lines • {analysis.source?.characters} chars</span></div><button onClick={() => setShowSource(!showSource)} className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600">{showSource ? 'Hide Source' : 'View Source'}{showSource ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>{showSource && <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100"><code>{lastSubmittedCode}</code></pre>}</div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <section className="min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-3"><ListChecks className="w-5 h-5 text-emerald-600" /><h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Analysis Summary</h2></div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500"><span>Metric</span><span>Result</span></div>
        {summaryRows.map((row, index) => <div key={row.label} className={`grid grid-cols-2 gap-2 px-3 py-2.5 text-sm ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/70 dark:bg-zinc-950/50'} border-t border-zinc-100 dark:border-zinc-800`}><span className="text-zinc-600 dark:text-zinc-400">{row.label}</span><span className="font-medium text-zinc-900 dark:text-zinc-100 break-words">{row.value}</span></div>)}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">Complexity values are static estimates. Loop nesting is reported from the analyzer's loop-nesting metric; unavailable metrics are not inferred.</p>
      </section>
      <section className="min-w-0 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4"><Brain className="w-5 h-5 text-emerald-600" /><h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Local AI Optimization Review</h2></div>
        {ai?.available ? <>
          <div className="flex flex-wrap items-center gap-2 mb-4"><Target className="w-4 h-4 text-emerald-600 shrink-0" /><span className="font-semibold text-zinc-900 dark:text-zinc-100">{ai.title}</span><span className="sm:ml-auto text-[10px] uppercase font-semibold px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800">{ai.confidence} model confidence</span></div>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900 p-3"><div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Issue detected</div><p className="text-sm text-zinc-700 dark:text-zinc-300">{ai.issue || ai.explanation}</p></div>
            <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900 p-3"><div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Suggested approach</div><p className="text-sm text-zinc-700 dark:text-zinc-300">{ai.approach || ai.explanation}</p></div>
          </div>
          <button type="button" onClick={() => setShowRecommendationDetails(!showRecommendationDetails)} aria-expanded={showRecommendationDetails} className="mt-3 w-full flex items-center justify-between gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white/70 dark:bg-zinc-900/70 px-3 py-2.5 text-left text-sm font-medium text-emerald-800 dark:text-emerald-300 hover:bg-white dark:hover:bg-zinc-900">
            <span>{showRecommendationDetails ? 'Hide recommendation details' : 'More recommendation details'}</span>
            {showRecommendationDetails ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          </button>
          {showRecommendationDetails && <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900 p-3"><div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Potential benefit</div><p className="text-sm text-zinc-700 dark:text-zinc-300">{ai.expectedBenefit || 'Any performance benefit depends on the actual algorithm and workload; no improvement is guaranteed.'}</p></div>
            <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900 p-3"><div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Conditions for use</div><p className="text-sm text-zinc-700 dark:text-zinc-300">{ai.guard}</p></div>
            <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900 p-3"><div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Trade-offs</div><p className="text-sm text-zinc-700 dark:text-zinc-300">{ai.tradeoffs || 'Evaluate memory use, setup cost, maintainability, and behavior before applying this suggestion.'}</p></div>
          </div>}
          </div>
          <button type="button" onClick={() => setShowWhySuggestion(!showWhySuggestion)} aria-expanded={showWhySuggestion} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline">{showWhySuggestion ? 'Hide why this suggestion?' : 'Why this suggestion?'}{showWhySuggestion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
          {showWhySuggestion && <div className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white/80 dark:bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">These are structural signals from heuristic source inspection. They explain the model's recommendation, but do not prove the code is inefficient or that a change is safe.</p>
            {ai.triggeredFeatures?.length ? <ul className="space-y-3">{ai.triggeredFeatures.map((feature) => <li key={feature.feature} className="text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-zinc-800 dark:text-zinc-200">{feature.label}</span><span className="font-mono text-xs text-zinc-500">signal {feature.value.toFixed(2)} / 1</span></div><p className="mt-1 text-zinc-600 dark:text-zinc-400">{feature.explanation}</p></li>)}</ul> : <p className="text-sm text-zinc-600 dark:text-zinc-400">No individual structural feature crossed the display threshold. The model selected this category from its overall feature-vector similarity.</p>}
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Confidence is a coarse classifier-confidence heuristic, not a calibrated probability. Similarity score: {typeof ai.score === 'number' ? ai.score.toFixed(3) : 'not available'}. {ai.scoreMeaning || 'The score is not a probability that the recommendation is correct.'}</p>
          </div>}
          <div className="mt-4 text-[11px] text-zinc-500">{ai.model} • {ai.trainingExamples} labeled training examples • feature-based classifier</div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Treat this as a hypothesis to review, not an automatic fix. Verify correctness and benchmark representative inputs before changing production code.</p>
        </> : <p className="text-sm text-zinc-500">Local optimization AI is unavailable for this request.</p>}
      </section>
    </div>

    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setShowComplexityLegend(!showComplexityLegend)}
        aria-expanded={showComplexityLegend}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      >
        <span className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100"><Info className="w-4 h-4 text-emerald-600" />Big-O Complexity Reference</span>
        <span className="flex items-center gap-2 text-xs text-zinc-500">{showComplexityLegend ? 'Hide reference' : 'Show reference'}{showComplexityLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {showComplexityLegend && <div className="px-4 pb-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">A quick guide to how algorithm work typically grows as the input size increases. These are asymptotic growth classes; constants and lower-order terms are omitted.</p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-3 py-2.5 text-left font-semibold">Complexity</th><th className="px-3 py-2.5 text-left font-semibold">Growth</th><th className="px-3 py-2.5 text-left font-semibold">Typical example / note</th></tr></thead>
            <tbody>
              {[
                ['O(1)', 'Constant', 'Direct array access or a fixed number of operations.'],
                ['O(log log n)', 'Iterated logarithmic', 'Very slowly growing bounds in specialized algorithms.'],
                ['O(log n)', 'Logarithmic', 'Binary search on sorted data; repeatedly halving a search space.'],
                ['O(√n)', 'Square-root', 'Trial division up to √n; some block-decomposition algorithms.'],
                ['O(n)', 'Linear', 'One pass through an input array or list.'],
                ['O(n log log n)', 'Near-linear', 'Sieve of Eratosthenes up to n, under the usual model.'],
                ['O(n log n)', 'Linearithmic', 'Merge sort and heapsort; many efficient comparison-based sorts.'],
                ['O(n log² n)', 'Linear times squared logarithm', 'Can appear in advanced divide-and-conquer algorithms.'],
                ['O(n²)', 'Quadratic', 'All-pairs comparisons or two full nested traversals.'],
                ['O(n² log n)', 'Quadratic-logarithmic', 'A quadratic amount of work with an extra logarithmic factor.'],
                ['O(n³)', 'Cubic', 'Three nested linear loops; classical matrix multiplication.'],
                ['O(nᵏ)', 'Polynomial', 'A fixed number k of nested input-sized loops; k is a constant.'],
                ['O(2ⁿ)', 'Exponential', 'Enumerating all subsets; naive recursive Fibonacci has exponential time.'],
                ['O(3ⁿ)', 'Exponential', 'Algorithms branching into roughly three recursive choices per level.'],
                ['O(n!)', 'Factorial', 'Enumerating all permutations of n items.'],
                ['O(nⁿ)', 'Super-exponential', 'Enumerating all length-n sequences where each position has n choices.'],
                ['O(m + n)', 'Combined linear', 'Graph traversal or merging two inputs, with sizes m and n.'],
                ['O(V + E)', 'Graph-linear', 'Breadth-first or depth-first search using adjacency lists; V vertices, E edges.'],
              ].map(([complexity, growth, example], index) => <tr key={complexity} className={index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/70 dark:bg-zinc-950/50'}>
                <td className="px-3 py-2.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{complexity}</td>
                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{growth}</td>
                <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 min-w-56">{example}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Common space complexities</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400"><span className="font-mono">O(1)</span> constant auxiliary storage · <span className="font-mono">O(log n)</span> recursion stack in balanced divide-and-conquer · <span className="font-mono">O(n)</span> an extra array or hash table · <span className="font-mono">O(n²)</span> a matrix of input-sized dimensions.</p>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">How to read Big-O</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Big-O describes an asymptotic upper bound, not an exact runtime. Actual complexity depends on the algorithm, input shape, data structures, and whether best-, average-, or worst-case behavior is being considered. Two nested loops do not automatically mean O(n²).</p>
          </div>
        </div>
      </div>}
    </section>

    <button onClick={() => setShowDetails(!showDetails)} className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm">{showDetails ? 'Hide' : 'Show'} detailed findings{showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
    {showDetails && <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><ListChecks className="w-4 h-4 text-emerald-600" />Static Analysis Details</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{staticAnalysis.explanation}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Loop count', value: staticAnalysis.metrics.loopCount },
            { label: 'Maximum nesting depth', value: staticAnalysis.metrics.maxNestingDepth },
            { label: 'Maximum loop nesting', value: staticAnalysis.metrics.maxLoopNesting ?? 'Not measured' },
            { label: 'Branch count', value: staticAnalysis.metrics.branchCount },
            { label: 'Functions detected', value: staticAnalysis.metrics.functionCount },
            { label: 'Recursive functions', value: staticAnalysis.metrics.recursiveFunctionCount },
            { label: 'Variables detected', value: staticAnalysis.metrics.variableCount },
            { label: 'Cyclomatic complexity', value: staticAnalysis.metrics.cyclomaticComplexity },
            { label: 'Collection allocations', value: staticAnalysis.metrics.collectionAllocations },
            { label: 'Estimator confidence', value: staticAnalysis.confidence },
          ].map((metric) => <div key={metric.label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 p-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</div>
            <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 break-words">{metric.value}</div>
          </div>)}
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Code Smells</h2>{staticAnalysis.codeSmells.length ? <ul className="space-y-3">{staticAnalysis.codeSmells.map((smell, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400"><span className="font-medium uppercase text-[10px] mr-2">{smell.severity}</span>{smell.message}</li>)}</ul> : <p className="text-sm text-zinc-500">No structural smells detected.</p>}</section>
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" />Optimization Suggestions</h2>{staticAnalysis.suggestions.length || ai?.available ? <ul className="space-y-3">{staticAnalysis.suggestions.map((suggestion, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 list-disc ml-4">{suggestion}</li>)}{ai?.available && <li className="text-sm text-zinc-700 dark:text-zinc-300 list-disc ml-4 font-medium">AI: {ai.title} — {ai.explanation}</li>}</ul> : <p className="text-sm text-zinc-500">No optimization suggestions were generated.</p>}</section>
      </div>
    </div>}
  </div>;
};
