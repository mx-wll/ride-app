'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, MapPin, Bike, Mountain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationSettingsProps {
  userId: string
  initialSettings?: {
    notifications_enabled: boolean | null
    notification_radius_km: number | null
    notification_bike_types: string[] | null
  }
}

const BIKE_TYPES = [
  { id: 'Road', label: 'Road', icon: Bike },
  { id: 'MTB', label: 'MTB', icon: Mountain },
]

export function NotificationSettings({ userId, initialSettings }: NotificationSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialSettings?.notifications_enabled ?? true
  )
  const [radiusKm, setRadiusKm] = useState(
    initialSettings?.notification_radius_km ?? 25
  )
  const [bikeTypes, setBikeTypes] = useState<Set<string>>(
    new Set(initialSettings?.notification_bike_types ?? ['Road', 'MTB'])
  )
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true)
      setPushPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!pushSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission === 'granted') {
        toast.success('Notifications enabled!')
        // Register service worker and get push subscription
        await registerPushSubscription()
      } else if (permission === 'denied') {
        toast.error('Notification permission denied')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Failed to enable notifications')
    }
  }

  const registerPushSubscription = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Save subscription to database
      const supabase = createClient()
      if (supabase) {
        await supabase
          .from('users')
          .update({ push_subscription: subscription.toJSON() })
          .eq('id', userId)
      }
    } catch (error) {
      console.error('Error registering push subscription:', error)
    }
  }

  const toggleBikeType = (bikeType: string) => {
    setBikeTypes(prev => {
      const next = new Set(prev)
      if (next.has(bikeType)) {
        if (next.size > 1) { // Keep at least one selected
          next.delete(bikeType)
        }
      } else {
        next.add(bikeType)
      }
      return next
    })
  }

  const saveSettings = async () => {
    setIsSaving(true)
    const supabase = createClient()
    if (!supabase) {
      toast.error('Failed to connect to database')
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          notifications_enabled: notificationsEnabled,
          notification_radius_km: radiusKm,
          notification_bike_types: Array.from(bikeTypes),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Notification preferences saved!')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Ride Notifications
        </CardTitle>
        <CardDescription>
          Get notified when new rides are posted in your area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Enable notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive alerts for new rides matching your preferences
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        {notificationsEnabled && (
          <>
            {/* Browser notification permission */}
            {pushSupported && pushPermission !== 'granted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Enable browser notifications
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Allow notifications to receive real-time alerts even when the app is in the background.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={requestNotificationPermission}
                    >
                      Enable Browser Notifications
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {pushPermission === 'granted' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                Browser notifications enabled
              </div>
            )}

            {/* Radius slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Notification radius
                </Label>
                <Badge variant="secondary">{radiusKm} km</Badge>
              </div>
              <Slider
                value={[radiusKm]}
                onValueChange={(value) => setRadiusKm(value[0])}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll be notified about rides within {radiusKm} km of your location
              </p>
            </div>

            {/* Bike type selection */}
            <div className="space-y-3">
              <Label>Bike types</Label>
              <div className="flex gap-2">
                {BIKE_TYPES.map(({ id, label, icon: Icon }) => {
                  const isSelected = bikeTypes.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleBikeType(id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-slate-400')} />
                      <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-slate-600')}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Only get notified for rides matching these bike types
              </p>
            </div>
          </>
        )}

        <Button onClick={saveSettings} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Notification Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
