import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

// Remote database connection test function
export async function testDatabaseConnection() {
  const supabase = createClient()
  if (!supabase) return { success: false, error: 'Failed to create client' };
  
  try {
    // Use a simpler query that won't cause parsing issues
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Database connection test failed:', error)
      return { success: false, error }
    }
    
    console.log('Database connection successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Database connection exception:', error)
    return { success: false, error }
  }
}

export function createClient() {
  if (client) return client

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  console.log('Connecting to Supabase at URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean }) {
          document.cookie = `${name}=${value}; path=${options.path || '/'}`
        },
        remove(name: string, options: { path?: string }) {
          document.cookie = `${name}=; path=${options.path || '/'}; max-age=0`
        },
      },
      // Force remote database usage - don't use local storage
      persistSession: false,
      autoRefreshToken: true,
      global: {
        fetch: fetch.bind(globalThis)
      }
    }
  )

  return client
} 