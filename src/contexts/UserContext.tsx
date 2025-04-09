'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import the client-side Supabase client creator
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
// Remove unused SupabaseClient import if needed later
// import type { SupabaseClient } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['users']['Row'];

type UserContextType = {
  currentUser: UserProfile | null;
  isLoading: boolean;
  // Expose setter if manual updates are truly needed, but auth flow should handle it
  // setCurrentUser: (user: UserProfile | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize client directly
    const client = createClient(); // Use the client-side function

    // Check initial session
    const checkUser = async () => {
      // Ensure client is valid
      if (!client) {
        console.error("UserProvider: Supabase client failed to initialize.");
        setIsLoading(false);
        return;
      }
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          console.error("UserProvider: Error getting session:", sessionError);
          setCurrentUser(null);
        } else if (session?.user) {
          // Fetch profile based on authenticated user ID
          const { data: profile, error: profileError } = await client
            .from('users')
            .select('*') // Select all columns defined in UserProfile Row type
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("UserProvider: Error fetching user profile:", profileError);
            setCurrentUser(null); // Or handle as partially logged in?
          } else {
            setCurrentUser(profile);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
         console.error("UserProvider: Exception during initial user check:", error);
         setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        // Re-check client validity in async callback
        if (!client) {
           console.error("UserProvider: Supabase client unavailable in onAuthStateChange.");
           setIsLoading(false);
           return;
        }

        setIsLoading(true); // Set loading true while we fetch/clear profile
        try {
           if (session?.user) {
            const { data: profile, error: profileError } = await client
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

             if (profileError) {
               console.error("UserProvider: Error fetching profile on auth change:", profileError);
               setCurrentUser(null);
             } else {
               setCurrentUser(profile);
             }
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
           console.error("UserProvider: Exception during auth state change handling:", error);
           setCurrentUser(null);
        } finally {
           setIsLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Pass profile as currentUser and loading state
  const value = { currentUser, isLoading /*, setCurrentUser */ }; // Expose setter only if needed

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