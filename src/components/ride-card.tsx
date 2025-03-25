"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback, getAvatarGradient } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MapPin, Calendar, Bike, Gauge } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { PostgrestError } from '@supabase/supabase-js'

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
}

interface RideParticipantResponse {
  ride_id: string;
  user_id: string;
  users: {
    full_name: string;
    avatar_url?: string;
  };
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
  const supabase = createClient()
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!supabase) return;
      
      try {
        const { data: participantsData, error } = await supabase
          .from('ride_participants')
          .select(`
            ride_id,
            user_id,
            users!inner (
              full_name,
              avatar_url
            )
          `)
          .eq('ride_id', ride.id);

        if (error) {
          console.error("Error fetching participants:", error);
          return;
        }

        if (participantsData) {
          const processedUsers: User[] = participantsData.map(p => ({
            id: p.user_id,
            full_name: p.users.full_name,
            email: '', // Email is not needed for avatar display
            avatar_url: p.users.avatar_url
          }));
          
          setParticipants(processedUsers);
        }
      } catch (error) {
        console.error('Error in fetchParticipants:', error);
      }
    };

    fetchParticipants();
  }, [ride.id, supabase, isJoining]);

  const handleJoinLeave = async () => {
    if (isJoining) return; // Prevent multiple clicks
    setIsJoining(true);
    
    try {
      if (isParticipant) {
        await onLeave(ride.id);
      } else {
        await onJoin(ride.id);
      }
    } catch (error) {
      console.error('Error in handleJoinLeave:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{ride.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{ride.start_location}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(ride.ride_time)}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{ride.distance}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            <span>{ride.pace}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4" />
            <span>{ride.bike_type}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex -space-x-2 flex-wrap gap-y-2">
          {participants.map((participant) => (
            <Avatar key={participant.id} className="ring-2 ring-white">
              {participant.avatar_url ? (
                <AvatarImage
                  src={participant.avatar_url}
                  alt={participant.full_name}
                />
              ) : (
                <AvatarFallback
                  style={{ background: getAvatarGradient(participant.full_name) }}
                >
                  {participant.full_name[0]}
                </AvatarFallback>
              )}
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
            <Button variant="destructive" onClick={() => onDelete(ride.id)}>
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 