'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { GroupSelector } from '@/components/group-selector'
import { NotificationSettings } from '@/components/notification-settings'

type SupabaseClientType = SupabaseClient<Database>

// Strava brand colors
const StravaIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
)

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    social_url: '',
    strava_url: '',
  })
  const [notificationSettings, setNotificationSettings] = useState({
    notifications_enabled: true,
    notification_radius_km: 25,
    notification_bike_types: ['Road', 'MTB'] as string[],
  })
  const [userGroups, setUserGroups] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClientType | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      setDbStatus({
        success: false,
        message: `Client initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          router.replace("/login")
          return
        }

        setUserId(user.id)

        // Check database connection
        const { error: connError } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        if (connError) {
          setDbStatus({ success: false, message: `Database error: ${connError.message}` })
        } else {
          setDbStatus({ success: true, message: 'Connected to remote database' })
        }

        // Get user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, avatar_url, email, social_url, strava_url, notifications_enabled, notification_radius_km, notification_bike_types")
          .eq("id", user.id)
          .single()

        if (userError) throw userError

        if (!userData) {
          toast.error("User profile not found")
          return
        }

        setFormData({
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || '',
          social_url: userData.social_url || '',
          strava_url: userData.strava_url || '',
        })

        setNotificationSettings({
          notifications_enabled: userData.notifications_enabled ?? true,
          notification_radius_km: userData.notification_radius_km ?? 25,
          notification_bike_types: userData.notification_bike_types ?? ['Road', 'MTB'],
        })

        setPreviewUrl(userData.avatar_url || null)

        // Fetch user groups
        const { data: groupData } = await supabase
          .from('user_group')
          .select('group_id')
          .eq('user_id', user.id)

        if (groupData) {
          setUserGroups(groupData.map(g => g.group_id))
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user data")
      }
    }

    getUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase || !userId) {
      toast.error("No database connection available")
      return
    }

    setIsLoading(true)

    try {
      // Get old name for updating rides
      const { data: oldUserData, error: oldUserError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (oldUserError) throw oldUserError

      // Update ride titles if name changed
      if (oldUserData.full_name !== formData.full_name) {
        const { data: userRides, error: ridesError } = await supabase
          .from('rides')
          .select('id, title')
          .eq('created_by', userId)

        if (ridesError) throw ridesError

        if (userRides && userRides.length > 0) {
          const { error: updateRidesError } = await supabase
            .from('rides')
            .update({ title: `${formData.full_name} wants to ride` })
            .eq('created_by', userId)

          if (updateRidesError) throw updateRidesError
        }
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          social_url: formData.social_url,
          strava_url: formData.strava_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      localStorage.setItem('userName', formData.full_name)
      toast.success('Profile updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!supabase || !userId) {
      toast.error("No database connection available")
      return
    }

    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const maxSize = 5 * 1024 * 1024

      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB")
      }

      if (!["jpg", "jpeg", "png", "gif"].includes(fileExt?.toLowerCase() || "")) {
        throw new Error("File type not supported")
      }

      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      toast.info("Uploading image...", { duration: 3000 })

      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setPreviewUrl(publicUrl)

      // Update avatar in database
      try {
        const { error: updateError } = await supabase.rpc('update_user_avatar', {
          user_id: userId,
          avatar_url_param: publicUrl
        })
        if (updateError) throw updateError
      } catch {
        // Fallback to regular update
        const { error: fallbackError } = await supabase
          .from("users")
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', userId)
        if (fallbackError) throw fallbackError
      }

      localStorage.setItem('userAvatarUrl', publicUrl)
      toast.success("Avatar updated successfully!")
    } catch (error) {
      console.error("File upload error:", error)
      toast.error(error instanceof Error ? error.message : "Error uploading avatar")
      setPreviewUrl(formData.avatar_url || null)
    } finally {
      setUploading(false)
    }
  }

  const formatStravaUrl = (input: string): string => {
    if (!input) return ''
    // If it's just a username, prepend the Strava URL
    if (!input.includes('strava.com') && !input.includes('http')) {
      return `https://www.strava.com/athletes/${input}`
    }
    // If it doesn't have https, add it
    if (!input.startsWith('http')) {
      return `https://${input}`
    }
    return input
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div className="mb-6">
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

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your profile information and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {!supabase && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <h3 className="font-medium">Database Connection Error</h3>
              </div>
              <p className="mt-1">Cannot connect to the database. Some features may not work.</p>
              <Button className="mt-2" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl || formData.avatar_url} />
                  <AvatarFallback>
                    {formData.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading || !supabase}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                disabled={!supabase}
                placeholder="Enter your full name"
              />
              <p className="text-sm text-muted-foreground">
                This name will be displayed on ride cards and in participant lists
              </p>
            </div>

            <Separator />

            {/* Strava Integration */}
            <div className="space-y-2">
              <Label htmlFor="strava_url" className="flex items-center gap-2">
                <span className="text-[#FC4C02]"><StravaIcon /></span>
                Strava Profile
              </Label>
              <div className="flex gap-2">
                <Input
                  id="strava_url"
                  type="text"
                  value={formData.strava_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, strava_url: e.target.value }))}
                  disabled={!supabase}
                  placeholder="Your Strava username or profile URL"
                  className="flex-1"
                />
                {formData.strava_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a
                      href={formatStravaUrl(formData.strava_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Link your Strava profile so others can follow your rides
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_url">Other Social Profile</Label>
              <Input
                id="social_url"
                type="url"
                value={formData.social_url}
                onChange={(e) => setFormData(prev => ({ ...prev, social_url: e.target.value }))}
                disabled={!supabase}
                placeholder="https://twitter.com/yourusername"
              />
              <p className="text-sm text-muted-foreground">
                Add a link to your social media profile (optional)
              </p>
            </div>

            <Button type="submit" disabled={isLoading || uploading || !supabase}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Profile'}
            </Button>
          </form>

          {dbStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${dbStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${dbStatus.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Database status:</span> {dbStatus.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Card */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
            <CardDescription>Join riding groups to connect with other cyclists</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupSelector
              userId={userId}
              userGroups={userGroups}
              onGroupsChange={setUserGroups}
            />
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {userId && (
        <NotificationSettings
          userId={userId}
          initialSettings={notificationSettings}
        />
      )}
    </div>
  )
}
