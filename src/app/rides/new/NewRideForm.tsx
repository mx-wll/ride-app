'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { addHours, format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Group = Database['public']['Tables']['groups']['Row']

export default function NewRideForm({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) {
      setError('Unable to connect to the database')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to create a ride')
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
      router.push('/rides')
      router.refresh()
    } catch (err) {
      console.error('Error creating ride:', err)
      setError('Failed to create ride')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Set default date to tomorrow at 9am
  const defaultDate = addHours(new Date(), 24)
  defaultDate.setHours(9, 0, 0, 0)
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="start_location" className="block text-sm font-medium text-gray-700">
          Start Location
        </label>
        <input
          type="text"
          name="start_location"
          id="start_location"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            name="date"
            id="date"
            required
            defaultValue={format(defaultDate, 'yyyy-MM-dd')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            type="time"
            name="time"
            id="time"
            required
            defaultValue="09:00"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
            Distance (km)
          </label>
          <input
            type="number"
            name="distance"
            id="distance"
            required
            min="0"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="bike_type" className="block text-sm font-medium text-gray-700">
            Bike Type
          </label>
          <select
            name="bike_type"
            id="bike_type"
            required
            defaultValue="road"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="road">Road</option>
            <option value="mountain">Mountain</option>
            <option value="gravel">Gravel</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="pace" className="block text-sm font-medium text-gray-700">
            Pace
          </label>
          <select
            name="pace"
            id="pace"
            required
            defaultValue="casual"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="casual">Casual</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
            <option value="race">Race</option>
          </select>
        </div>

        <div>
          <label htmlFor="group_id" className="block text-sm font-medium text-gray-700">
            Group
          </label>
          <select
            name="group_id"
            id="group_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Ride'}
        </Button>
      </div>
    </form>
  )
} 