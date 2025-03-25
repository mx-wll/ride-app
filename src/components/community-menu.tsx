'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage, getAvatarGradient } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  social_url?: string
}

export function CommunityMenu() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setError('Unable to connect to the database')
      setIsLoading(false)
      return
    }

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url, social_url')
          .order('full_name')

        if (error) throw error
        if (data) {
          setUsers(data)
        }
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load community members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Users className="h-5 w-5 animate-pulse" />
      </Button>
    )
  }

  if (error) {
    return (
      <Button variant="ghost" size="icon" disabled title={error}>
        <Users className="h-5 w-5 text-red-500" />
      </Button>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Community</h2>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src={user.avatar_url}
                    alt={user.full_name}
                    style={!user.avatar_url ? { background: getAvatarGradient(user.full_name) } : undefined}
                  />
                  <AvatarFallback style={{ background: getAvatarGradient(user.full_name) }}>
                    {user.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  {user.social_url && (
                    <a
                      href={user.social_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {user.social_url}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 