'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback, getAvatarGradient } from "@/components/ui/avatar"
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

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
    return <div>Loading community...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-lg font-semibold flex items-center gap-2">
          Oberland Racing
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <div className="p-2">
          <h3 className="mb-2 px-2 text-sm font-medium">Community Members</h3>
          {users.map((user) => (
            user.social_url ? (
              <Link 
                key={user.id}
                href={user.social_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block"
              >
                <DropdownMenuItem className="flex items-center gap-2 p-2 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatar_url}
                      style={!user.avatar_url ? { background: getAvatarGradient(user.full_name) } : undefined}
                    />
                    <AvatarFallback
                      style={{ background: getAvatarGradient(user.full_name) }}
                    >
                      {user.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium hover:underline">
                        {user.full_name}
                        <ArrowUpRight className="inline h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </DropdownMenuItem>
              </Link>
            ) : (
              <DropdownMenuItem key={user.id} className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar_url}
                    style={!user.avatar_url ? { background: getAvatarGradient(user.full_name) } : undefined}
                  />
                  <AvatarFallback
                    style={{ background: getAvatarGradient(user.full_name) }}
                  >
                    {user.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{user.full_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </DropdownMenuItem>
            )
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 