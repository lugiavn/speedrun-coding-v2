'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Perform logout when the component mounts
    if (isAuthenticated) {
      logout();
    }
  }, [logout, isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logged Out</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You have been successfully logged out.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 