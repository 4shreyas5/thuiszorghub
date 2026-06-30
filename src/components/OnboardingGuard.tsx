'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/context/auth-context';
import { LoadingScreen } from '@/components/auth/LoadingScreen';

export interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user has completed onboarding (has organizationId), redirect to admin
      if (user?.organizationId) {
        router.push('/admin');
      }
    }
  }, [isLoading, isAuthenticated, user?.organizationId, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
