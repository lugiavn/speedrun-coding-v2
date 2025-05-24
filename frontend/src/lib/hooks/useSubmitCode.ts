import { useState } from 'react';
import { api } from '../api';
import { mutate } from 'swr';

interface SubmitCodeOptions {
  problemId: number;
  language: string;
  code: string;
  startTime: number;
}

export function useSubmitCode() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  
  const submitCode = async ({ problemId, language, code, startTime }: SubmitCodeOptions) => {
    if (isSubmitting) return null;
    
    try {
      setIsSubmitting(true);
      
      // Calculate duration in milliseconds
      const duration = Date.now() - startTime;
      
      // Create a pending submission object for UI feedback
      const pendingSubmissionData = {
        id: `pending-${Date.now()}`,
        language,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        duration_ms: duration,
        memory_kb: null,
        rank: 'Pending',
        passed: null,
        isPending: true
      };
      
      setPendingSubmission(pendingSubmissionData);
      
      // Send to backend
      const submissionData = {
        problem: problemId,
        language,
        code,
        started_at: new Date(startTime).toISOString(),
        submitted_at: new Date().toISOString()
      };
      
      console.log('Submitting code:', submissionData);
      
      const result = await api.submissions.create(submissionData);
      console.log('Submission result:', result);
      
      // Clear the pending submission and refresh cache
      setPendingSubmission(null);
      
      // Refresh the submissions list cache
      mutate(`problem-submissions-${problemId}`);
      
      return result;
    } catch (error) {
      console.error('Error submitting code:', error);
      
      // Update the pending submission to show error
      if (pendingSubmission) {
        setPendingSubmission({
          ...pendingSubmission,
          status: 'error',
          rank: 'Failed',
          passed: false
        });
      }
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    submitCode,
    isSubmitting,
    pendingSubmission
  };
} 