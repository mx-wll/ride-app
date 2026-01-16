"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { CreateRideForm } from "@/components/create-ride-form"
import { CommunityMenu } from "@/components/community-menu"
import { ProfileMenu } from "@/components/profile-menu"
import { RideCard } from "@/components/ride-card"
import { toast, Toaster } from "sonner"
import { cn } from "@/lib/utils"
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
  latitude?: number | null
  longitude?: number | null
  radius_km?: number | null
}

type RideParticipant = Database['public']['Tables']['ride_participants']['Row']

export default function RidesPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const { currentUser: user, isLoading: isUserLoading } = useUser()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [rides, setRides] = useState<Ride[]>([])
  const [participants, setParticipants] = useState<RideParticipant[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newlyCreatedRideId, setNewlyCreatedRideId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
            created_at,
            latitude,
            longitude,
            radius_km
          `)
          .order("ride_time", { ascending: true }),
        supabase
          .from("ride_participants")
          .select("*"),
      ])

      const { data: ridesData, error: ridesError } = ridesResult
      const { data: participantsData, error: participantsError } = participantsResult

      if (ridesError) throw ridesError
      if (participantsError) throw participantsError

      const transformedRides = (ridesData || []).map(ride => ({
        ...ride,
        distance: ride.distance.toString(),
        latitude: ride.latitude,
        longitude: ride.longitude,
        radius_km: ride.radius_km,
      }))

      setRides(transformedRides)
      setParticipants(participantsData || [])
    } catch (error) {
      console.error("Error fetching rides:", error)
      toast.error("Failed to load rides")
    } finally {
      setIsDataLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return
    fetchRides()

    const ridesChannel = supabase
      .channel("rides_realtime")
      .on<Ride>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          // Set the newly created ride ID for animation
          if (payload.new && payload.new.id) {
            setNewlyCreatedRideId(payload.new.id)
            // Clear the animation flag after 2 seconds
            setTimeout(() => setNewlyCreatedRideId(null), 2000)
          }
          fetchRides()
        }
      )
      .on<Ride>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides" },
        () => fetchRides()
      )
      .on<Ride>(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rides" },
        () => fetchRides()
      )
      .subscribe()

    const participantsChannel = supabase
      .channel("participants_realtime")
      .on<RideParticipant>(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_participants" },
        () => fetchRides()
      )
      .subscribe()

    return () => {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div>Please log in to view rides.</div>
  }

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
                onSuccess={(createdRide) => {
                  setSheetOpen(false)

                  // Optimistically add the new ride to the UI immediately
                  if (createdRide) {
                    const newRide: Ride = {
                      ...createdRide,
                      distance: createdRide.distance.toString(),
                    }

                    // Add the new ride and sort by ride_time
                    setRides(prev => {
                      const updated = [newRide, ...prev.filter(r => r.id !== newRide.id)]
                      return updated.sort((a, b) =>
                        new Date(a.ride_time).getTime() - new Date(b.ride_time).getTime()
                      )
                    })

                    // Also add current user as participant
                    if (user) {
                      setParticipants(prev => [
                        ...prev,
                        { ride_id: createdRide.id, user_id: user.id, status: 'pending', created_at: new Date().toISOString() }
                      ])
                    }

                    // Trigger animation
                    setNewlyCreatedRideId(createdRide.id)
                    setTimeout(() => setNewlyCreatedRideId(null), 2000)
                  }

                  // Scroll to top to see the new ride with animation
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }, 100)
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 pb-40">
        <div ref={listRef} className="grid gap-4">
          {rides.length === 0 && (
            <p className="text-center text-gray-500">No rides scheduled yet. Create one!</p>
          )}
          {rides.map((ride) => (
            <div
              key={ride.id}
              className={cn(
                "transition-all duration-500",
                newlyCreatedRideId === ride.id && "animate-ride-appear"
              )}
            >
              <RideCard
                ride={ride}
                currentUser={user}
                isParticipant={isParticipant(ride.id)}
                onJoin={handleJoinRide}
                onLeave={handleLeaveRide}
                onDelete={handleDeleteRide}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 