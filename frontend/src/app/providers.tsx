'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

// Environment context to make env vars available client-side
interface EnvContextType {
  [key: string]: string;
}

const EnvContext = createContext<EnvContextType>({});

export const useEnv = () => useContext(EnvContext);

interface ProvidersProps {
  children: ReactNode;
  env?: Record<string, string>;
}

export default function Providers({ children, env = {} }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  // Set environment variables on window for client-side access
  useEffect(() => {
    // Make env vars available globally
    if (typeof window !== 'undefined') {
      (window as any).__ENV__ = env;
    }
    setMounted(true);
  }, [env]);

  // Wait until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <EnvContext.Provider value={env}>
      <SWRConfig 
        value={{
          fetcher: (url: string) => fetchAPI(url),
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </SWRConfig>
    </EnvContext.Provider>
  );
} 