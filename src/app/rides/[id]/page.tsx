'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Users, Bike, Quote } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RideMap } from '@/components/ride-map';

type Ride = Database['public']['Tables']['rides']['Row'] & {
  groups?: { name: string } | null
  ride_participants: Array<{
    status: string
    user_id: string
    users: {
      name: string
      full_name?: string
      avatar_url?: string
      strava_url?: string
    }
  }>
  creator: {
    id: string
    name: string
    full_name?: string
    avatar_url?: string
    strava_url?: string
  }
};

// Strava icon
const StravaIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
)

export default function RideDetailPage() {
  const params = useParams();
  const { currentUser, isLoading: userLoading } = useUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRide = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError('Failed to connect to database');
      setIsLoading(false);
      return;
    }

    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select(`
          *,
          groups (name),
          creator:users!rides_created_by_fkey (
            id,
            name,
            full_name,
            avatar_url,
            strava_url
          ),
          ride_participants (
            status,
            user_id,
            users (name, full_name, avatar_url, strava_url)
          )
        `)
        .eq('id', params.id)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);
    } catch (err) {
      console.error('Error fetching ride:', err);
      setError('Failed to fetch ride');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  const handleJoinRide = async () => {
    if (!currentUser || !ride || isUpdating) return;

    const supabase = createClient();
    if (!supabase) return;

    setIsUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('ride_participants')
        .insert([
          {
            ride_id: ride.id,
            user_id: currentUser.id,
            status: 'pending',
          },
        ]);

      if (error) throw error;
      await fetchRide();
    } catch (err) {
      console.error('Error joining ride:', err);
      setError('Failed to join ride');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveRide = async () => {
    if (!currentUser || !ride || isUpdating) return;

    const supabase = createClient();
    if (!supabase) return;

    setIsUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('ride_participants')
        .delete()
        .eq('ride_id', ride.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      await fetchRide();
    } catch (err) {
      console.error('Error leaving ride:', err);
      setError('Failed to leave ride');
    } finally {
      setIsUpdating(false);
    }
  };

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading user...</div>;
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">No user found</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading ride...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!ride) {
    return <div className="flex items-center justify-center min-h-screen">Ride not found</div>;
  }

  const isParticipant = ride.ride_participants.some(
    (p) => p.user_id === currentUser.id
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const creatorName = ride.creator?.full_name || ride.creator?.name || 'Unknown';
  const rideTitle = ride.groups?.name ? `${ride.groups.name} Ride` : ride.title;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          asChild
          className="gap-2 pl-0 text-muted-foreground hover:text-foreground"
        >
          <Link href="/rides">
            <ArrowLeft className="h-4 w-4" />
            Back to Rides
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ride Details Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">{rideTitle}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ride.creator?.avatar_url || undefined} />
                      <AvatarFallback>
                        {creatorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{creatorName}</span>
                        {ride.creator?.strava_url && (
                          <a
                            href={ride.creator.strava_url.includes('strava.com')
                              ? ride.creator.strava_url
                              : `https://www.strava.com/athletes/${ride.creator.strava_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FC4C02] hover:opacity-80"
                            title="View on Strava"
                          >
                            <StravaIcon />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  {isParticipant ? (
                    <Button
                      variant="destructive"
                      onClick={handleLeaveRide}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Leave Ride'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinRide}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Join Ride'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(ride.ride_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{ride.start_location || 'Location TBD'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bike className="h-4 w-4 text-muted-foreground" />
                  <span>{ride.distance} km • {ride.pace} pace • {ride.bike_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{ride.ride_participants.length} participant{ride.ride_participants.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Description/Quote */}
              {ride.description && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex gap-2">
                    <Quote className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                    <p className="text-sm text-slate-600 italic">{ride.description}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Card */}
          {(ride.latitude && ride.longitude) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ride Location</CardTitle>
                <CardDescription>
                  {ride.radius_km ? `${ride.radius_km} km ride radius` : 'Starting point'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RideMap
                  latitude={ride.latitude}
                  longitude={ride.longitude}
                  radiusKm={ride.radius_km || 10}
                  startLocation={ride.start_location || undefined}
                  className="h-[250px]"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participants Card */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              {ride.ride_participants.length} rider{ride.ride_participants.length !== 1 ? 's' : ''} joining this ride
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ride.ride_participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No participants yet. Be the first to join!
                    </TableCell>
                  </TableRow>
                ) : (
                  ride.ride_participants.map((participant) => {
                    const participantName = participant.users.full_name || participant.users.name;
                    return (
                      <TableRow key={participant.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.users.avatar_url || undefined} />
                              <AvatarFallback>
                                {participantName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{participantName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(participant.status || 'pending')}>
                            {participant.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {participant.users.strava_url && (
                            <a
                              href={participant.users.strava_url.includes('strava.com')
                                ? participant.users.strava_url
                                : `https://www.strava.com/athletes/${participant.users.strava_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FC4C02] hover:opacity-80"
                              title="View on Strava"
                            >
                              <StravaIcon />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
