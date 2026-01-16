'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRandomQuote, formatQuoteForRide } from '@/lib/cyclist-quotes';

type Group = Database['public']['Tables']['groups']['Row'];

const PACE_OPTIONS = ['chill', 'speed', 'race'];
const BIKE_TYPES = ['Road', 'MTB'];

export default function NewRidePage() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderQuote, setPlaceholderQuote] = useState({ quote: '', author: '' });

  const [formData, setFormData] = useState({
    group_id: '',
    ride_time: '',
    distance: '',
    pace: 'speed',
    bike_type: 'Road',
    start_location: '',
    description: '',
  });

  useEffect(() => {
    setPlaceholderQuote(getRandomQuote());
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('name');

        if (error) throw error;
        setGroups(data || []);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to fetch groups');
      }
    };

    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError('Failed to connect to database');
      setIsLoading(false);
      return;
    }

    try {
      if (!currentUser) throw new Error('No user found');

      // Get user's name for the title
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentUser.id)
        .single();

      if (userError) throw userError;

      // Use cyclist quote if description is empty
      const finalDescription = formData.description.trim() || formatQuoteForRide(placeholderQuote);

      const { data, error } = await supabase
        .from('rides')
        .insert([
          {
            title: `${userData.full_name} wants to ride`,
            group_id: formData.group_id || null,
            ride_time: formData.ride_time,
            distance: parseFloat(formData.distance),
            pace: formData.pace,
            bike_type: formData.bike_type,
            start_location: formData.start_location,
            description: finalDescription,
            created_by: currentUser.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await supabase
        .from('ride_participants')
        .insert({
          ride_id: data.id,
          user_id: currentUser.id,
          status: 'accepted',
        });

      router.push(`/rides/${data.id}`);
    } catch (err) {
      console.error('Error creating ride:', err);
      setError('Failed to create ride');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading user...</div>;
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">No user found</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Ride</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="group_id">Group (optional)</Label>
                <Select
                  value={formData.group_id}
                  onValueChange={(value: string) => handleChange('group_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ride_time">Ride Date & Time</Label>
              <Input
                type="datetime-local"
                id="ride_time"
                value={formData.ride_time}
                onChange={(e) => handleChange('ride_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                type="text"
                id="start_location"
                placeholder="Where does the ride start?"
                value={formData.start_location}
                onChange={(e) => handleChange('start_location', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  type="number"
                  id="distance"
                  min="1"
                  step="1"
                  placeholder="50"
                  value={formData.distance}
                  onChange={(e) => handleChange('distance', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pace">Pace</Label>
                <Select
                  value={formData.pace}
                  onValueChange={(value: string) => handleChange('pace', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACE_OPTIONS.map((pace) => (
                      <SelectItem key={pace} value={pace}>
                        {pace.charAt(0).toUpperCase() + pace.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bike_type">Bike Type</Label>
              <Select
                value={formData.bike_type}
                onValueChange={(value: string) => handleChange('bike_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BIKE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Message</Label>
              <Textarea
                id="description"
                placeholder={`${placeholderQuote.quote} — ${placeholderQuote.author}`}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for an inspirational cycling quote
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Ride'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
