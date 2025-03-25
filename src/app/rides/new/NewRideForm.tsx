'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { addHours } from 'date-fns'

interface NewRideFormProps {
  onSuccess?: () => void
}

export default function NewRideForm({ onSuccess }: NewRideFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) {
      toast.error('Unable to connect to the database')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to create a ride')
        return
      }

      const formData = new FormData(e.currentTarget)
      const rideTime = new Date(formData.get('date') as string)
      rideTime.setHours(parseInt(formData.get('time') as string))
      
      const { error: insertError } = await supabase
        .from('rides')
        .insert({
          title: formData.get('title') as string,
          description: formData.get('description') as string || null,
          start_location: formData.get('start_location') as string,
          distance: parseFloat(formData.get('distance') as string),
          bike_type: formData.get('bike_type') as string || 'road',
          pace: formData.get('pace') as string || 'casual',
          ride_time: rideTime.toISOString(),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
      
      if (insertError) throw insertError

      toast.success('Ride created successfully!')
      onSuccess?.()
      router.push('/rides')
      router.refresh()
    } catch (err) {
      console.error('Error creating ride:', err)
      toast.error('Failed to create ride')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Set default date to tomorrow at 9am
  const defaultDate = addHours(new Date(), 24)
  defaultDate.setHours(9, 0, 0, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Morning Ride"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Easy morning ride around the lake"
        />
      </div>

      <div>
        <Label htmlFor="start_location">Start Location</Label>
        <Input
          id="start_location"
          name="start_location"
          required
          placeholder="Central Park"
        />
      </div>

      <div>
        <Label htmlFor="distance">Distance (km)</Label>
        <Input
          id="distance"
          name="distance"
          type="number"
          required
          min="1"
          placeholder="40"
        />
      </div>

      <div>
        <Label htmlFor="bike_type">Bike Type</Label>
        <select
          id="bike_type"
          name="bike_type"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="road">Road</option>
          <option value="gravel">Gravel</option>
          <option value="mountain">Mountain</option>
        </select>
      </div>

      <div>
        <Label htmlFor="pace">Pace</Label>
        <select
          id="pace"
          name="pace"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="casual">Casual</option>
          <option value="moderate">Moderate</option>
          <option value="fast">Fast</option>
          <option value="race">Race</option>
        </select>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaultDate.toISOString().split('T')[0]}
        />
      </div>

      <div>
        <Label htmlFor="time">Time</Label>
        <select
          id="time"
          name="time"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          required
          defaultValue="9"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Ride'}
      </Button>
    </form>
  )
} 