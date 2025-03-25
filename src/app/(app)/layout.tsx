'use client';

import Navigation from '@/components/Navigation';
import { useUser } from '@/contexts/UserContext';
import { redirect } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    // In development, redirect to members page to add a user
    redirect('/members');
  }

  return (
    <>
      <Navigation />
      <main>
        <div>
          {children}
        </div>
      </main>
    </>
  );
}  