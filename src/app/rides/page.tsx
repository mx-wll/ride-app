"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { CreateRideForm } from "@/components/create-ride-form"
import { CommunityMenu } from "@/components/community-menu"
import { ProfileMenu } from "@/components/profile-menu"
import { RideCard } from "@/components/ride-card"
import { toast, Toaster } from "sonner"

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

interface RideParticipant {
  ride_id: string
  user_id: string
  created_at: string
}

export default function RidesPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [participants, setParticipants] = useState<RideParticipant[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Supabase client
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
    if (!supabase) {
      toast.error("Database connection not available")
      return
    }

    try {
      setIsLoading(true)
      const { data: ridesData, error: ridesError } = await supabase
        .from("rides")
        .select("*")
        .order("ride_time", { ascending: true })

      if (ridesError) throw ridesError

      if (ridesData) {
        setRides(ridesData)
      }

      const { data: participantsData, error: participantsError } = await supabase
        .from("ride_participants")
        .select("*")

      if (participantsError) throw participantsError

      if (participantsData) {
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error("Error fetching rides:", error)
      toast.error("Failed to load rides")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        if (!user) {
          router.replace("/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("id", user.id)
          .single()

        if (userError) throw userError

        if (userData) {
          setUser(userData)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user data")
        router.replace("/login")
      }
    }

    getUser()
  }, [router, supabase])

  useEffect(() => {
    if (!supabase) return
    fetchRides()

    const ridesChannel = supabase
      .channel("rides")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        () => {
          fetchRides()
        }
      )
      .subscribe()

    const participantsChannel = supabase
      .channel("ride_participants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_participants",
        },
        () => {
          fetchRides()
        }
      )
      .subscribe()

    return () => {
      ridesChannel.unsubscribe()
      participantsChannel.unsubscribe()
    }
  }, [supabase, fetchRides])

  const handleJoinRide = async (rideId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from("ride_participants")
        .insert({ 
          ride_id: rideId, 
          user_id: user.id
        })

      if (error) throw error
      toast.success("Successfully joined the ride!")
      await fetchRides()
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
      await fetchRides()
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
      await fetchRides()
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

  if (!user || isLoading) return null;

  const userProfile = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <CommunityMenu />
        </div>
        <div className="flex items-center gap-4">
          <ProfileMenu user={userProfile} />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className="fixed bottom-10 left-5 right-5 z-50">Create Ride</Button>
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
                  setSheetOpen(false);
                  fetchRides();
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <div className="grid gap-4">
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