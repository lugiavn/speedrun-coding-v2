'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RandomProblemPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchRandomProblem = async () => {
      try {
        // Fetch all problems
        const response = await api.problems.list();
        if (response?.results?.length > 0) {
          // Filter enabled problems if needed
          const availableProblems = response.results.filter(p => p.enabled !== false);
          if (availableProblems.length > 0) {
            // Select a random problem
            const randomProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
            // Redirect to the problem page
            router.push(`/problems/${randomProblem.slug}`);
          } else {
            router.push('/problems'); // Redirect to problems list if no available problems
          }
        } else {
          router.push('/problems'); // Redirect to problems list if no problems
        }
      } catch (error) {
        console.error('Failed to fetch random problem:', error);
        router.push('/problems'); // Redirect to problems list on error
      }
    };

    fetchRandomProblem();
  }, []); // Run once on component mount

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Finding a random problem for you...</p>
      </div>
    </div>
  );
} 