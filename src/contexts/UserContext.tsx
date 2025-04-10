'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import the client-side Supabase client creator
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
// Re-add SupabaseClient import and add AuthChangeEvent/Session
import type { SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
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
    console.log("UserProvider: useEffect started.");
    let client: SupabaseClient<Database> | null = null;
    try {
      client = createClient(); // Use the client-side function
      console.log("UserProvider: Supabase client created.");
    } catch (error) {
      console.error("UserProvider: CRITICAL - Failed to create Supabase client:", error);
      setIsLoading(false); // Ensure loading stops even if client fails
      return; // Stop execution if client creation fails
    }

    // Check initial session
    const checkUser = async () => {
      console.log("UserProvider: checkUser started.");
      // Check added previously handles this, but belt-and-suspenders
      if (!client) {
        console.error("UserProvider: checkUser - Supabase client is null.");
        setIsLoading(false);
        return;
      }
      try {
        console.log("UserProvider: checkUser - Calling getSession...");
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        console.log("UserProvider: checkUser - getSession finished. Session:", session);

        if (sessionError) {
          console.error("UserProvider: checkUser - Error getting session:", sessionError);
          setCurrentUser(null);
        } else if (session?.user) {
          console.log("UserProvider: checkUser - Session found, fetching profile for user:", session.user.id);
          const { data: profile, error: profileError } = await client
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log("UserProvider: checkUser - Profile fetch finished. Profile:", profile);

          if (profileError) {
            console.error("UserProvider: checkUser - Error fetching user profile:", profileError);
            setCurrentUser(null);
          } else {
            setCurrentUser(profile);
          }
        } else {
          console.log("UserProvider: checkUser - No active session found.");
          setCurrentUser(null);
        }
      } catch (error) {
         console.error("UserProvider: checkUser - Exception during initial user check:", error);
         setCurrentUser(null);
      } finally {
        console.log("UserProvider: checkUser - Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    checkUser();

    console.log("UserProvider: Setting up onAuthStateChange listener.");
    // Need to check client again before setting listener
    if (!client) {
      console.error("UserProvider: Cannot set auth listener, client is null.");
      // Loading state should have already been set to false by checkUser failure
      return;
    }
    const { data: { subscription } } = client.auth.onAuthStateChange(
      // Add explicit types for event and session
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("UserProvider: onAuthStateChange triggered. Event:", event, "Session:", session);
        // Re-check client validity in async callback
        if (!client) {
           console.error("UserProvider: onAuthStateChange - Supabase client unavailable.");
           setIsLoading(false); 
           return;
        }

        setIsLoading(true); // Set loading true while we fetch/clear profile
        console.log("UserProvider: onAuthStateChange - Set isLoading to true.");
        try {
           if (session?.user) {
             console.log("UserProvider: onAuthStateChange - Session found, fetching profile for user:", session.user.id);
            const { data: profile, error: profileError } = await client
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            console.log("UserProvider: onAuthStateChange - Profile fetch finished. Profile:", profile);

             if (profileError) {
               console.error("UserProvider: onAuthStateChange - Error fetching profile on auth change:", profileError);
               setCurrentUser(null);
             } else {
               setCurrentUser(profile);
             }
          } else {
            console.log("UserProvider: onAuthStateChange - No session, setting user to null.");
            setCurrentUser(null);
          }
        } catch (error) {
           console.error("UserProvider: onAuthStateChange - Exception during auth state change handling:", error);
           setCurrentUser(null);
        } finally {
           console.log("UserProvider: onAuthStateChange - Setting isLoading to false.");
           setIsLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("UserProvider: useEffect cleanup - Unsubscribing from auth changes.");
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