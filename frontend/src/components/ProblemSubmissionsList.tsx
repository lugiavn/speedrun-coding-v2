'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
// Removed import of undefined types: ApiSubmissionsListResponse, SubmissionResult

// Define the types needed for this component
interface SubmissionResult {
  id: number;
  language: string;
  status: string | null;
  submitted_at: string | null; // ISO date string
  duration_ms: number | null;
  memory_kb: number | null;
  rank: string | null;
  passed: boolean;
  problem_title?: string;
  code?: string;
  raw_results?: any;
  // Add any other fields that come from the backend
}

interface ApiSubmissionsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SubmissionResult[];
}

interface ProblemSubmissionsListProps {
  problemId: number;
}

// Helper to format duration from milliseconds to a more readable string
const formatDuration = (milliseconds: number | null | undefined): string => {
  if (milliseconds === null || typeof milliseconds === 'undefined') {
    return 'N/A';
  }
  if (milliseconds < 0) return 'N/A'; // Should not happen

  // Calculate total seconds, hours, minutes, seconds, and milliseconds
  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((milliseconds % 1000) / 10); // Only show 2 decimal places (centiseconds)

  // Format the time parts
  const formattedMs = ms.toString().padStart(2, '0');
  let result = '';

  // Only include hours if there are any
  if (hours > 0) {
    result += `${hours}h `;
  }

  // Only include minutes if there are any hours or minutes
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }

  // Always include seconds with milliseconds
  result += `${seconds}.${formattedMs}s`;

  return result;
};

// Simple date formatter function since date-fns isn't available
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString(); // Uses the browser's locale settings
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Fallback to the original string
  }
};

export default function ProblemSubmissionsList({ problemId }: ProblemSubmissionsListProps) {
  // Track expanded submission rows
  const [expandedSubmissionIds, setExpandedSubmissionIds] = useState<Set<number>>(new Set());
  
  // Fetch problem submissions list
  const { data, error, isLoading } = useSWR<ApiSubmissionsListResponse>(
    problemId ? `problem-submissions-${problemId}` : null,
    () => problemId ? api.submissions.getForProblem(problemId) : null
  );

  // Debug: Log what's being returned from the API
  React.useEffect(() => {
    console.log('Submissions API response:', { data, error, isLoading });
  }, [data, error, isLoading]);

  // Toggle expanded state for a submission
  const toggleExpand = (submissionId: number) => {
    setExpandedSubmissionIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(submissionId)) {
        newIds.delete(submissionId);
      } else {
        newIds.add(submissionId);
      }
      return newIds;
    });
  };

  if (isLoading) return <div className="p-4">Loading submissions...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading submissions: {error.message || JSON.stringify(error)}</div>;
  if (!data || !data.results || data.results.length === 0) {
    return <div className="p-4">No submissions found for this problem.</div>;
  }

  const submissions = data.results;

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Passed
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Rank
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Language
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {submissions.map((submission: SubmissionResult) => (
            <React.Fragment key={submission.id}>
              <tr 
                onClick={() => toggleExpand(submission.id)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <div className={`mr-2 transition-transform duration-200 ${expandedSubmissionIds.has(submission.id) ? 'rotate-90' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      submission.status === 'success' || submission.passed
                        ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        : submission.status === 'runtime_error' || submission.status === 'compile_error' ||  submission.status === 'timeout'
                        ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                    }`}>
                      {submission.status || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div>
                    {submission.passed ?
                      <span className="text-green-600 dark:text-green-400">Yes</span> :
                      submission.passed === false ?
                      <span className="text-red-600 dark:text-red-400">No</span> :
                      <span className="text-gray-500">-</span>
                    }
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(submission.submitted_at)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div>
                    <div>{submission.rank || 'NoRank'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDuration(submission.duration_ms)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {submission.language}
                </td>
              </tr>
              
              {/* Expanded details row */}
              {expandedSubmissionIds.has(submission.id) && (
                <SubmissionDetailRow submissionId={submission.id} />
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Component for fetching and displaying expanded submission details
function SubmissionDetailRow({ submissionId }: { submissionId: number }) {
  // Get current user info to check if staff/admin
  const { user } = useAuth();
  const isStaffOrAdmin = user?.is_staff || user?.is_superuser;
  
  // Fetch detailed submission data
  const { data, error, isLoading } = useSWR(
    `submission-detail-${submissionId}`,
    () => api.submissions.getById(submissionId)
  );
  
  if (isLoading) {
    return (
      <tr className="bg-gray-50 dark:bg-gray-800">
        <td colSpan={4} className="px-6 py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-pulse h-4 w-4 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading details...</span>
          </div>
        </td>
      </tr>
    );
  }
  
  if (error) {
    return (
      <tr className="bg-gray-50 dark:bg-gray-800">
        <td colSpan={4} className="px-6 py-4 text-red-500">
          Error loading submission details
        </td>
      </tr>
    );
  }
  
  if (!data) {
    return (
      <tr className="bg-gray-50 dark:bg-gray-800">
        <td colSpan={4} className="px-6 py-4 text-gray-600 dark:text-gray-400">
          No details available
        </td>
      </tr>
    );
  }
  
  // Format the test results for display
  const submission = data;
  const hasTestResults = submission.raw_results && Object.keys(submission.raw_results).length > 0;
  const hasStderr = submission.raw_results?.stderr;
  const hasStdout = submission.raw_results?.stdout;
  
  return (
    <tr className="bg-gray-50 dark:bg-gray-800">
      <td colSpan={4} className="px-6 py-4">
        <div className="space-y-4">
          
          {/* STDERR section */}
          {hasStderr && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-red-600 dark:text-red-400">STDERR</h3>
              <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded overflow-auto max-h-60 text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
                <code className="block w-full overflow-x-auto">{submission.raw_results.stderr}</code>
              </pre>
            </div>
          )}
          
          {/* STDOUT section */}
          {hasStdout && (
            <div>
              <h3 className="text-md font-semibold mb-2">STDOUT</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60 whitespace-pre-wrap break-all">
                <code className="block w-full overflow-x-auto">{submission.raw_results.stdout}</code>
              </pre>
            </div>
          )}

          {/* Code section */}
          <div>
            <h3 className="text-md font-semibold mb-2">Submitted Code</h3>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60 whitespace-pre-wrap break-all">
              <code className="block w-full overflow-x-auto">{submission.code || 'Code not available'}</code>
            </pre>
          </div>
          
          {/* Test results section - only visible to staff/admin */}
          {hasTestResults && isStaffOrAdmin && (
            <div>
              <h3 className="text-md font-semibold mb-2">Test Results</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <pre className="overflow-auto max-h-60 whitespace-pre-wrap break-all">
                  <code className="block w-full overflow-x-auto">{JSON.stringify(submission.raw_results, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
} 