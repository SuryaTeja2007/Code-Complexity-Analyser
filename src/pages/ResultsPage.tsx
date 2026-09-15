import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  HardDrive,
  FileText,
  BarChart2,
  CheckSquare,
  AlertTriangle,
  Zap,
  Bot,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Terminal,
  Code2,
  SlidersHorizontal,
} from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export const ResultsPage: React.FC = () => {
  const { lastSubmittedCode, lastSubmittedLanguage, lastSubmittedFilename } = useCodeContext();
  const [showSourceSnippet, setShowSourceSnippet] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const hasSubmission = Boolean(lastSubmittedCode && lastSubmittedLanguage);
  const langConfig = lastSubmittedLanguage ? SUPPORTED_LANGUAGES[lastSubmittedLanguage] : null;

  // Primary asymptotic sections shown by default
  const primarySections = [
    {
      id: 'time-complexity',
      title: 'Time Complexity',
      icon: Clock,
      category: 'Asymptotic Analysis',
      scopeDescription: 'Theoretical upper bound (Big-O), lower bound (Big-Omega), and loop iteration complexity.',
    },
    {
      id: 'space-complexity',
      title: 'Space Complexity',
      icon: HardDrive,
      category: 'Memory Bounds',
      scopeDescription: 'Auxiliary memory allocations, recursion call stack depth, and buffer growth bounds.',
    },
  ];

  // The 6 detailed analysis features revealed upon clicking "Detailed Analysis"
  const detailedSections = [
    {
      id: 'complexity-explanation',
      title: 'Complexity Explanation',
      icon: FileText,
      category: 'Reasoning Breakdown',
      scopeDescription: 'Step-by-step mathematical reasoning tracing nested loops, recursion branching, and input scaling.',
    },
    {
      id: 'code-metrics',
      title: 'Code Metrics',
      icon: BarChart2,
      category: 'Static Indices',
      scopeDescription: 'Cyclomatic complexity, Halstead volume, maintainability index, and line distribution.',
    },
    {
      id: 'code-quality',
      title: 'Code Quality',
      icon: CheckSquare,
      category: 'Standard Compliance',
      scopeDescription: 'Clean code rubric assessment, naming conventions, and modular structural evaluation.',
    },
    {
      id: 'code-smells',
      title: 'Code Smells',
      icon: AlertTriangle,
      category: 'Anti-Patterns',
      scopeDescription: 'Identification of dead logic branches, duplicate code blocks, long parameter lists, and deep nesting.',
    },
    {
      id: 'optimization-suggestions',
      title: 'Optimization Suggestions',
      icon: Zap,
      category: 'Performance Tuning',
      scopeDescription: 'Concrete algorithmic recommendations, memory-efficient data structures, and vectorized alternatives.',
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      icon: Bot,
      category: 'Gemini Model Insights',
      scopeDescription: 'Synthesized diagnostic critique combining static AST findings with semantic contextual advice.',
    },
  ];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/analyzer"
            id="results-back-to-analyzer-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analyzer</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Analysis Results Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Phase 1 Layout Blueprint
          </span>
        </div>
      </div>

      {/* Advisory Banner: Clear statement that backend analysis engine connects in Phase 2 */}
      <div
        id="phase1-results-banner"
        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 flex items-start gap-3.5 shadow-xs"
      >
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs sm:text-sm">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            Phase 1 Frontend Foundation Active
          </div>
          <div className="text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
            The visual structure for the future results dashboard is displayed below. Analysis results will appear here after the analysis engine (AST parsing, static analysis, and Gemini API) is connected in Phase 2. No fabricated or estimated metrics are displayed.
          </div>
        </div>
      </div>

      {/* Submitted Code Context Bar */}
      {hasSubmission ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Target Source Code</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{lastSubmittedFilename || `Untitled ${langConfig?.name} Snippet`}</span>
                  <span className="text-xs font-mono px-2 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {langConfig?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">
                {lastSubmittedCode?.split('\n').length} lines • {lastSubmittedCode?.length} chars
              </span>
              <button
                type="button"
                id="toggle-source-snippet-btn"
                onClick={() => setShowSourceSnippet(!showSourceSnippet)}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>{showSourceSnippet ? 'Hide Source' : 'View Source'}</span>
                {showSourceSnippet ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expandable read-only source preview */}
          {showSourceSnippet && (
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-400 mb-1.5">Submitted Snippet Preview:</div>
              <pre className="p-3.5 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto max-h-60 border border-zinc-800">
                <code>{lastSubmittedCode}</code>
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-center py-6">
          <Terminal className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No code submitted for analysis yet
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            You are viewing the dashboard layout blueprint. You can navigate back to the Analyzer to input code or upload a file.
          </p>
          <Link
            to="/analyzer"
            id="results-start-analyzing-cta"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-emerald-600 text-white text-xs font-medium hover:bg-zinc-800 dark:hover:bg-emerald-500 transition-colors"
          >
            <span>Open Analyzer Workspace</span>
          </Link>
        </div>
      )}

      {/* Primary Complexities Section: Time and Space Complexity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Core Complexity Metrics
          </h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">2 Core Attributes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {primarySections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                id={`results-section-${sec.id}`}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between shadow-xs transition-colors"
              >
                <div>
                  {/* Section Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {sec.title}
                        </h3>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {sec.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                      Awaiting Engine
                    </span>
                  </div>

                  {/* Section Purpose Description */}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    {sec.scopeDescription}
                  </p>
                </div>

                {/* Standard Empty State Placeholder */}
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-dashed border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5 min-h-[100px]">
                  <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Analysis results will appear here after the analysis engine is connected.
                  </p>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Phase 2 backend integration
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Analysis Toggle Section */}
      <div className="pt-2">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Detailed Analysis
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Inspect complexity explanations, code metrics, code quality, code smells, optimization suggestions, and AI insights.
              </div>
            </div>
          </div>

          <button
            type="button"
            id="detailed-analysis-toggle-btn"
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            aria-expanded={showDetailedAnalysis}
            aria-controls="detailed-analysis-container"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
              showDetailedAnalysis
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-sm'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <span>{showDetailedAnalysis ? 'Hide Detailed Analysis' : 'Detailed Analysis'}</span>
            {showDetailedAnalysis ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* The 6 Detailed Analysis Features: Rendered right below the primary section when enabled */}
      {showDetailedAnalysis && (
        <div id="detailed-analysis-container" className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Detailed Diagnostics & Quality Insights (6 Features)
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">6 Additional Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detailedSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.id}
                  id={`results-section-${sec.id}`}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <div>
                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {sec.title}
                          </h3>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {sec.category}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                        Awaiting Engine
                      </span>
                    </div>

                    {/* Section Purpose Description */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                      {sec.scopeDescription}
                    </p>
                  </div>

                  {/* Standard Empty State Placeholder */}
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-dashed border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5 min-h-[100px]">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Analysis results will appear here after the analysis engine is connected.
                    </p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Phase 2 backend integration
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
