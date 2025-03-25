import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient<Database> | null = null

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
  
  try {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) as SupabaseClient<Database>

    return client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
} 