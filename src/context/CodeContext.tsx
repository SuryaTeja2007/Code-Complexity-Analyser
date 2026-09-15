import React, { createContext, useContext, useState, useEffect } from 'react';
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
  setLanguage: (lang: SupportedLanguage) => void;
  setCode: (newCode: string) => void;
  setActiveFilename: (name: string | null) => void;
  setValidationError: (err: string | null) => void;
  setInfoNotification: (msg: string | null) => void;
  loadSampleCode: (lang?: SupportedLanguage) => void;
  clearCode: () => void;
  recordSubmission: () => boolean;
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>(() => SUPPORTED_LANGUAGES.python.defaultSample);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);

  const [lastSubmittedCode, setLastSubmittedCode] = useState<string | null>(null);
  const [lastSubmittedLanguage, setLastSubmittedLanguage] = useState<SupportedLanguage | null>(null);
  const [lastSubmittedFilename, setLastSubmittedFilename] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [infoNotification, setInfoNotification] = useState<string | null>(null);

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
    setActiveFilename(null);
    setValidationError(null);
    setInfoNotification('Editor content cleared.');
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
        setLanguage,
        setCode,
        setActiveFilename,
        setValidationError,
        setInfoNotification,
        loadSampleCode,
        clearCode,
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
