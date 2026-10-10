import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface CodeContextType {
  language: SupportedLanguage;
  code: string;
  activeFilename: string | null;
  lastSubmittedCode: string | null;
  lastSubmittedLanguage: SupportedLanguage | null;
  lastSubmittedFilename: string | null;
  validationError: string | null;
  infoNotification: string | null;
  hasRestoredDraft: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  setCode: (newCode: string) => void;
  setActiveFilename: (name: string | null) => void;
  setValidationError: (err: string | null) => void;
  setInfoNotification: (msg: string | null) => void;
  loadSampleCode: (lang?: SupportedLanguage) => void;
  clearCode: () => void;
  discardSavedDraft: () => void;
  recordSubmission: () => boolean;
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);
const DRAFT_STORAGE_KEY = 'code-complexity-analyser-editor-draft';

interface SavedEditorDraft {
  code: string;
  language: SupportedLanguage;
  activeFilename: string | null;
}

const readSavedDraft = (): SavedEditorDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<SavedEditorDraft>;
    const validLanguages: SupportedLanguage[] = ['java', 'c', 'cpp', 'python'];
    if (typeof draft.code !== 'string' || !validLanguages.includes(draft.language as SupportedLanguage)) return null;
    return { code: draft.code, language: draft.language as SupportedLanguage, activeFilename: typeof draft.activeFilename === 'string' ? draft.activeFilename : null };
  } catch {
    return null;
  }
};

export const CodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialDraft] = useState<SavedEditorDraft | null>(readSavedDraft);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(Boolean(initialDraft));
  const [language, setLanguageState] = useState<SupportedLanguage>(initialDraft?.language ?? 'python');
  const [code, setCode] = useState<string>(initialDraft?.code ?? SUPPORTED_LANGUAGES.python.defaultSample);
  const [activeFilename, setActiveFilename] = useState<string | null>(initialDraft?.activeFilename ?? null);
  const skipInitialSave = useRef(!initialDraft);

  const [lastSubmittedCode, setLastSubmittedCode] = useState<string | null>(null);
  const [lastSubmittedLanguage, setLastSubmittedLanguage] = useState<SupportedLanguage | null>(null);
  const [lastSubmittedFilename, setLastSubmittedFilename] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [infoNotification, setInfoNotification] = useState<string | null>(null);

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    if (!code.trim()) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ code, language, activeFilename }));
    } catch {
      // Storage may be unavailable or full; editing should continue normally.
    }
  }, [code, language, activeFilename]);

  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => setValidationError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  useEffect(() => {
    if (infoNotification) {
      const timer = setTimeout(() => setInfoNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [infoNotification]);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    setCode(SUPPORTED_LANGUAGES[newLang].defaultSample);
    setActiveFilename(null);
    setValidationError(null);
    setInfoNotification(`Loaded editable ${SUPPORTED_LANGUAGES[newLang].name} code sample.`);
  };

  const loadSampleCode = (targetLang?: SupportedLanguage) => {
    const langToUse = targetLang || language;
    setLanguageState(langToUse);
    setCode(SUPPORTED_LANGUAGES[langToUse].defaultSample);
    setActiveFilename(null);
    setValidationError(null);
    setInfoNotification(`Loaded editable ${SUPPORTED_LANGUAGES[langToUse].name} code sample.`);
  };

  const clearCode = () => {
    setCode('');
    setHasRestoredDraft(false);
    setActiveFilename(null);
    setValidationError(null);
    setInfoNotification('Editor content cleared.');
  };

  const discardSavedDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCode('');
    setActiveFilename(null);
    setHasRestoredDraft(false);
    setValidationError(null);
    setInfoNotification('Saved draft discarded.');
  };

  const recordSubmission = (): boolean => {
    const trimmed = code.trim();
    if (!trimmed) {
      setValidationError('Cannot analyze empty code. Please type a snippet or upload a file.');
      return false;
    }
    setValidationError(null);
    setLastSubmittedCode(code);
    setLastSubmittedLanguage(language);
    setLastSubmittedFilename(activeFilename);
    return true;
  };

  return (
    <CodeContext.Provider
      value={{
        language,
        code,
        activeFilename,
        lastSubmittedCode,
        lastSubmittedLanguage,
        lastSubmittedFilename,
        validationError,
        infoNotification,
        hasRestoredDraft,
        setLanguage,
        setCode,
        setActiveFilename,
        setValidationError,
        setInfoNotification,
        loadSampleCode,
        clearCode,
        discardSavedDraft,
        recordSubmission,
      }}
    >
      {children}
    </CodeContext.Provider>
  );
};

export function useCodeContext(): CodeContextType {
  const context = useContext(CodeContext);
  if (!context) {
    throw new Error('useCodeContext must be used within a CodeProvider');
  }
  return context;
}
