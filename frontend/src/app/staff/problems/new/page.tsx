'use client';

import React from 'react';
import ProblemForm from '@/components/admin/ProblemForm';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const CreateProblemPage = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.is_staff)) {
      router.push('/'); // Or '/login' or '/unauthorized'
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user?.is_staff) {
    // Render loading or a blank page during redirect to avoid flash of content
    return <div className="container mx-auto px-4 py-8 text-center">Loading or preparing redirect...</div>;
  }

  return <ProblemForm />;
};

export default CreateProblemPage; 