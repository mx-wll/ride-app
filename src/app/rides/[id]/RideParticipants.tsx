'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Ride = Database['public']['Tables']['rides']['Row'] & {
  groups: { name: string }
  users: { name: string }
  ride_participants: Array<{
    status: string
    users: { name: string }
  }>
}

export default function RideParticipants({ ride }: { ride: Ride }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function updateStatus(status: 'accepted' | 'declined') {
    setIsUpdating(true)
    setError(null)
    
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to update your status')
      setIsUpdating(false)
      return
    }
    
    const { error } = await supabase
      .from('ride_participants')
      .upsert({
        ride_id: ride.id,
        user_id: user.id,
        status,
      })
      
    if (error) {
      setError(error.message)
      setIsUpdating(false)
      return
    }
    
    router.refresh()
    setIsUpdating(false)
  }
  
  const acceptedParticipants = ride.ride_participants.filter(p => p.status === 'accepted')
  const pendingParticipants = ride.ride_participants.filter(p => p.status === 'pending')
  const declinedParticipants = ride.ride_participants.filter(p => p.status === 'declined')
  
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
              <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {acceptedParticipants.map((participant) => (
                  <li key={participant.users.name} className="col-span-1 flex rounded-md shadow-sm">
                    <div className="flex flex-1 items-center justify-between truncate rounded-md border border-gray-200 bg-white">
                      <div className="flex-1 truncate px-4 py-2 text-sm">
                        <p className="font-medium text-gray-900 hover:text-gray-600">
                          {participant.users.name}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {pendingParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Pending ({pendingParticipants.length})</h4>
              <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {pendingParticipants.map((participant) => (
                  <li key={participant.users.name} className="col-span-1 flex rounded-md shadow-sm">
                    <div className="flex flex-1 items-center justify-between truncate rounded-md border border-gray-200 bg-white">
                      <div className="flex-1 truncate px-4 py-2 text-sm">
                        <p className="font-medium text-gray-900 hover:text-gray-600">
                          {participant.users.name}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {declinedParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Not Going ({declinedParticipants.length})</h4>
              <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {declinedParticipants.map((participant) => (
                  <li key={participant.users.name} className="col-span-1 flex rounded-md shadow-sm">
                    <div className="flex flex-1 items-center justify-between truncate rounded-md border border-gray-200 bg-white">
                      <div className="flex-1 truncate px-4 py-2 text-sm">
                        <p className="font-medium text-gray-900 hover:text-gray-600">
                          {participant.users.name}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
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