'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: string
  name?: string
  avatar_url?: string
  status: 'accepted' | 'pending' | 'declined'
}

interface RideParticipant {
  user_id: string
  status: 'accepted' | 'pending' | 'declined'
  users: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface RideParticipantsProps {
  rideId: string
}

export default function RideParticipants({ rideId }: RideParticipantsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('ride_participants')
          .select(`
            user_id,
            status,
            users (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('ride_id', rideId)

        if (error) throw error

        if (data) {
          const formattedParticipants = data.map(participant => ({
            id: (participant as unknown as RideParticipant).users.id,
            name: (participant as unknown as RideParticipant).users.full_name,
            avatar_url: (participant as unknown as RideParticipant).users.avatar_url || undefined,
            status: (participant as unknown as RideParticipant).status
          }))
          setParticipants(formattedParticipants)
        }
      } catch (error) {
        console.error('Error fetching participants:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchParticipants()
  }, [rideId, supabase])

  async function updateStatus(status: 'accepted' | 'declined') {
    if (!supabase) return
    setIsUpdating(true)
    setError(null)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to update your status')
      setIsUpdating(false)
      return
    }
    
    const { error: updateError } = await supabase
      .from('ride_participants')
      .upsert({
        ride_id: rideId,
        user_id: user.id,
        status,
      })
      
    if (updateError) {
      setError(updateError.message)
      setIsUpdating(false)
      return
    }
    
    // Refresh participants list
    const { data: updatedData, error: fetchError } = await supabase
      .from('ride_participants')
      .select(`
        user_id,
        status,
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('ride_id', rideId)

    if (fetchError) throw fetchError

    if (updatedData) {
      const formattedParticipants = updatedData.map(participant => ({
        id: (participant as unknown as RideParticipant).users.id,
        name: (participant as unknown as RideParticipant).users.full_name,
        avatar_url: (participant as unknown as RideParticipant).users.avatar_url || undefined,
        status: (participant as unknown as RideParticipant).status
      }))
      setParticipants(formattedParticipants)
    }
    
    router.refresh()
    setIsUpdating(false)
  }
  
  const acceptedParticipants = participants.filter(p => p.status === 'accepted')
  const pendingParticipants = participants.filter(p => p.status === 'pending')
  const declinedParticipants = participants.filter(p => p.status === 'declined')
  
  if (isLoading) {
    return <div>Loading participants...</div>
  }

  return (
    <div>
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Participants</h3>
      </div>
      
      <div className="mt-4">
        <div className="flex flex-col gap-y-8">
          {acceptedParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Going ({acceptedParticipants.length})</h4>
              <div className="flex flex-wrap gap-2">
                {acceptedParticipants.map((participant) => (
                  <Avatar key={participant.id} className="h-8 w-8">
                    <AvatarImage src={participant.avatar_url || ''} alt={participant.name || 'User'} />
                    <AvatarFallback>{participant.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}
          
          {pendingParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Pending ({pendingParticipants.length})</h4>
              <div className="flex flex-wrap gap-2">
                {pendingParticipants.map((participant) => (
                  <Avatar key={participant.id} className="h-8 w-8">
                    <AvatarImage src={participant.avatar_url || ''} alt={participant.name || 'User'} />
                    <AvatarFallback>{participant.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}
          
          {declinedParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Not Going ({declinedParticipants.length})</h4>
              <div className="flex flex-wrap gap-2">
                {declinedParticipants.map((participant) => (
                  <Avatar key={participant.id} className="h-8 w-8">
                    <AvatarImage src={participant.avatar_url || ''} alt={participant.name || 'User'} />
                    <AvatarFallback>{participant.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mt-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex gap-x-3">
        <button
          type="button"
          onClick={() => updateStatus('accepted')}
          disabled={isUpdating}
          className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Going'}
        </button>
        <button
          type="button"
          onClick={() => updateStatus('declined')}
          disabled={isUpdating}
          className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Not Going'}
        </button>
      </div>
    </div>
  )
} 