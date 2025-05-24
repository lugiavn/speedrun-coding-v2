'use client';

import React, { useMemo } from 'react';
import { useScorecard } from '@/hooks/useScorecard';
import Link from 'next/link';

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function ScorecardPage(): React.JSX.Element {
  const { scorecardData, isLoading } = useScorecard();

  // Memoize the filtered and randomized problem lists
  const { unattemptedProblems, unsolvedProblems } = useMemo(() => {
    if (!scorecardData?.problems_and_status) {
      return { unattemptedProblems: [], unsolvedProblems: [] };
    }

    const unattempted = scorecardData.problems_and_status.filter(p => !p.attempted);
    const unsolved = scorecardData.problems_and_status.filter(p => p.attempted && !p.passed);

    return {
      unattemptedProblems: getRandomItems(unattempted, 5),
      unsolvedProblems: getRandomItems(unsolved, 5)
    };
  }, [scorecardData?.problems_and_status]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Scorecard</h1>
        
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Rank</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{scorecardData?.scorecard_rank || 'Not Ranked'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Problem Coverage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scorecardData ? `${Math.round(scorecardData.scorecard_problem_coverage * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Unsolved Problems Section */}
            {unsolvedProblems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Finish these unsolved problems to improve your rank</h2>
                <ul className="space-y-3">
                  {unsolvedProblems.map(problem => (
                    <li key={problem.id} className="flex items-center">
                      <Link 
                        href={`/problems/${problem.slug}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        {problem.title}
                      </Link>
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        In Progress
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* New Problems Section */}
            {unattemptedProblems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Try Some New Problems to improve your coverage</h2>
                <ul className="space-y-3">
                  {unattemptedProblems.map(problem => (
                    <li key={problem.id} className="flex items-center">
                      <Link 
                        href={`/problems/${problem.slug}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        {problem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Account Settings</h2>
              <Link 
                href="/change-password" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Change Password
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 