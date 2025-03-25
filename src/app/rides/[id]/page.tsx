'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage, getAvatarGradient } from '@/components/ui/avatar';

type Ride = Database['public']['Tables']['rides']['Row'] & {
  groups: { name: string }
  users: { name: string }
  ride_participants: Array<{
    status: string
    users: { 
      name: string
      avatar_url?: string
    }
  }>
  creator: {
    id: string
    name: string
    avatar_url?: string
  }
};

export default function RideDetailPage() {
  const params = useParams();
  const { currentUser, isLoading: userLoading } = useUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRide = useCallback(async () => {
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select(`
          *,
          creator:users!rides_created_by_fkey (
            id,
            name,
            avatar_url
          ),
          ride_participants (
            status,
            users (name, avatar_url)
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

      // Update the ride data immediately
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

    setIsUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('ride_participants')
        .delete()
        .eq('ride_id', ride.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update the ride data immediately
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
    (p) => p.users.name === currentUser.name
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{ride.groups.name} Ride</CardTitle>
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={ride.creator.avatar_url}
                      style={!ride.creator.avatar_url ? { background: getAvatarGradient(ride.creator.name) } : undefined}
                    />
                    <AvatarFallback
                      style={{ background: getAvatarGradient(ride.creator.name) }}
                    >
                      {ride.creator.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm text-muted-foreground">Created by</span>
                    <h3 className="font-medium">{ride.creator.name}</h3>
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
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(ride.ride_time), 'PPp')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{ride.distance} km at {ride.avg_speed} km/h</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{ride.ride_participants.length} participants</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ride.ride_participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No participants yet
                    </TableCell>
                  </TableRow>
                ) : (
                  ride.ride_participants.map((participant, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={participant.users.avatar_url} 
                              style={!participant.users.avatar_url ? { background: getAvatarGradient(participant.users.name) } : undefined}
                            />
                            <AvatarFallback
                              style={{ background: getAvatarGradient(participant.users.name) }}
                            >
                              {participant.users.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{participant.users.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(participant.status)}>
                          {participant.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 