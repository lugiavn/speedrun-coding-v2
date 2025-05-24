'use client';

import React from 'react';
import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';

interface BasicInfoTabProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  slug: string;
  onSlugChange: (newSlug: string) => void;
  description: string;
  onDescriptionChange: (newDescription: string) => void;
  difficulty: string | null;
  onDifficultyChange: (newDifficulty: string) => void;
  tags: string;
  onTagsChange: (newTags: string) => void;
  isEditing: boolean;
  showDescriptionPreview: boolean;
  onTogglePreview: () => void;
  editorTheme: string;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  title,
  onTitleChange,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  difficulty,
  onDifficultyChange,
  tags,
  onTagsChange,
  isEditing,
  showDescriptionPreview,
  onTogglePreview,
  editorTheme,
}) => {
  return (
    <div className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-white p-2.5"
            placeholder="e.g., Two Sum"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-white p-2.5"
            placeholder="e.g., two-sum"
            disabled={!isEditing}
          />
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 
              "Slug can only be edited in edit mode to prevent breaking existing links." :
              "Automatically generated from title. Will be used in the URL."}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Markdown)</label>
          <button 
            type="button" 
            onClick={onTogglePreview}
            className="px-3 py-1 text-xs font-medium rounded-md text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
          >
            {showDescriptionPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        <div className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
          <Editor
            height="300px"
            defaultLanguage="markdown"
            value={description}
            onChange={(value) => onDescriptionChange(value || '')}
            theme={editorTheme}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 14,
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 0,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { 
                top: 10,
                bottom: 10,
                left: 20
              }
            }}
          />
        </div>
        {showDescriptionPreview && (
          <div className="mt-4 p-4 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
        <p className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${showDescriptionPreview ? 'hidden' : 'block'}`}>
          Use Markdown for formatting. Preview will be shown on the problem page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty || ''}
            onChange={e => onDifficultyChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-white p-2.5"
          >
            {isEditing && <option value="">-- Select Difficulty --</option>}
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={e => onTagsChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-white p-2.5"
            placeholder="e.g., array, hash-table, sorting"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab; 