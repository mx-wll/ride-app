'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Group = Database['public']['Tables']['groups']['Row'];

export default function NewRidePage() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    group_id: '',
    ride_time: '',
    distance: '',
    avg_speed: '',
  });

  useEffect(() => {
    const fetchGroups = async () => {
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

    try {
      if (!currentUser) throw new Error('No user found');

      const { data, error } = await supabase
        .from('rides')
        .insert([
          {
            ...formData,
            created_by: currentUser.id,
            distance: parseFloat(formData.distance),
            avg_speed: parseFloat(formData.avg_speed),
          },
        ])
        .select()
        .single();

      if (error) throw error;

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
            <div className="space-y-2">
              <Label htmlFor="group_id">Group</Label>
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

            <div className="space-y-2">
              <Label htmlFor="ride_time">Ride Time</Label>
              <Input
                type="datetime-local"
                id="ride_time"
                value={formData.ride_time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ride_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                type="number"
                id="distance"
                min="0"
                step="0.1"
                value={formData.distance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('distance', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg_speed">Average Speed (km/h)</Label>
              <Input
                type="number"
                id="avg_speed"
                min="0"
                step="0.1"
                value={formData.avg_speed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('avg_speed', e.target.value)}
                required
              />
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