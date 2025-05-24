'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { SupportedLanguage } from './CodeEntriesEditor';

export interface HarnessFileEntry {
  id: string;          // Unique client-side ID
  filename: string;
  lang: string;        // Can be 'plaintext' or similar for plain text
  content: string;
}

interface HarnessFilesEditorProps {
  files: HarnessFileEntry[];
  onFilesChange: (files: HarnessFileEntry[]) => void;
  supportedLanguages: SupportedLanguage[];
  editorTheme: string;
}

const HarnessFilesEditor: React.FC<HarnessFilesEditorProps> = ({
  files,
  onFilesChange,
  supportedLanguages,
  editorTheme,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Effect to select the first file if available and none is selected
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      setSelectedFileId(files[0].id);
    } else if (selectedFileId && !files.find(f => f.id === selectedFileId) && files.length > 0) {
      // If selected file was removed, select the first one
      setSelectedFileId(files[0].id);
    } else if (files.length === 0) {
      setSelectedFileId(null);
    }
  }, [files, selectedFileId]);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  const handleAddFile = () => {
    const newFileId = Date.now().toString() + '_hf_new';
    const newFile: HarnessFileEntry = {
      id: newFileId,
      filename: `new_file_${files.length + 1}.txt`,
      lang: 'plaintext', // Default to plaintext
      content: '',
    };
    onFilesChange([...files, newFile]);
    setSelectedFileId(newFileId);
  };

  const handleRemoveFile = (fileIdToRemove: string) => {
    if (window.confirm('Are you sure you want to remove this harness file?')) {
      const updatedFiles = files.filter(hf => hf.id !== fileIdToRemove);
      onFilesChange(updatedFiles);
      // Selection logic is handled by useEffect
    }
  };

  const handleFileDetailChange = (fileId: string, field: keyof Omit<HarnessFileEntry, 'id' | 'content'>, value: string) => {
    onFilesChange(
      files.map(hf =>
        hf.id === fileId ? { ...hf, [field]: value } : hf
      )
    );
  };

  const handleFileContentChange = (fileId: string, newContent: string | undefined) => {
    onFilesChange(
      files.map(hf =>
        hf.id === fileId ? { ...hf, content: newContent || '' } : hf
      )
    );
  };

  const selectedFile = files.find(hf => hf.id === selectedFileId);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* File List Sidebar */}
      <div className="w-full md:w-1/4 border rounded-md p-2 overflow-y-auto bg-gray-50 dark:bg-gray-800 md:max-h-[500px]">
        <button
          type="button"
          onClick={handleAddFile}
          className="mb-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New File
        </button>
        {files.map(hf => (
          <div
            key={hf.id}
            className={`p-2 mb-1 rounded cursor-pointer text-gray-700 dark:text-gray-300 ${
              selectedFileId === hf.id
                ? 'bg-blue-500 text-white dark:bg-blue-700 dark:text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleSelectFile(hf.id)}
          >
            {hf.filename || `(untitled ${hf.id.substring(0,4)})`}
          </div>
        ))}
        {files.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No files yet. Click "Add New File" to start.</p>}
      </div>

      {/* Editor Pane */}
      <div className="w-full md:w-3/4 flex flex-col border rounded-md p-4 bg-white dark:bg-gray-800">
        {selectedFile ? (
          <>
            <div className="mb-3">
              <label htmlFor="harnessFilename" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Filename:</label>
              <input
                type="text"
                id="harnessFilename"
                value={selectedFile.filename}
                onChange={(e) => handleFileDetailChange(selectedFile.id, 'filename', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., evaluation_script.py or test_case.json"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="harnessLanguage" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Language:</label>
              <select
                id="harnessLanguage"
                value={selectedFile.lang}
                onChange={(e) => handleFileDetailChange(selectedFile.id, 'lang', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.value} value={lang.value} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Content:</div>
            <div
              className="border rounded dark:border-gray-600"
              style={{
                position: 'relative',
                resize: 'vertical',
                overflow: 'auto',
                height: '300px',
                minHeight: '150px',
                maxHeight: '70vh',
              }}
            >
              <Editor
                height="100%"
                language={selectedFile.lang === 'plaintext' ? 'text' : selectedFile.lang}
                theme={editorTheme}
                value={selectedFile.content}
                onChange={(value) => handleFileContentChange(selectedFile.id, value)}
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveFile(selectedFile.id)}
              className="mt-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 self-start"
            >
              Remove This File
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Select a file to edit or add a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarnessFilesEditor; 