'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor with no SSR to avoid hydration issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

export default function TestMonaco() {
  const [code, setCode] = useState(`function helloWorld() {
  console.log("Hello, Monaco Editor!");
}

// Try editing this code
helloWorld();`);

  const [language, setLanguage] = useState('javascript');

  const handleEditorChange = (value: string | undefined) => {
    if (value) setCode(value);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">Monaco Editor Test</h1>
        <Link href="/" className="text-primary-600 hover:text-primary-800">
          Back to Home
        </Link>
      </div>

      <div className="mb-4">
        <label htmlFor="language-select" className="block mb-2 font-medium">
          Select Language:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      {/* 
        Using a responsive height container for the Monaco Editor
        - On mobile: 50vh (50% of viewport height)
        - On desktop: 70vh (70% of viewport height)
      */}
      <div className="border rounded-md overflow-hidden h-[50vh] md:h-[70vh] w-full">
        <MonacoEditor
          height="100%"
          width="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h2 className="text-xl font-bold mb-2">Current Code:</h2>
        <pre className="whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
} 