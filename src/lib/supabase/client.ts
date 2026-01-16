import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

let client: SupabaseClient<Database> | null = null

// Remote database connection test function
export async function testDatabaseConnection() {
  const supabase = createClient()
  if (!supabase) return { success: false, error: 'Failed to create client' };

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}

export function createClient(): SupabaseClient<Database> | null {
  if (client) return client

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return null
  }

  try {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    return client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
} 