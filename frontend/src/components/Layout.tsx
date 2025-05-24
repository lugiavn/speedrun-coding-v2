'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';
import { useScorecard } from '@/hooks/useScorecard';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const { scorecardData } = useScorecard();
  
  // Check if current page is a problem detail page
  const isProblemDetailPage = pathname?.startsWith('/problems/') && pathname !== '/problems';
  
  return (
    <div className={`${isProblemDetailPage ? 'h-screen' : 'min-h-screen'} flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200 ${isProblemDetailPage ? 'overflow-hidden' : ''}`}>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  Speedrun Coding
                </Link>
              </div>
              <nav className="ml-6 flex items-center space-x-4">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                 ⭐Intro
                </Link>
                <Link href="/problems" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                 📚Problems
                </Link>
                <Link href="/random_problem" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                 🧩Let's Code!
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link href="/scorecard" className="px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
                    <b>{user?.username}</b>: {scorecardData?.scorecard_rank} (Coverage: {Math.round((scorecardData?.scorecard_problem_coverage || 0) * 100)}%)
                  </Link>
                  <Link
                    href="/logout"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Logout
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-grow ${isProblemDetailPage ? 'overflow-hidden' : ''}`}>
        {children}
      </main>

      {/* Only render footer if not on a problem detail page */}
      {!isProblemDetailPage && (
        <footer className="bg-white dark:bg-gray-800 shadow-inner">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Speedrun Coding. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
} 