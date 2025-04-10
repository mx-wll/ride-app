"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getTimePeriod } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

interface Ride {
  id: string
  title: string
  start_location: string
  ride_time: string
  distance: string
  pace: string
  bike_type: string
  created_by: string
  created_at: string
  creator?: {
    full_name: string
  }
}

interface RideCardProps {
  ride: Ride
  currentUser: User
  isParticipant: boolean
  onJoin: (rideId: string) => void
  onLeave: (rideId: string) => void
  onDelete: (rideId: string) => void
}

export function RideCard({
  ride,
  currentUser,
  isParticipant,
  onJoin,
  onLeave,
  onDelete,
}: RideCardProps) {
  const isCreator = ride.created_by === currentUser.id
  const [participants, setParticipants] = useState<User[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string>(ride.creator?.full_name || "")
  const supabase = createClient()

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!supabase) {
        setError("Database connection not available")
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        const { data: participantsData, error } = await supabase
          .from('ride_participants')
          .select(`
            user_id,
            users!inner (
              full_name,
              avatar_url
            )
          `)
          .eq('ride_id', ride.id)

        if (error) {
          console.error("Error fetching participants:", error)
          setError("Failed to load participants")
          toast.error("Failed to load ride participants")
          return
        }

        if (participantsData) {
          const typedData = participantsData as unknown as Array<{
            user_id: string
            users: {
              full_name: string
              avatar_url?: string
            }
          }>

          const processedUsers = typedData.map(p => ({
            id: p.user_id,
            full_name: p.users.full_name,
            email: '',
            avatar_url: p.users.avatar_url
          }))
          
          setParticipants(processedUsers)
        }
      } catch (error) {
        console.error('Error in fetchParticipants:', error)
        setError("An unexpected error occurred")
        toast.error("Failed to load ride participants")
      } finally {
        setIsLoading(false)
      }
    }

    fetchParticipants()
  }, [ride.id, supabase, isJoining])

  // Fetch creator's name if not provided
  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!supabase || ride.creator?.full_name) return
      
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', ride.created_by)
          .single()

        if (error) {
          console.error('Error fetching creator name:', error)
          toast.error("Failed to load creator information")
          return
        }
        
        if (data) {
          setCreatorName(data.full_name)
        }
      } catch (error) {
        console.error('Error fetching creator name:', error)
        toast.error("Failed to load creator information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreatorName()
  }, [ride.created_by, ride.creator?.full_name, supabase])

  // Subscribe to creator name changes
  useEffect(() => {
    if (!supabase) return

    const subscription = supabase
      .channel('public:users')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${ride.created_by}`
        }, 
        (payload: { new: { full_name?: string } }) => {
          if (payload.new.full_name) {
            setCreatorName(payload.new.full_name)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [ride.created_by, supabase])

  const handleJoinLeave = async () => {
    if (isJoining) return
    setIsJoining(true)
    
    try {
      if (isParticipant) {
        await onLeave(ride.id)
        toast.success("Successfully left the ride")
      } else {
        await onJoin(ride.id)
        toast.success("Successfully joined the ride")
      }
    } catch (error) {
      console.error('Error in handleJoinLeave:', error)
      toast.error(isParticipant ? "Failed to leave ride" : "Failed to join ride")
    } finally {
      setIsJoining(false)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(ride.id)
      toast.success("Ride deleted successfully")
    } catch (error) {
      console.error('Error deleting ride:', error)
      toast.error("Failed to delete ride")
    }
  }

  const rideTitle = `${creatorName} wants to ride`

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {rideTitle}
          <Badge variant="secondary" className="text-xs">
            {getTimePeriod(ride.ride_time)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between">
        <div className="flex gap-3 text-s text-gray-500">
          <div className="flex">
            <span>{ride.start_location}</span>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex">
            <span>{ride.distance} km</span>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex">
            <span>{ride.pace}</span>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex">
            <span>{ride.bike_type}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex -space-x-2 flex-wrap gap-y-2">
          {participants.map((participant) => (
            <Avatar key={participant.id} className="h-8 w-8 ring-2 ring-white">
              <AvatarImage src={participant.avatar_url} />
              <AvatarFallback>
                {participant.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex gap-2">
          {!isCreator && (
            <Button
              variant={isParticipant ? "outline" : "default"}
              onClick={handleJoinLeave}
              disabled={isJoining}
            >
              {isJoining ? "Processing..." : isParticipant ? "Leave" : "Join"}
            </Button>
          )}
          {isCreator && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 