import useSWR from 'swr';
import { useAuth } from '@/components/AuthProvider';
import { fetcher } from '@/lib/api';

export interface ProblemStatus {
  id: number;
  slug: string;
  title: string;
  status: string;
  attempted: boolean;
  passed: boolean;
}

export interface ScorecardData {
  username: string;
  scorecard_rank: string;
  scorecard_problem_coverage: number;
  scorecard_description: string;
  problems_and_status: ProblemStatus[];
}

export function useScorecard() {
  const { user } = useAuth();
  
  const { data, error, isLoading } = useSWR<ScorecardData>(
    user ? '/scorecard/' : null,
    fetcher
  );

  return {
    scorecardData: data,
    isLoading,
    isError: error
  };
} 