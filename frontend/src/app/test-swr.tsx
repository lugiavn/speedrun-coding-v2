'use client';

import { useState } from 'react';
import useSWR from 'swr';

// A simple fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TestSWR() {
  // Using a public test API
  const { data, error, isLoading } = useSWR(
    'https://jsonplaceholder.typicode.com/todos/1', 
    fetcher
  );

  if (error) return <div className="text-red-500">Failed to load data</div>;
  if (isLoading) return <div className="text-blue-500">Loading...</div>;

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-bold mb-2">SWR Test</h2>
      <p>Successfully loaded data with SWR:</p>
      <pre className="bg-gray-100 p-2 rounded mt-2">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 