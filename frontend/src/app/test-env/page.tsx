'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEnv } from '../providers';
import { API_BASE_URL, FEATURES } from '@/lib/config';

export default function TestEnv() {
  const env = useEnv();
  const [clientEnv, setClientEnv] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get environment variables that are available on the client
    setClientEnv({
      'API_BASE_URL (from config)': API_BASE_URL,
      'DARK_MODE (from config)': FEATURES.darkMode ? 'true' : 'false',
      'Window __ENV__': JSON.stringify((window as any).__ENV__ || {}),
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Environment Variables Test</h1>
        <Link href="/" className="text-primary-600 hover:text-primary-800">
          Back to Home
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-md p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Server-Side Environment Variables</h2>
          <div className="space-y-2">
            {Object.entries(env).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="font-semibold">{key}</span>
                <code className="bg-gray-100 p-1 rounded text-sm">{value}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Client-Side Environment Variables</h2>
          <div className="space-y-2">
            {Object.entries(clientEnv).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="font-semibold">{key}</span>
                <code className="bg-gray-100 p-1 rounded text-sm">{value}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 