'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '@/components/ThemeProvider';

export interface CodeEntry {
  id: string; // For React key
  lang: string; // e.g., 'python', 'cpp'
  code: string;
}

export interface SupportedLanguage {
  label: string;
  value: string;
}

interface CodeEntriesEditorProps {
  entries: CodeEntry[];
  onEntriesChange: (newEntries: CodeEntry[]) => void;
  supportedLanguages: SupportedLanguage[];
  editorTheme?: string; // Optional, will use useTheme if not provided
  itemTypeLabel: string; // e.g., "template", "solution"
  idPrefix: string; // e.g., "sol-template", "ref-sol"
}

const CodeEntriesEditor: React.FC<CodeEntriesEditorProps> = ({
  entries,
  onEntriesChange,
  supportedLanguages,
  editorTheme: propEditorTheme,
  itemTypeLabel,
  idPrefix,
}) => {
  const { theme } = useTheme();
  const editorTheme = propEditorTheme || (theme === 'dark' ? 'vs-dark' : 'light');

  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');

  // Effect to select the first language or clear selection when entries change externally
  useEffect(() => {
    if (entries.length > 0) {
      const currentSelectedEntry = entries.find(entry => entry.lang === selectedLang);
      if (currentSelectedEntry) {
        // If current selection is still valid, keep it and its code
        if (currentCode !== currentSelectedEntry.code) { // Update if code changed externally
            setCurrentCode(currentSelectedEntry.code);
        }
      } else {
        // Current selection is no longer valid, select the first one
        setSelectedLang(entries[0].lang);
        setCurrentCode(entries[0].code);
      }
    } else {
      setSelectedLang(null);
      setCurrentCode('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]); // Rerun when entries array reference changes (e.g. initial load, or parent updates it)


  const handleSelectLanguage = useCallback((lang: string) => {
    // Save current code before switching
    if (selectedLang && currentCode !== entries.find(e => e.lang === selectedLang)?.code) {
      const updatedEntries = entries.map(entry =>
        entry.lang === selectedLang ? { ...entry, code: currentCode } : entry
      );
      onEntriesChange(updatedEntries); // Notify parent of potential change
    }

    const selectedEntry = entries.find(entry => entry.lang === lang);
    if (selectedEntry) {
      setSelectedLang(lang);
      setCurrentCode(selectedEntry.code);
    }
  }, [selectedLang, currentCode, entries, onEntriesChange]);

  const handleAddLanguage = (langToAdd: string) => {
    if (!langToAdd || entries.find(entry => entry.lang === langToAdd)) return;

    // Save current code before adding new and switching
    let currentEntries = [...entries];
    if (selectedLang && currentCode !== currentEntries.find(e => e.lang === selectedLang)?.code) {
       currentEntries = currentEntries.map(entry =>
        entry.lang === selectedLang ? { ...entry, code: currentCode } : entry
      );
    }

    const newEntry: CodeEntry = {
      id: Date.now().toString() + `_${idPrefix}_new`,
      lang: langToAdd,
      code: `// Start your ${supportedLanguages.find(l => l.value === langToAdd)?.label || langToAdd} ${itemTypeLabel} here`,
    };
    
    const updatedEntries = [...currentEntries, newEntry];
    onEntriesChange(updatedEntries);
    
    // Automatically select the new language
    setSelectedLang(langToAdd);
    setCurrentCode(newEntry.code);
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    const languageLabel = supportedLanguages.find(l => l.value === langToRemove)?.label || langToRemove;
    if (window.confirm(`Are you sure you want to remove the ${itemTypeLabel} for ${languageLabel}? This action cannot be undone.`)) {
      const updatedEntries = entries.filter(entry => entry.lang !== langToRemove);
      onEntriesChange(updatedEntries);

      if (selectedLang === langToRemove) {
        if (updatedEntries.length > 0) {
          setSelectedLang(updatedEntries[0].lang);
          setCurrentCode(updatedEntries[0].code);
        } else {
          setSelectedLang(null);
          setCurrentCode('');
        }
      }
    }
  };

  const handleCurrentCodeChange = (newCode: string | undefined) => {
    const codeValue = newCode || '';
    setCurrentCode(codeValue);
    // Update the specific entry in parent's state immediately as user types
    if (selectedLang) {
      const updatedEntries = entries.map(entry =>
        entry.lang === selectedLang ? { ...entry, code: codeValue } : entry
      );
      onEntriesChange(updatedEntries);
    }
  };

  const availableLanguagesToAdd = supportedLanguages.filter(
    lang => !entries.find(entry => entry.lang === lang.value)
  );

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4 items-end">
        {/* Language Selector Buttons */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Edit {itemTypeLabel} For:
          </label>
          <div className="flex flex-wrap gap-2">
            {entries.map((entry) => (
              <div key={entry.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage(entry.lang)}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none
                    ${selectedLang === entry.lang
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {supportedLanguages.find(l => l.value === entry.lang)?.label || entry.lang}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(entry.lang)}
                  className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                  title={`Remove ${entry.lang} ${itemTypeLabel}`}
                  aria-label={`Remove ${entry.lang} ${itemTypeLabel}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Add Language Dropdown */}
        {availableLanguagesToAdd.length > 0 && (
          <div className="flex-shrink-0">
            <label htmlFor={`${idPrefix}-add-lang-select`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Language:
            </label>
            <select
              id={`${idPrefix}-add-lang-select`}
              value="" // Reset after selection by onChange
              onChange={(e) => {
                if (e.target.value) handleAddLanguage(e.target.value);
                e.target.value = ""; // Reset select
              }}
              className="pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>-- Select Language --</option>
              {availableLanguagesToAdd.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {selectedLang && (
        <div
          style={{
            resize: 'vertical',
            overflow: 'auto',
            height: '300px',
            minHeight: '150px',
            maxHeight: '70vh',
            border: '1px solid #6b7280', // Tailwind gray-500
            borderRadius: '0.375rem', // Tailwind rounded-md
            padding: '2px' 
          }}
        >
          <Editor
            height="100%"
            language={supportedLanguages.find(l => l.value === selectedLang)?.value || 'plaintext'}
            value={currentCode}
            theme={editorTheme}
            onChange={handleCurrentCodeChange}
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 13,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </div>
      )}
      {!selectedLang && entries.length > 0 && (
        <p className="text-gray-600 dark:text-gray-400">Select a language above to edit its {itemTypeLabel}.</p>
      )}
      {!selectedLang && entries.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">Add a language to start creating {itemTypeLabel}s.</p>
      )}
    </div>
  );
};

export default CodeEntriesEditor; 