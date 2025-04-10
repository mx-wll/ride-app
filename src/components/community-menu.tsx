'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Community</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="p-4">
            {users.map((user, i) => (
              <div key={user.id}>
                {i > 0 && <Separator className="my-4" />}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    {user.social_url && (
                      <a 
                        href={user.social_url}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {user.social_url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 