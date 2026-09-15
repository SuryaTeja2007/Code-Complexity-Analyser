import { LanguageInfo, SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  python: {
    id: 'python',
    name: 'Python',
    extensions: ['.py'],
    monacoLanguage: 'python',
    description: 'Python 3.x source or functions',
    defaultSample: `print("Hello, World!")
`,
  },
  java: {
    id: 'java',
    name: 'Java',
    extensions: ['.java'],
    monacoLanguage: 'java',
    description: 'Java source class, method, or snippet',
    defaultSample: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp'],
    monacoLanguage: 'cpp',
    description: 'C++11/17/20 source, functions, or snippets',
    defaultSample: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
  },
  c: {
    id: 'c',
    name: 'C',
    extensions: ['.c', '.h'],
    monacoLanguage: 'c',
    description: 'C99/C11 standard procedural code',
    defaultSample: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
};

export const ACCEPTED_EXTENSIONS = ['.java', '.c', '.cpp', '.cc', '.cxx', '.py', '.txt', '.pdf'];

/** Detect a programming language from a source-code filename. */
export function detectLanguageFromFilename(filename: string): SupportedLanguage | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();

  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.cxx')) return 'cpp';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';

  return null;
}

export function isGenericTextFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.txt') || lower.endsWith('.pdf');
}
