'use client';

import React from 'react';
import ProblemForm from '@/components/admin/ProblemForm';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';

interface EditProblemPageProps {
  params: {
    slug: string;
  };
}

const EditProblemPage: React.FC<EditProblemPageProps> = ({ params }) => {
  const { slug } = params;
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.is_staff)) {
      router.push('/'); // Or '/login' or '/unauthorized'
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user?.is_staff) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading or preparing redirect...</div>;
  }

  return <ProblemForm problemSlug={slug} />;
};

export default EditProblemPage; 