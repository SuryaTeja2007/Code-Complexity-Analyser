import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, RotateCcw, FileText, Info, AlertCircle, Copy, Check, Minus, Plus, ChevronDown } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { FileUpload } from '../components/FileUpload';
import { CodeEditor, findSyntaxIssues } from '../components/CodeEditor';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { analyzerService } from '../services/analyzerService';

type ExampleId = 'simple-loop' | 'nested-loops' | 'binary-search' | 'recursive-fibonacci' | 'repeated-computation' | 'efficient-comparison';

const EXAMPLES: { id: ExampleId; label: string; complexity: string; description: string }[] = [
  { id: 'simple-loop', label: 'Simple loop', complexity: 'O(n)', description: 'One pass through a list' },
  { id: 'nested-loops', label: 'Nested loops', complexity: 'O(n²)', description: 'Compare every pair' },
  { id: 'binary-search', label: 'Binary search', complexity: 'O(log n)', description: 'Search a sorted list' },
  { id: 'recursive-fibonacci', label: 'Recursive Fibonacci', complexity: 'Exponential', description: 'Repeated recursive work' },
  { id: 'repeated-computation', label: 'Repeated computation', complexity: 'Optimization example', description: 'Notice work repeated inside a loop' },
  { id: 'efficient-comparison', label: 'Efficient implementation', complexity: 'Comparison example', description: 'Compare nested search with a set lookup' },
];

const EXAMPLE_CODE: Record<SupportedLanguage, Record<ExampleId, string>> = {
  python: {
    'simple-loop': `def sum_values(values):
    total = 0
    for value in values:
        total += value
    return total

print(sum_values([3, 5, 7, 9]))`,
    'nested-loops': `def print_pairs(values):
    for i in range(len(values)):
        for j in range(len(values)):
            print(values[i], values[j])

print_pairs([1, 2, 3])`,
    'binary-search': `def binary_search(values, target):
    left, right = 0, len(values) - 1
    while left <= right:
        middle = (left + right) // 2
        if values[middle] == target:
            return middle
        if values[middle] < target:
            left = middle + 1
        else:
            right = middle - 1
    return -1

print(binary_search([1, 3, 5, 7, 9], 7))`,
    'recursive-fibonacci': `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(8))`,
    'repeated-computation': `def distances_from(values, target):
    results = []
    for value in values:
        # Repeated work: target * target is recalculated each iteration.
        results.append(value * value + target * target)
    return results

print(distances_from([1, 2, 3, 4], 5))`,
    'efficient-comparison': `def contains_duplicate_slow(values):
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            if values[i] == values[j]:
                return True
    return False

def contains_duplicate_fast(values):
    seen = set()
    for value in values:
        if value in seen:
            return True
        seen.add(value)
    return False

data = [4, 2, 7, 2, 9]
print(contains_duplicate_slow(data))  # O(n²)
print(contains_duplicate_fast(data))  # O(n) average time, O(n) space`,
  },
  java: {
    'simple-loop': `public class Main {
    static int sumValues(int[] values) {
        int total = 0;
        for (int value : values) {
            total += value;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sumValues(new int[]{3, 5, 7, 9}));
    }
}`,
    'nested-loops': `public class Main {
    public static void main(String[] args) {
        int[] values = {1, 2, 3};
        for (int i = 0; i < values.length; i++) {
            for (int j = 0; j < values.length; j++) {
                System.out.println(values[i] + ", " + values[j]);
            }
        }
    }
}`,
    'binary-search': `public class Main {
    static int binarySearch(int[] values, int target) {
        int left = 0, right = values.length - 1;
        while (left <= right) {
            int middle = left + (right - left) / 2;
            if (values[middle] == target) return middle;
            if (values[middle] < target) left = middle + 1;
            else right = middle - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(binarySearch(new int[]{1, 3, 5, 7, 9}, 7));
    }
}`,
    'recursive-fibonacci': `public class Main {
    static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        System.out.println(fibonacci(8));
    }
}`,
    'repeated-computation': `public class Main {
    static int[] distancesFrom(int[] values, int target) {
        int[] results = new int[values.length];
        for (int i = 0; i < values.length; i++) {
            // Repeated work: target * target is recalculated each iteration.
            results[i] = values[i] * values[i] + target * target;
        }
        return results;
    }

    public static void main(String[] args) {
        System.out.println(java.util.Arrays.toString(distancesFrom(new int[]{1, 2, 3, 4}, 5)));
    }
}`,
    'efficient-comparison': `import java.util.HashSet;
import java.util.Set;

public class Main {
    static boolean containsDuplicateSlow(int[] values) {
        for (int i = 0; i < values.length; i++)
            for (int j = i + 1; j < values.length; j++)
                if (values[i] == values[j]) return true;
        return false;
    }

    static boolean containsDuplicateFast(int[] values) {
        Set<Integer> seen = new HashSet<>();
        for (int value : values) {
            if (!seen.add(value)) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        int[] data = {4, 2, 7, 2, 9};
        System.out.println(containsDuplicateSlow(data)); // O(n²)
        System.out.println(containsDuplicateFast(data)); // O(n) average time, O(n) space
    }
}`,
  },
  c: {
    'simple-loop': `#include <stdio.h>

int sum_values(const int values[], int length) {
    int total = 0;
    for (int i = 0; i < length; i++) {
        total += values[i];
    }
    return total;
}

int main(void) {
    int values[] = {3, 5, 7, 9};
    printf("%d\\n", sum_values(values, 4));
    return 0;
}`,
    'nested-loops': `#include <stdio.h>

int main(void) {
    int values[] = {1, 2, 3};
    int length = 3;
    for (int i = 0; i < length; i++) {
        for (int j = 0; j < length; j++) {
            printf("%d, %d\\n", values[i], values[j]);
        }
    }
    return 0;
}`,
    'binary-search': `#include <stdio.h>

int binary_search(const int values[], int length, int target) {
    int left = 0, right = length - 1;
    while (left <= right) {
        int middle = left + (right - left) / 2;
        if (values[middle] == target) return middle;
        if (values[middle] < target) left = middle + 1;
        else right = middle - 1;
    }
    return -1;
}

int main(void) {
    int values[] = {1, 3, 5, 7, 9};
    printf("%d\\n", binary_search(values, 5, 7));
    return 0;
}`,
    'recursive-fibonacci': `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main(void) {
    printf("%d\\n", fibonacci(8));
    return 0;
}`,
    'repeated-computation': `#include <stdio.h>

void distances_from(const int values[], int results[], int length, int target) {
    for (int i = 0; i < length; i++) {
        /* Repeated work: target * target is recalculated each iteration. */
        results[i] = values[i] * values[i] + target * target;
    }
}

int main(void) {
    int values[] = {1, 2, 3, 4}, results[4];
    distances_from(values, results, 4, 5);
    for (int i = 0; i < 4; i++) printf("%d ", results[i]);
    printf("\\n");
    return 0;
}`,
    'efficient-comparison': `#include <stdio.h>
#include <stdbool.h>

bool contains_duplicate_slow(const int values[], int length) {
    for (int i = 0; i < length; i++)
        for (int j = i + 1; j < length; j++)
            if (values[i] == values[j]) return true;
    return false;
}

/* Sort-and-scan can improve time to O(n log n), but modifies/copies input. */
bool contains_duplicate_sorted(int values[], int length) {
    for (int i = 0; i < length; i++) {
        for (int j = i + 1; j < length; j++) {
            if (values[i] > values[j]) {
                int temp = values[i]; values[i] = values[j]; values[j] = temp;
            }
        }
    }
    for (int i = 1; i < length; i++)
        if (values[i] == values[i - 1]) return true;
    return false;
}

int main(void) {
    int data[] = {4, 2, 7, 2, 9}, copy[] = {4, 2, 7, 2, 9};
    printf("%d\\n", contains_duplicate_slow(data, 5)); /* O(n²) */
    printf("%d\\n", contains_duplicate_sorted(copy, 5)); /* O(n²) sort here; use qsort for O(n log n) */
    return 0;
}`,
  },
  cpp: {
    'simple-loop': `#include <iostream>
#include <vector>
using namespace std;

int sumValues(const vector<int>& values) {
    int total = 0;
    for (int value : values) total += value;
    return total;
}

int main() {
    cout << sumValues({3, 5, 7, 9}) << endl;
}`,
    'nested-loops': `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> values = {1, 2, 3};
    for (int i = 0; i < (int)values.size(); i++) {
        for (int j = 0; j < (int)values.size(); j++) {
            cout << values[i] << ", " << values[j] << endl;
        }
    }
}`,
    'binary-search': `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& values, int target) {
    int left = 0, right = (int)values.size() - 1;
    while (left <= right) {
        int middle = left + (right - left) / 2;
        if (values[middle] == target) return middle;
        if (values[middle] < target) left = middle + 1;
        else right = middle - 1;
    }
    return -1;
}

int main() {
    cout << binarySearch({1, 3, 5, 7, 9}, 7) << endl;
}`,
    'recursive-fibonacci': `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << fibonacci(8) << endl;
}`,
    'repeated-computation': `#include <iostream>
#include <vector>
using namespace std;

vector<int> distancesFrom(const vector<int>& values, int target) {
    vector<int> results;
    for (int value : values) {
        // Repeated work: target * target is recalculated each iteration.
        results.push_back(value * value + target * target);
    }
    return results;
}

int main() {
    for (int value : distancesFrom({1, 2, 3, 4}, 5)) cout << value << " ";
    cout << endl;
}`,
    'efficient-comparison': `#include <iostream>
#include <unordered_set>
#include <vector>
using namespace std;

bool containsDuplicateSlow(const vector<int>& values) {
    for (size_t i = 0; i < values.size(); i++)
        for (size_t j = i + 1; j < values.size(); j++)
            if (values[i] == values[j]) return true;
    return false;
}

bool containsDuplicateFast(const vector<int>& values) {
    unordered_set<int> seen;
    for (int value : values) {
        if (!seen.insert(value).second) return true;
    }
    return false;
}

int main() {
    vector<int> data = {4, 2, 7, 2, 9};
    cout << containsDuplicateSlow(data) << endl; // O(n²)
    cout << containsDuplicateFast(data) << endl; // O(n) average time, O(n) space
}`,
  },
};

export const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(() => Number(localStorage.getItem('cca-editor-font-size')) || 13.5);
  const { language, code, activeFilename, setLanguage, setCode, setActiveFilename, setValidationError, setInfoNotification, clearCode, discardSavedDraft, hasRestoredDraft, recordSubmission } = useCodeContext();
  const lineCount = useMemo(() => (code ? code.split('\n').length : 0), [code]);
  const charCount = useMemo(() => code.length, [code]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setInfoNotification(`Loaded editable ${SUPPORTED_LANGUAGES[newLang].name} code sample.`);
  };

  const handleFileLoaded = (content: string, fileLanguage: SupportedLanguage, filename: string) => {
    setLanguage(fileLanguage);
    setCode(content);
    setActiveFilename(filename);
    setValidationError(null);
    const isGenericFile = /\.(txt|pdf)$/i.test(filename);
    setInfoNotification(isGenericFile ? `Successfully loaded "${filename}" using ${SUPPORTED_LANGUAGES[fileLanguage].name} for analysis.` : `Successfully loaded "${filename}" (${SUPPORTED_LANGUAGES[fileLanguage].name}).`);
  };

  const handleLoadExample = (exampleId: ExampleId) => {
    setCode(EXAMPLE_CODE[language][exampleId]);
    setActiveFilename(null);
    setValidationError(null);
    setInfoNotification(`Loaded "${EXAMPLES.find(example => example.id === exampleId)?.label}" example in ${SUPPORTED_LANGUAGES[language].name}.`);
    setExamplesOpen(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setInfoNotification('Editor contents copied to clipboard.');
      window.setTimeout(() => setCodeCopied(false), 1800);
    } catch {
      setValidationError('Could not access the clipboard. Check browser permissions and try again.');
    }
  };

  const handleAnalyzeClick = async () => {
    setAnalysisError(null);
    if (!code || code.trim().length === 0) {
      setAnalysisError('Code editor is empty. Please enter code or upload a source file before analyzing.');
      return;
    }
    const syntaxIssues = findSyntaxIssues(code, language);
    if (syntaxIssues.length > 0) {
      const firstIssue = syntaxIssues[0];
      setAnalysisError(`Syntax error on line ${firstIssue.line}: ${firstIssue.message} Fix the reported syntax issue(s) before analyzing.`);
      return;
    }
    if (!recordSubmission()) return;
    setIsAnalyzing(true);
    setValidationError(null);
    try {
      const result = await analyzerService.submitForAnalysis({ code, language, filename: activeFilename || undefined, options: { includeAst: true, includeOptimizations: true, includeCodeSmells: true } });
      setInfoNotification(result.message);
      navigate('/results', { state: { analysis: result } });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Unable to reach the analysis server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800"><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analyzer Workspace</h1><p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Analyze Java, C, C++, and Python source code without executing it.</p></div>
      {hasRestoredDraft && <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><div><p className="font-medium">Draft restored</p><p className="mt-0.5 text-xs opacity-80">Your previous editor contents were restored from this browser.</p></div><button type="button" onClick={discardSavedDraft} disabled={isAnalyzing} className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium hover:bg-emerald-100 dark:border-emerald-800 dark:hover:bg-emerald-900/50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Discard saved draft</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"><div className="lg:col-span-6"><FileUpload onFileLoaded={handleFileLoaded} onError={(msg) => setValidationError(msg || null)} activeFilename={activeFilename} currentLanguage={language} /></div><div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"><LanguageSelector currentLanguage={language} onSelectLanguage={handleLanguageChange} /><div className="relative"><button type="button" id="load-example-btn" aria-haspopup="menu" aria-expanded={examplesOpen} onClick={() => setExamplesOpen(open => !open)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"><FileText className="w-3.5 h-3.5" /><span>Load Example</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${examplesOpen ? 'rotate-180' : ''}`} /></button>{examplesOpen && <><button type="button" aria-label="Close examples menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setExamplesOpen(false)} /><div role="menu" aria-label="Code examples" className="absolute right-0 top-full mt-2 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5">{EXAMPLES.map(example => <button key={example.id} type="button" role="menuitem" onClick={() => handleLoadExample(example.id)} className="w-full text-left rounded-md px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800"><span className="flex items-center justify-between gap-3 text-sm font-medium text-zinc-900 dark:text-zinc-100"><span>{example.label}</span><span className="shrink-0 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{example.complexity}</span></span><span className="block mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{example.description}</span></button>)}</div></>}</div></div></div>
      <div className="flex-1 flex flex-col"><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-t-lg border-t border-x border-zinc-200 dark:border-zinc-800 text-xs"><div className="flex items-center gap-3"><div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"><FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><span>{activeFilename || `Editor (${SUPPORTED_LANGUAGES[language].name})`}</span></div><span className="text-zinc-300 dark:text-zinc-700">|</span><span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Editable snippet, method, or program</span></div><div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]"><span>{lineCount} lines</span><span>•</span><span>{charCount} chars</span></div><div className="flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-300"><span className="font-sans">Font</span><button type="button" aria-label="Decrease editor font size" title="Decrease font size" disabled={editorFontSize <= 10} onClick={() => setEditorFontSize(size => { const next = Math.max(10, size - 1); localStorage.setItem('cca-editor-font-size', String(next)); return next; })} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40"><Minus className="h-3 w-3" /></button><input type="number" aria-label="Editor font size in pixels" title="Type font size (10–24 px)" min={10} max={24} step={0.5} value={editorFontSize} onChange={event => { const value = Number(event.target.value); if (event.target.value !== "" && Number.isFinite(value)) { const next = Math.min(24, Math.max(10, value)); setEditorFontSize(next); localStorage.setItem("cca-editor-font-size", String(next)); } }} className="w-14 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1 py-1 text-center font-mono" /><button type="button" aria-label="Increase editor font size" title="Increase font size" disabled={editorFontSize >= 24} onClick={() => setEditorFontSize(size => { const next = Math.min(24, size + 1); localStorage.setItem('cca-editor-font-size', String(next)); return next; })} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40"><Plus className="h-3 w-3" /></button><button type="button" aria-label="Reset editor settings" title="Reset editor settings" onClick={() => { setEditorFontSize(13.5); localStorage.removeItem('cca-editor-font-size'); localStorage.removeItem('cca-editor-tab-size'); setInfoNotification('Editor settings reset to defaults. Your code was not changed.'); }} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" ><RotateCcw className="h-3 w-3" /></button></div></div></div><CodeEditor code={code} language={language} onChange={(newVal) => { setCode(newVal || ''); setAnalysisError(null); }} onAnalyze={() => { if (!isAnalyzing) void handleAnalyzeClick(); }} fontSize={editorFontSize} height="520px" /></div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"><div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">{isAnalyzing ? <Info className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />}<span>{isAnalyzing ? 'Analyzing source code…' : 'Analysis uses static inspection and local ML optimization recommendations.'}</span></div><div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end"><button type="button" id="copy-code-btn" title="Copy code" onClick={() => void handleCopyCode()} disabled={!code} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"><span>{codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</span><span>{codeCopied ? "Copied!" : "Copy Code"}</span></button><button type="button" id="clear-code-btn" onClick={clearCode} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"><Trash2 className="w-4 h-4" /><span>Clear</span></button><div className="flex w-full sm:w-auto flex-col items-stretch sm:items-end gap-1.5"><div className="group relative w-full sm:w-auto"><button type="button" id="analyze-code-btn" title="Analyze code" aria-keyshortcuts="Control+Enter Meta+Enter" onClick={handleAnalyzeClick} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-wait"><Play className="w-4 h-4 fill-current" /><span>{isAnalyzing ? 'Analyzing…' : 'Analyze Code'}</span></button><span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">Ctrl + ↵</span></div>{analysisError && <p role="alert" className="max-w-xs text-left text-xs text-red-600 dark:text-red-400">{analysisError}</p>}</div></div></div>
    </div>
  );
};
