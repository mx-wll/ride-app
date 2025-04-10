'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CreateRideFormProps {
  onSuccess: () => void
}

type TimeOfDay = 'Now' | 'Morning' | 'Afternoon' | 'Evening'
type Distance = '50km' | '80km' | '100km'
type Pace = 'Chill' | 'Speed' | 'Race'
type BikeType = 'Road' | 'MTB'

export function CreateRideForm({ onSuccess }: CreateRideFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning')
  const [distance, setDistance] = useState<Distance>('80km')
  const [pace, setPace] = useState<Pace>('Speed')
  const [bikeType, setBikeType] = useState<BikeType>('Road')
  const [startLocation, setStartLocation] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    if (!supabase) {
      toast.error('Failed to initialize database client')
      setIsSubmitting(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to create a ride')
        return
      }

      // Get user's name from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Calculate ride time based on time of day
      const rideTime = new Date()
      switch (timeOfDay) {
        case 'Now':
          break
        case 'Morning':
          rideTime.setHours(9, 0, 0, 0)
          if (rideTime < new Date()) {
            rideTime.setDate(rideTime.getDate() + 1)
          }
          break
        case 'Afternoon':
          rideTime.setHours(14, 0, 0, 0)
          if (rideTime < new Date()) {
            rideTime.setDate(rideTime.getDate() + 1)
          }
          break
        case 'Evening':
          rideTime.setHours(18, 0, 0, 0)
          if (rideTime < new Date()) {
            rideTime.setDate(rideTime.getDate() + 1)
          }
          break
      }

      // Insert the ride
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .insert({
          title: `${userData.full_name} wants to ride`,
          start_location: startLocation,
          distance: parseInt(distance),
          bike_type: bikeType,
          pace: pace.toLowerCase(),
          ride_time: rideTime.toISOString(),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (rideError) throw rideError

      // Automatically add the creator as a participant
      const { error: participantError } = await supabase
        .from('ride_participants')
        .insert({
          ride_id: rideData.id,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (participantError) throw participantError

      toast.success('Ride created successfully!')
      onSuccess()
      router.refresh()
    } catch (error) {
      console.error('Error creating ride:', error)
      toast.error('Failed to create ride')
    } finally {
      setIsSubmitting(false)
    }
  }

  const SelectionButton = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean
    onClick: () => void
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors',
        selected
          ? 'bg-slate-100'
          : 'border border-slate-100 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-2">
          {(['Now', 'Morning', 'Afternoon', 'Evening'] as TimeOfDay[]).map((time) => (
            <SelectionButton
              key={time}
              selected={timeOfDay === time}
              onClick={() => setTimeOfDay(time)}
            >
              {time}
            </SelectionButton>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {(['50km', '80km', '100km'] as Distance[]).map((dist) => (
            <SelectionButton
              key={dist}
              selected={distance === dist}
              onClick={() => setDistance(dist)}
            >
              {dist}
            </SelectionButton>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {(['Chill', 'Speed', 'Race'] as Pace[]).map((p) => (
            <SelectionButton
              key={p}
              selected={pace === p}
              onClick={() => setPace(p)}
            >
              {p}
            </SelectionButton>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {(['Road', 'MTB'] as BikeType[]).map((type) => (
            <SelectionButton
              key={type}
              selected={bikeType === type}
              onClick={() => setBikeType(type)}
            >
              {type}
            </SelectionButton>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Start"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Lets Ride'}
      </Button>
    </form>
  )
} 