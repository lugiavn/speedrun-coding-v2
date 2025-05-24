'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useScorecard, ProblemStatus } from '@/hooks/useScorecard';

// Types
interface TimeThreshold {
  rank: string;
  max_minutes: number;
}

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: string | null;
  tags: string[];
  enabled: boolean;
  time_thresholds: TimeThreshold[] | null;
}

interface ProblemListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Problem[];
}

// Helper function to count tags from problems
function getTagsWithCounts(problems: Problem[] = []): { tag: string; count: number }[] {
  const tagCounts: Record<string, number> = {};
  
  problems.forEach(problem => {
    if (problem.tags) {
      problem.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count); // Sort by count in descending order
}

// Helper function to get best time from problem's time_thresholds
const getProblemBestTime = (problem: Problem): number | null => {
  if (!problem.time_thresholds || problem.time_thresholds.length === 0) {
    return null;
  }
  let minMinutes = Infinity;
  let foundValidThreshold = false;
  for (const threshold of problem.time_thresholds) {
    if (typeof threshold.max_minutes === 'number') {
      minMinutes = Math.min(minMinutes, threshold.max_minutes);
      foundValidThreshold = true;
    }
  }
  return foundValidThreshold ? minMinutes : null;
};

export default function ProblemsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { scorecardData } = useScorecard();
  
  // Get query parameters
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const difficulty = searchParams.get('difficulty') || '';
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort_by') || 'title';
  const sortDirection = searchParams.get('sort_direction') || 'asc';
  
  // Helper function to get problem progress
  const getProblemProgress = (problem: Problem): string => {
    if (!scorecardData?.problems_and_status) {
      return "";
    }
    const problemStatus = scorecardData.problems_and_status.find(
      (status: ProblemStatus) => status.id === problem.id
    );
    
    return problemStatus?.status || "";
  };

  // State for filters
  const [searchInput, setSearchInput] = useState(search);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty);
  const [selectedTag, setSelectedTag] = useState(tag);
  
  // State for tag display
  const [showAllTags, setShowAllTags] = useState(false);
  const TOP_TAGS_COUNT = 10; // Number of tags to show when collapsed
  
  // Determine API sort parameters, skip for client-side 'best_time' sort
  const apiSortBy = sortBy === 'best_time' ? '' : sortBy;
  const apiSortDirection = sortBy === 'best_time' ? '' : sortDirection;

  // Fetch problems with filters
  const { data, error, isLoading } = useSWR<ProblemListResponse>(
    `?page=${page}${difficulty ? `&difficulty=${difficulty}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}${apiSortBy ? `&sort_by=${apiSortBy}` : ''}${apiSortBy && apiSortDirection ? `&sort_direction=${apiSortDirection}` : ''}`,
    api.problems.list
  );
  
  // Fetch all problems for accurate tag counts (without pagination or filters)
  const { data: allProblemsData } = useSWR<ProblemListResponse>(
    '?page_size=100', // Fetch more problems at once for tag counting
    api.problems.list
  );
  
  // Process problems for display (e.g., client-side sorting for 'best_time')
  const processedProblems = useMemo(() => {
    if (!data?.results) return [];
    
    let problemsToProcess = [...data.results];

    if (sortBy === 'best_time') {
      problemsToProcess.sort((a, b) => {
        const timeA = getProblemBestTime(a);
        const timeB = getProblemBestTime(b);

        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return sortDirection === 'asc' ? 1 : -1;
        if (timeB === null) return sortDirection === 'asc' ? -1 : 1;

        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      });
    } else if (sortBy === 'progress') {
      problemsToProcess.sort((a, b) => {
        const progressA = getProblemProgress(a);
        const progressB = getProblemProgress(b);

        if (!progressA && !progressB) return 0;
        if (!progressA) return sortDirection === 'asc' ? 1 : -1;
        if (!progressB) return sortDirection === 'asc' ? -1 : 1;

        return sortDirection === 'asc' 
          ? progressA.localeCompare(progressB)
          : progressB.localeCompare(progressA);
      });
    }
    return problemsToProcess;
  }, [data?.results, sortBy, sortDirection, getProblemBestTime, getProblemProgress]);
  
  // Extract unique tags from all problems with counts
  const tagsWithCounts = useMemo(() => {
    return getTagsWithCounts(allProblemsData?.results || []);
  }, [allProblemsData?.results]);
  
  // Get visible tags based on expand/collapse state
  const visibleTags = useMemo(() => {
    if (showAllTags) {
      return tagsWithCounts;
    }
    return tagsWithCounts.slice(0, TOP_TAGS_COUNT);
  }, [tagsWithCounts, showAllTags]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };
  
  // Update URL with filters
  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      params.set('page', '1');
    }
    
    router.push(`/problems?${params.toString()}`);
  };
  
  // Handle difficulty change
  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    updateFilters({ difficulty });
  };
  
  // Handle tag change
  const handleTagChange = (tag: string) => {
    // If the tag is already selected, clear it
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    updateFilters({ tag: newTag });
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setSelectedDifficulty('');
    setSelectedTag('');
    router.push('/problems');
  };
  
  // Get difficulty class
  const getDifficultyClass = (difficulty: string | null) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
    updateFilters({ sort_by: field, sort_direction: newDirection });
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Problems
          </h1>
        </div>
        {user?.is_staff && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/staff/problems/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              Create New Problem
            </Link>
          </div>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Search</h3>
              <form onSubmit={handleSearch} className="mt-2">
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search problems..."
                  />
                  <button
                    type="submit"
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Difficulty</h3>
              <div className="mt-2 space-y-2">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <div key={diff} className="flex items-center">
                    <input
                      id={`difficulty-${diff}`}
                      name="difficulty"
                      type="radio"
                      checked={selectedDifficulty === diff}
                      onChange={() => handleDifficultyChange(diff)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <label
                      htmlFor={`difficulty-${diff}`}
                      className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {diff}
                    </label>
                  </div>
                ))}
                <div className="flex items-center">
                  <input
                    id="difficulty-all"
                    name="difficulty"
                    type="radio"
                    checked={selectedDifficulty === ''}
                    onChange={() => handleDifficultyChange('')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <label
                    htmlFor="difficulty-all"
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    All Difficulties
                  </label>
                </div>
              </div>
            </div>
            
            {/* Tags Filter */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tags</h3>
              <div className="mt-2">
                {tagsWithCounts.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {visibleTags.map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => handleTagChange(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedTag === tag 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tag} <span className="ml-1 text-xs opacity-70">({count})</span>
                        </button>
                      ))}
                      {selectedTag && !visibleTags.some(item => item.tag === selectedTag) && (
                        <button
                          onClick={() => {}} // No action needed, just showing the selected tag
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {selectedTag} <span className="ml-1 text-xs opacity-70">
                            ({tagsWithCounts.find(item => item.tag === selectedTag)?.count || 0})
                          </span>
                        </button>
                      )}
                    </div>
                    
                    {/* Show more/less tags button */}
                    {tagsWithCounts.length > TOP_TAGS_COUNT && (
                      <button
                        onClick={() => setShowAllTags(!showAllTags)}
                        className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none"
                      >
                        {showAllTags ? 'Show fewer tags' : `Show all tags (${tagsWithCounts.length})`}
                      </button>
                    )}
                    
                    {/* Clear tag button */}
                    {selectedTag && (
                      <button
                        onClick={() => handleTagChange('')}
                        className="mt-2 ml-2 text-sm text-gray-500 dark:text-gray-400 hover:underline focus:outline-none"
                      >
                        Clear tag filter
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isLoading ? 'Loading tags...' : 'No tags available'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Clear Filters */}
            <div>
              <button
                onClick={clearFilters}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {isLoading ? (
            // Loading state
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <p className="text-red-500 dark:text-red-400">
                Error loading problems. Please try again later.
              </p>
            </div>
          ) : (
            // Problems list
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {/* Active Filters Display */}
              {(selectedDifficulty || selectedTag || search) && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                    {selectedDifficulty && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyClass(selectedDifficulty)}`}>
                        {selectedDifficulty}
                      </span>
                    )}
                    {selectedTag && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {selectedTag}
                      </span>
                    )}
                    {search && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Search: {search}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="w-8 px-1 py-4 text-sm text-center text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('progress')}
                    >
                      <div className="flex items-center justify-center">
                        {/* Progress column */}
                        <span>📈</span>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="pl-2 pr-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Title</span>
                        <span className="text-primary-600">{getSortIndicator('title')}</span>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('difficulty')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Difficulty</span>
                        <span className="text-primary-600">{getSortIndicator('difficulty')}</span>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Tags
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('best_time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Wizard-Time</span>
                        <span className="text-primary-600">{getSortIndicator('best_time')}</span>
                      </div>
                    </th>
                    {user?.is_staff && (
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {processedProblems.map((problem) => {
                    const bestTime = getProblemBestTime(problem);
                    return (
                      <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="w-8 px-1 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                          {getProblemProgress(problem)}
                        </td>
                        <td className="pl-0 pr-6 py-4">
                          <Link href={`/problems/${problem.slug}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                            {problem.title}
                            {user && user.is_staff && (
                              <span className={`ml-2 text-xs ${problem.enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {problem.enabled ? '(Enabled)' : '(Disabled)'}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyClass(problem.difficulty)}`}>
                            {problem.difficulty || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.map((tag) => (
                              <span 
                                key={tag} 
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${selectedTag === tag ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                                onClick={() => handleTagChange(tag)}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {bestTime !== null ? `${bestTime} min` : 'N/A'}
                        </td>
                        {user?.is_staff && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/staff/problems/edit/${problem.slug}`}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Modify
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  
                  {processedProblems.length === 0 && (
                    <tr>
                      <td colSpan={user?.is_staff ? 5 : 4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {data && data.count > 0 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{data.results.length}</span> out of{' '}
                        <span className="font-medium">{data.count}</span> items (page <span className="font-medium">{page}</span>)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={!data.previous}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                            data.previous
                              ? 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!data.next}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                            data.next
                              ? 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 