import { LanguageInfo, SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  python: { id: 'python', name: 'Python', extensions: ['.py'], monacoLanguage: 'python', description: 'Python 3.x source or functions', defaultSample: `print("Hello, World!")\n` },
  java: { id: 'java', name: 'Java', extensions: ['.java'], monacoLanguage: 'java', description: 'Java source class, method, or snippet', defaultSample: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
` },
  cpp: { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp'], monacoLanguage: 'cpp', description: 'C++11/17/20 source, functions, or snippets', defaultSample: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
` },
  c: { id: 'c', name: 'C', extensions: ['.c', '.h'], monacoLanguage: 'c', description: 'C99/C11 standard procedural code', defaultSample: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
` },
};

export const ACCEPTED_EXTENSIONS = ['.java', '.c', '.cpp', '.cc', '.cxx', '.py', '.txt', '.pdf'];

/** Detect a programming language from a source-code filename. */
export function detectLanguageFromFilename(filename: string): SupportedLanguage | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.cxx') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';
  return null;
}

/**
 * Heuristic detection for pasted source code. Returns null for short or ambiguous snippets.
 */
export function detectLanguageFromCode(source: string): SupportedLanguage | null {
  const code = source.trim();
  if (code.length < 8) return null;
  const scores: Record<SupportedLanguage, number> = { python: 0, java: 0, cpp: 0, c: 0 };
  const has = (pattern: RegExp) => pattern.test(code);

  if (has(/^\s*#!/m) && has(/python/i)) scores.python += 5;
  if (has(/^\s*(async\s+)?def\s+\w+\s*\(/m)) scores.python += 5;
  if (has(/^\s*(from\s+\w+\s+import|import\s+[\w.]+\s*(?:as\s+\w+)?\s*$)/m)) scores.python += 3;
  if (has(/^\s*(if|elif|for|while|try|except|with|class)\b.*:\s*(?:#.*)?$/m)) scores.python += 2;
  if (has(/^\s*print\s*\(/m) && !has(/\b(?:int|void|char|float|double)\s+main\s*\(/)) scores.python += 1;

  if (has(/^\s*#include\s*[<"]/m)) {
    if (has(/#include\s*<iostream>/) || has(/#include\s*<vector>/) || has(/#include\s*<string>/)) scores.cpp += 5;
    if (has(/#include\s*<stdio\.h>/) || has(/#include\s*<stdlib\.h>/)) scores.c += 4;
  }
  if (has(/\bstd::\w+/) || has(/\busing\s+namespace\s+std\s*;/) || has(/\bcout\s*<</) || has(/\bcin\s*>>/)) scores.cpp += 5;
  if (has(/\bvector\s*</) || has(/\btemplate\s*</) || has(/\bnullptr\b/)) scores.cpp += 2;
  if (has(/\bprintf\s*\(/) || has(/\bscanf\s*\(/)) scores.c += 2;
  if (has(/\bint\s+main\s*\(\s*void\s*\)/)) scores.c += 5;
  if (has(/\b(?:int|void|char|float|double)\s+main\s*\(/)) scores.c += 1;

  if (has(/\bpublic\s+class\s+\w+/) || has(/\bSystem\.out\.(?:println|print)\s*\(/)) scores.java += 5;
  if (has(/\bpublic\s+static\s+void\s+main\s*\(/) || has(/^\s*package\s+[\w.]+\s*;/m)) scores.java += 3;
  if (has(/\b(?:String|boolean|extends|implements)\b/)) scores.java += 1;

  const ranked = (Object.entries(scores) as [SupportedLanguage, number][]).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] < 3 || ranked[0][1] - ranked[1][1] < 2) return null;
  return ranked[0][0];
}

export function isGenericTextFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.txt') || lower.endsWith('.pdf');
}
