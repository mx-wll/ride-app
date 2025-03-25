import { supabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      ride_participants(
        user_id,
        created_at,
        users(
          id,
          email,
          full_name
        )
      ),
      users!rides_created_by_fkey(
        id,
        email,
        full_name
      )
    `)
    .order('ride_time', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(rides)
} 