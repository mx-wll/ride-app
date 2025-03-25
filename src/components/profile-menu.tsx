'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage, getAvatarGradient } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useUser } from '@/contexts/UserContext'
import { toast } from 'sonner'

interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  social_url?: string
}

interface RiderStats {
  totalRides: number
  totalDistance: number
  averagePace: string
}

interface ProfileMenuProps {
  user: User
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter()
  const { user: contextUser } = useUser()
  const [stats, setStats] = useState<RiderStats>({
    totalRides: 0,
    totalDistance: 0,
    averagePace: "Race",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setError('Unable to connect to the database')
      setIsLoading(false)
      return
    }

    const fetchStats = async () => {
      if (!supabase) return;
      
      try {
        const { data: participatedRides, error: participationError } = await supabase
          .from("ride_participants")
          .select("ride_id")
          .eq("user_id", user.id)

        if (participationError) throw participationError

        if (participatedRides && participatedRides.length > 0) {
          const rideIds = participatedRides.map((p) => p.ride_id)
          const { data: rides, error: ridesError } = await supabase
            .from("rides")
            .select("distance, pace")
            .in("id", rideIds)

          if (ridesError) throw ridesError

          if (rides) {
            const totalDistance = rides.reduce((sum, ride) => sum + parseInt(ride.distance), 0)

            setStats({
              totalRides: participatedRides.length,
              totalDistance,
              averagePace: "Race",
            })
          }
        }
      } catch (error) {
        console.error("Error fetching rider stats:", error)
      }
    }

    fetchStats()
  }, [supabase, user])

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage
              src={user.avatar_url}
              alt={user.full_name}
              style={!user.avatar_url ? { background: getAvatarGradient(user.full_name) } : undefined}
              onError={(e) => {
                console.error("Error loading avatar image:", e);
                e.currentTarget.style.display = 'none';
              }}
            />
            <AvatarFallback
              style={{ background: getAvatarGradient(user.full_name) }}
            >
              {user.full_name[0]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user.avatar_url}
                alt={user.full_name}
                style={!user.avatar_url ? { background: getAvatarGradient(user.full_name) } : undefined}
                onError={(e) => {
                  console.error("Error loading avatar image:", e);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback
                style={{ background: getAvatarGradient(user.full_name) }}
              >
                {user.full_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.full_name}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
          </div>
          <div className="rounded-md bg-gray-50 p-4 mb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-500">Rider Overview</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-medium">{stats.totalRides}</div>
                <div className="text-sm text-gray-500">Rides</div>
              </div>
              <div>
                <div className="text-lg font-medium">{stats.totalDistance}km</div>
                <div className="text-sm text-gray-500">Distance</div>
              </div>
              <div>
                <div className="text-lg font-medium">{stats.averagePace}</div>
                <div className="text-sm text-gray-500">Avg Pace</div>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 