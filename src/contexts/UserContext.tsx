'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['users']['Row'];

type UserContextType = {
  currentUser: UserProfile | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const client = createClient();
    if (!client) return null;

    try {
      const { data: profile, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return profile;
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    const client = createClient();
    if (!client) return;

    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      if (isMountedRef.current) {
        setCurrentUser(profile);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initAuth = async () => {
      const client = createClient();
      if (!client) {
        setIsLoading(false);
        return;
      }

      // Check initial session with retry logic
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (!isMountedRef.current) return;

          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (isMountedRef.current) {
              setCurrentUser(profile);
            }
          }
          setIsLoading(false);
          break;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError' && attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
            continue;
          }
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          break;
        }
      }

      // Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!isMountedRef.current) return;
          if (event === 'INITIAL_SESSION') return;

          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (isMountedRef.current) {
              setCurrentUser(profile);
            }
          } else {
            if (isMountedRef.current) {
              setCurrentUser(null);
            }
          }
        }
      );

      subscriptionRef.current = subscription;
    };

    // Small delay to let the page stabilize
    const timeoutId = setTimeout(initAuth, 50);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const value = { currentUser, isLoading, refreshUser };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
