"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { CreateRideForm } from "@/components/create-ride-form"
import { CommunityMenu } from "@/components/community-menu"
import { ProfileMenu } from "@/components/profile-menu"
import { RideCard } from "@/components/ride-card"
import { toast, Toaster } from "sonner"
import type { Database } from "@/lib/supabase/types"
import type { SupabaseClient } from "@supabase/supabase-js"

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

type RideParticipant = Database['public']['Tables']['ride_participants']['Row']

export default function RidesPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const { currentUser: user, isLoading: isUserLoading } = useUser()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [rides, setRides] = useState<Ride[]>([])
  const [participants, setParticipants] = useState<RideParticipant[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  console.log('RidesPage Render Start - isUserLoading:', isUserLoading, 'isDataLoading:', isDataLoading)
  console.log('RidesPage Render Start - User:', user)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      toast.error("Failed to connect to database")
    }
  }, [])

  const fetchRides = useCallback(async () => {
    if (!supabase) return

    console.log('fetchRides - Starting...')
    setIsDataLoading(true)
    try {
      const [ridesResult, participantsResult] = await Promise.all([
        supabase
          .from("rides")
          .select(`
            id,
            title,
            start_location,
            ride_time,
            distance,
            pace,
            bike_type,
            created_by,
            created_at
          `)
          .order("ride_time", { ascending: true }),
        supabase
          .from("ride_participants")
          .select("*"),
      ])

      const { data: ridesData, error: ridesError } = ridesResult
      const { data: participantsData, error: participantsError } = participantsResult

      console.log('fetchRides - ridesData:', ridesData)
      console.log('fetchRides - participantsData:', participantsData)

      if (ridesError) throw ridesError
      if (participantsError) throw participantsError

      // Transform the data to match our component types
      const transformedRides = (ridesData || []).map(ride => ({
        ...ride,
        distance: ride.distance.toString(),
      }))

      setRides(transformedRides)
      setParticipants(participantsData || [])
    } catch (error) {
      console.error("Error fetching rides:", error)
      toast.error("Failed to load rides")
    } finally {
      setIsDataLoading(false)
      console.log('fetchRides - Finished, isDataLoading set to false')
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return
    console.log('RidesPage: Supabase client ready, fetching initial rides.')
    fetchRides()

    const ridesChannel = supabase
      .channel("rides_realtime")
      .on<Ride>(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        (payload) => {
          console.log('Ride change received!', payload)
          fetchRides()
        }
      )
      .subscribe((status) => {
        console.log('Rides realtime status:', status)
      })

    const participantsChannel = supabase
      .channel("participants_realtime")
      .on<RideParticipant>(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_participants" },
        (payload) => {
          console.log('Participant change received!', payload)
          fetchRides()
        }
      )
      .subscribe((status) => {
        console.log('Participants realtime status:', status)
      })

    return () => {
      console.log('RidesPage: Cleaning up realtime subscriptions.')
      supabase.removeChannel(ridesChannel)
      supabase.removeChannel(participantsChannel)
    }
  }, [supabase, fetchRides])

  const handleJoinRide = async (rideId: string) => {
    if (!user || !supabase) return
    try {
      const { error } = await supabase
        .from("ride_participants")
        .insert({ ride_id: rideId, user_id: user.id, status: 'pending' })
      if (error) throw error
      toast.success("Successfully joined the ride!")
    } catch (error) {
      console.error("Error joining ride:", error)
      toast.error("Failed to join ride")
    }
  }

  const handleLeaveRide = async (rideId: string) => {
    if (!user || !supabase) return
    try {
      const { error } = await supabase
        .from("ride_participants")
        .delete()
        .eq("ride_id", rideId)
        .eq("user_id", user.id)
      if (error) throw error
      toast.success("Successfully left the ride!")
    } catch (error) {
      console.error("Error leaving ride:", error)
      toast.error("Failed to leave ride")
    }
  }

  const handleDeleteRide = async (rideId: string) => {
    if (!user || !supabase) return
    try {
      const { error } = await supabase
        .from("rides")
        .delete()
        .eq("id", rideId)
      if (error) throw error
      toast.success("Successfully deleted the ride!")
    } catch (error) {
      console.error("Error deleting ride:", error)
      toast.error("Failed to delete ride")
    }
  }

  const isParticipant = (rideId: string) => {
    return participants.some(
      (p) => p.ride_id === rideId && p.user_id === user?.id
    )
  }

  if (isUserLoading || isDataLoading) {
    console.log('RidesPage: Render - Showing loading spinner (UserLoading:', isUserLoading, ', DataLoading:', isDataLoading, ')')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log("RidesPage: Render - User not logged in after loading.")
    return <div>Please log in to view rides.</div>
  }

  console.log('RidesPage: Render - Rendering main content with user:', user)
  console.log('RidesPage: Render - Rendering with rides:', rides)

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <CommunityMenu />
        </div>
        <div className="flex items-center gap-4">
          <ProfileMenu user={user} />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent p-4 pt-10 pb-10 z-50 backdrop-blur-sm">
                <Button className="w-full">Create Ride</Button>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-fit">
              <SheetHeader>
                <SheetTitle>Create New Ride</SheetTitle>
                <SheetDescription>
                  Fill in the details below to schedule a new group ride.
                </SheetDescription>
              </SheetHeader>
              <CreateRideForm
                onSuccess={() => {
                  setSheetOpen(false)
                  toast.info("Ride created! List will update shortly.")
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 pb-40">
        <div className="grid gap-4">
          {rides.length === 0 && (
            <p className="text-center text-gray-500">No rides scheduled yet. Create one!</p>
          )}
          {rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              currentUser={user}
              isParticipant={isParticipant(ride.id)}
              onJoin={handleJoinRide}
              onLeave={handleLeaveRide}
              onDelete={handleDeleteRide}
            />
          ))}
        </div>
      </main>
    </div>
  )
} 