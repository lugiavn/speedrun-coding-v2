'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Editor } from '@monaco-editor/react';
import { api, fetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import CodeEntriesEditor, { CodeEntry, SupportedLanguage } from './problem-form/CodeEntriesEditor';
import HarnessFilesEditor, { HarnessFileEntry } from './problem-form/HarnessFilesEditor';
import BasicInfoTab from './problem-form/BasicInfoTab';

// Add generateSlug function
const generateSlug = (title: string): string => {
  return title
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading and trailing spaces
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple consecutive hyphens with single hyphen
};

interface ProblemFormProps {
  problemSlug?: string; // Present if editing, undefined if creating
}

interface ProblemData {
  id: number;
  title: string;
  slug: string;
  description_md: string;
  difficulty: string | null;
  tags: string[]; // Will be handled as comma-separated string in form
  time_thresholds: any; // Expecting array of objects
  solution_templates: any; // Expecting object { lang: code }
  reference_solutions: any; // Expecting object { lang: code }
  harness_eval_files?: any; // Expecting array of objects
  enabled: boolean; // Added enabled field
}

interface ThresholdEntry {
  id: string; // For React key, can be Date.now().toString() or a simple counter
  max_minutes: number | string; // Allow string for input, parse to number on change/submit
  rank: string;
}

const PROBLEM_FORM_SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
];

// Add Plain Text option for Harness Files specifically, or modify PROBLEM_FORM_SUPPORTED_LANGUAGES if it should be universal
const HARNESS_SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { label: 'Plain Text', value: 'plaintext' },
  ...PROBLEM_FORM_SUPPORTED_LANGUAGES,
];

const TABS = {
  BASIC: 'Basic Information',
  THRESHOLDS: 'Time Thresholds',
  TEMPLATES: 'Solution Templates',
  SOLUTIONS: 'Reference Solutions',
  HARNESS: 'Evaluation Files',
};

const ProblemForm: React.FC<ProblemFormProps> = ({ problemSlug }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  const isEditing = !!problemSlug;

  const [activeTab, setActiveTab] = useState(TABS.BASIC);
  const [problemId, setProblemId] = useState<number | null>(null);

  // Form field states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState(isEditing ? '' : 'Your fancy problem here');
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [difficulty, setDifficulty] = useState<string | null>(isEditing ? null : 'Easy');
  const [tags, setTags] = useState(''); // Comma-separated string
  const [enabled, setEnabled] = useState(false); // Added enabled state

  // State for Time Thresholds UI
  const [editableThresholds, setEditableThresholds] = useState<ThresholdEntry[]>(
    isEditing ? [] : [
      { id: Date.now().toString() + '_1', max_minutes: 1, rank: 'Wizard' },
      { id: Date.now().toString() + '_2', max_minutes: 5, rank: 'Senior Engineer' },
      { id: Date.now().toString() + '_3', max_minutes: 10, rank: 'Mid-Level Engineer' },
      { id: Date.now().toString() + '_4', max_minutes: 15, rank: 'New Grad' },
      { id: Date.now().toString() + '_5', max_minutes: 9999, rank: 'Participation Trophy' },
    ]
  );
  const [timeThresholdsJSON, setTimeThresholdsJSON] = useState(
    isEditing ? String.raw`[]` : String.raw`[
      {"max_minutes": 1, "rank": "Wizard"},
      {"max_minutes": 5, "rank": "Senior Engineer"},
      {"max_minutes": 10, "rank": "Mid-Level Engineer"},
      {"max_minutes": 15, "rank": "New Grad"},
      {"max_minutes": 9999, "rank": "Participation Trophy"}
    ]`
  );

  // State for Solution Templates UI - Now managed by ProblemForm directly, passed to CodeEntriesEditor
  const [editableSolutionTemplates, setEditableSolutionTemplates] = useState<CodeEntry[]>(
    isEditing ? [] : [
      { id: Date.now().toString() + '_template', lang: 'python', code: `
class Solution:
  def sort(self, values):
    pass
        ` }
    ]
  );
  
  // State for Reference Solutions UI - Now managed by ProblemForm directly, passed to CodeEntriesEditor
  const [editableReferenceSolutions, setEditableReferenceSolutions] = useState<CodeEntry[]>(
    isEditing ? [] : [
      { id: Date.now().toString() + '_reference', lang: 'python', code: `
class Solution:
  def sort(self, values):
    pass
        ` }
    ]
  );

  // const [harnessEvalFilesJSON, setHarnessEvalFilesJSON] = useState(String.raw`[]`); // Keep if used for other purposes, or remove
  const [editableHarnessFiles, setEditableHarnessFiles] = useState<HarnessFileEntry[]>(
    isEditing ? [] : [
      { 
        id: Date.now().toString() + '_eval',
        filename: 'eval_submission_codes.py',
        lang: 'python',
        content: `
import submission_codes
import random

if __name__ == '__main__':
  inputs = list(range(20))
  random.shuffle(inputs)
  solutions = sorted(inputs)
  
  values = [i for i in inputs]
  sol = submission_codes.Solution()
  sol.sort(values)
  
  if values == solutions:
    print('Correct')
  else:
    print('Incorrect')
    print('Input', inputs)
    print('Expected solution', solutions)
    print('Your', values)

        `
      }
    ]
  );
  // const [selectedHarnessFileId, setSelectedHarnessFileId] = useState<string | null>(null); // Moved to HarnessFilesEditor

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch problem data if editing
  const { data: existingProblemData, error: fetchError } = useSWR<ProblemData | {results?: ProblemData[]} >(
    isEditing && user?.is_staff ? `/problems/?slug=${problemSlug}` : null, // SWR key for unique fetching
    fetcher, 
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (fetchError) {
      setError(`Failed to load problem data: ${fetchError.message}`);
    }
    // The API /problems/?slug=... returns a list, so we expect results[0]
    const problemToEdit = Array.isArray(existingProblemData?.results) && existingProblemData.results.length > 0 
                          ? existingProblemData.results[0] 
                          : (existingProblemData && !Array.isArray(existingProblemData.results)) ? existingProblemData as ProblemData : null;

    if (isEditing && problemToEdit) {
      setTitle(problemToEdit.title || '');
      setSlug(problemToEdit.slug || '');
      if (problemToEdit.id) {
        setProblemId(problemToEdit.id);
      }
      setDescription(problemToEdit.description_md || '');
      setDifficulty(problemToEdit.difficulty || null);
      setTags((problemToEdit.tags || []).join(', '));
      setEnabled(problemToEdit.enabled);
      
      const initialThresholds = problemToEdit.time_thresholds || [];
      setEditableThresholds(initialThresholds.map((th: any, index: number) => ({ 
        id: Date.now().toString() + index,
        max_minutes: th.max_minutes !== undefined ? th.max_minutes : '',
        rank: th.rank || '' 
      })));

      // Initialize editableSolutionTemplates from fetched data
      const initialSolutionTemplates = problemToEdit.solution_templates || {};
      const loadedTemplates = Object.entries(initialSolutionTemplates).map(([lang, code], index) => ({
        id: Date.now().toString() + `_st_${index}`,
        lang: lang,
        code: code as string,
      }));
      setEditableSolutionTemplates(loadedTemplates);
      // Selection logic is now internal to CodeEntriesEditor

      // Initialize editableReferenceSolutions from fetched data
      const initialReferenceSolutions = problemToEdit.reference_solutions || {};
      const loadedRefSolutions = Object.entries(initialReferenceSolutions).map(([lang, code], index) => ({
        id: Date.now().toString() + `_rs_${index}`,
        lang: lang,
        code: code as string,
      }));
      setEditableReferenceSolutions(loadedRefSolutions);
      // Selection logic is now internal to CodeEntriesEditor

      // setHarnessEvalFilesJSON(JSON.stringify(problemToEdit.harness_eval_files || [], null, 2)); // Old way
      const initialHarnessFiles = problemToEdit.harness_eval_files || [];
      const loadedHarnessFiles = initialHarnessFiles.map((hf: any, index: number) => ({
        id: Date.now().toString() + `_hf_${index}`,
        filename: hf.filename || `file_${index + 1}.txt`,
        lang: hf.lang || 'plaintext',
        content: hf.content || '',
      }));
      setEditableHarnessFiles(loadedHarnessFiles);
      // setSelectedHarnessFileId(loadedHarnessFiles.length > 0 ? loadedHarnessFiles[0].id : null); // Selection handled by HarnessFilesEditor
    }
  }, [isEditing, existingProblemData, fetchError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title || !slug) {
      setError('Title and Slug are required.');
      setIsLoading(false);
      return;
    }

    let parsedTimeThresholds, parsedSolutionTemplates, parsedReferenceSolutions, parsedHarnessEvalFiles;
    try {
      // Time thresholds are now derived from editableThresholds
      parsedTimeThresholds = editableThresholds.map(th => ({ 
        max_minutes: Number(th.max_minutes),
        rank: th.rank 
      }));
      // Update the JSON string state as well, for consistency if needed elsewhere, though direct parsing is safer
      setTimeThresholdsJSON(JSON.stringify(parsedTimeThresholds, null, 2)); 

      // Solution Templates are derived from editableSolutionTemplates
      parsedSolutionTemplates = editableSolutionTemplates.reduce((obj, item) => {
        if (item.lang) obj[item.lang] = item.code;
        return obj;
      }, {} as Record<string, string>);

      // Reference Solutions are derived from editableReferenceSolutions
      parsedReferenceSolutions = editableReferenceSolutions.reduce((obj, item) => {
        if (item.lang) obj[item.lang] = item.code;
        return obj;
      }, {} as Record<string, string>);
      
      // Harness Eval Files are derived from editableHarnessFiles
      // parsedHarnessEvalFiles = harnessEvalFilesJSON ? JSON.parse(harnessEvalFilesJSON) : []; // Old way
      parsedHarnessEvalFiles = editableHarnessFiles.map(hf => ({
        filename: hf.filename,
        lang: hf.lang === 'plaintext' ? null : hf.lang, // Ensure 'plaintext' maps to null for API
        content: hf.content,
      }));

    } catch (jsonError: any) {
      setError(`Invalid JSON format: ${jsonError.message}`);
      setIsLoading(false);
      return;
    }

    const problemData: Partial<ProblemData> = {
      title,
      slug,
      description_md: description,
      difficulty: difficulty === '' ? null : difficulty,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      time_thresholds: parsedTimeThresholds,
      solution_templates: parsedSolutionTemplates,
      reference_solutions: parsedReferenceSolutions,
      harness_eval_files: parsedHarnessEvalFiles,
      enabled,
    };

    try {
      if (isEditing && problemId) {
        await api.problems.update(problemId, problemData);
        alert('Problem updated successfully!');
      } else if (!isEditing) {
        await api.problems.create(problemData);
        alert('Problem created successfully!');
      } else if (isEditing && !problemId) {
        setError('Cannot update problem: Problem ID is missing.');
        setIsLoading(false);
        return;
      }
      // Redirect to the problem detail page instead of the problems list
      router.push(`/problems/${slug}`);
    } catch (apiError: any) {
      setError(`API Error: ${apiError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/problems');
  };

  // --- Time Thresholds Logic ---
  const handleAddThreshold = () => {
    setEditableThresholds([
      ...editableThresholds,
      { id: Date.now().toString(), max_minutes: '', rank: '' },
    ]);
  };

  const handleRemoveThreshold = (idToRemove: string) => {
    setEditableThresholds(prev => prev.filter(th => th.id !== idToRemove));
  };

  const handleThresholdChange = (idToUpdate: string, field: keyof Omit<ThresholdEntry, 'id'>, value: string | number) => {
    setEditableThresholds(prev =>
      prev.map(th =>
        th.id === idToUpdate ? { ...th, [field]: field === 'max_minutes' ? (value === '' ? '' : Number(value)) : value } : th
      )
    );
  };

  // Effect to update timeThresholdsJSON string when editableThresholds changes
  useEffect(() => {
    const toStore = editableThresholds.map(th => ({ max_minutes: Number(th.max_minutes), rank: th.rank }));
    setTimeThresholdsJSON(JSON.stringify(toStore, null, 2));
  }, [editableThresholds]);
  // --- End Time Thresholds Logic ---

  // Modify how we handle title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Only auto-generate slug if we're not in edit mode to avoid breaking existing links.
    if (!isEditing) {
      setSlug(generateSlug(newTitle));
    }
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case TABS.BASIC:
        return (
          <BasicInfoTab
            title={title}
            onTitleChange={handleTitleChange}
            slug={slug}
            onSlugChange={setSlug}
            description={description}
            onDescriptionChange={setDescription}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            tags={tags}
            onTagsChange={setTags}
            isEditing={isEditing}
            showDescriptionPreview={showDescriptionPreview}
            onTogglePreview={() => setShowDescriptionPreview(!showDescriptionPreview)}
            editorTheme={editorTheme}
          />
        );
      case TABS.THRESHOLDS:
        return (
          <div className="space-y-4">
            {editableThresholds.map((threshold, index) => (
              <div key={threshold.id} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-700 rounded-md">
                <div className="flex-1">
                  <label htmlFor={`threshold-max-minutes-${threshold.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Minutes</label>
                  <input
                    type="number"
                    id={`threshold-max-minutes-${threshold.id}`}
                    value={threshold.max_minutes}
                    onChange={e => handleThresholdChange(threshold.id, 'max_minutes', e.target.value)}
                    placeholder="e.g., 5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`threshold-rank-${threshold.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rank Name</label>
                  <input
                    type="text"
                    id={`threshold-rank-${threshold.id}`}
                    value={threshold.rank}
                    onChange={e => handleThresholdChange(threshold.id, 'rank', e.target.value)}
                    placeholder="e.g., Wizard"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveThreshold(threshold.id)}
                  className="mt-6 ml-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddThreshold}
              className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Add Threshold
            </button>
          </div>
        );
      case TABS.TEMPLATES:
        return (
          <CodeEntriesEditor
            entries={editableSolutionTemplates}
            onEntriesChange={setEditableSolutionTemplates}
            supportedLanguages={PROBLEM_FORM_SUPPORTED_LANGUAGES}
            itemTypeLabel="template"
            idPrefix="sol-template"
            // editorTheme prop is optional, CodeEntriesEditor will use useTheme if not provided
          />
        );
      case TABS.SOLUTIONS:
        return (
          <CodeEntriesEditor
            entries={editableReferenceSolutions}
            onEntriesChange={setEditableReferenceSolutions}
            supportedLanguages={PROBLEM_FORM_SUPPORTED_LANGUAGES}
            itemTypeLabel="reference solution"
            idPrefix="ref-sol"
            // editorTheme prop is optional
          />
        );
      case TABS.HARNESS:
        // const selectedFile = editableHarnessFiles.find(hf => hf.id === selectedHarnessFileId); // Handled in HarnessFilesEditor
        return (
          <HarnessFilesEditor 
            files={editableHarnessFiles}
            onFilesChange={setEditableHarnessFiles}
            supportedLanguages={HARNESS_SUPPORTED_LANGUAGES}
            editorTheme={editorTheme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? `Edit Problem: ${problemSlug}` : 'Create New Problem'}
        </h1>
        <div>
          <label htmlFor="enabled" className="flex items-center cursor-pointer select-none">
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-500 dark:bg-gray-700 peer-checked:bg-indigo-600 transition-colors duration-300 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out peer-checked:after:translate-x-full peer-checked:after:border-white">
            </div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              Enabled (Problem is visible to users)
            </span>
          </label>
        </div>
      </div>

      {fetchError && !existingProblemData && isEditing && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900/50 dark:border-red-700/70 dark:text-red-300" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{`Failed to load problem data. ${error}`}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {Object.values(TABS).map((tabName) => (
              <button
                key={tabName}
                type="button"
                onClick={() => setActiveTab(tabName)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                  ${activeTab === tabName 
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'}
                `}
              >
                {tabName}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {renderFormContent()}
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/50 dark:border-red-700/70 dark:text-red-300" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Problem' : 'Create Problem')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProblemForm; 