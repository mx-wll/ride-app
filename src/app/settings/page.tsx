'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage, getAvatarGradient } from '@/components/ui/avatar'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

// Use proper typing for Supabase client
type SupabaseClientType = SupabaseClient<Database>

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    social_url: '',
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClientType | null>(null)

  // Initialize supabase client safely
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
        console.log("Fetching user data...")
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error("Auth error:", authError)
          throw authError
        }
        if (!user) {
          console.log("No user found, redirecting to login")
          router.replace("/login")
          return
        }

        setUserId(user.id)
        console.log("User ID:", user.id)

        // Check database connection with a simple query
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1)
          
          if (error) {
            setDbStatus({ 
              success: false, 
              message: `Database error: ${error.message}` 
            })
            console.error('Database connection failed:', error)
          } else {
            setDbStatus({ 
              success: true, 
              message: 'Connected to remote database' 
            })
            console.log('Database connection successful:', data)
          }
        } catch (dbError) {
          console.error('Database connection exception:', dbError)
          setDbStatus({ 
            success: false, 
            message: `Connection error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` 
          })
        }

        // Get user data with explicit column selection
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, avatar_url, email, social_url")
          .eq("id", user.id)
          .single()

        if (userError) {
          console.error("User data fetch error:", userError)
          throw userError
        }

        console.log("User data loaded:", userData)
        
        if (!userData) {
          console.error("No user data found for ID:", user.id)
          toast.error("User profile not found")
          return
        }
        
        // Set the form data with values from the database
        setFormData({
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || '',
          social_url: userData.social_url || '',
        })
        
        // Set the initial preview URL to be the same as avatar_url
        setPreviewUrl(userData.avatar_url || null)
        
        console.log("Form data initialized:", {
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || '',
          social_url: userData.social_url || '',
        })
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user data")
      }
    }

    getUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) {
      toast.error("No database connection available")
      return
    }
    
    setIsLoading(true)

    try {
      if (!userId) {
        throw new Error('No user ID found')
      }

      console.log("Starting profile update...");
      console.log("Current user ID:", userId);
      console.log("Update data:", {
        full_name: formData.full_name,
        social_url: formData.social_url
      });

      // Start a transaction by getting the old name first
      const { data: oldUserData, error: oldUserError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (oldUserError) {
        throw oldUserError;
      }

      // Only proceed with ride updates if name has changed
      if (oldUserData.full_name !== formData.full_name) {
        console.log("Name changed, updating ride titles...");
        
        // Get all rides created by this user
        const { data: userRides, error: ridesError } = await supabase
          .from('rides')
          .select('id, title')
          .eq('created_by', userId);

        if (ridesError) {
          throw ridesError;
        }

        if (userRides && userRides.length > 0) {
          console.log("Updating titles for rides:", userRides);
          
          // Update all ride titles
          const { error: updateRidesError } = await supabase
            .from('rides')
            .update({
              title: `${formData.full_name} wants to ride`
            })
            .eq('created_by', userId);

          if (updateRidesError) {
            throw updateRidesError;
          }
          
          console.log(`Updated titles for ${userRides.length} rides`);
        }
      }

      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          social_url: formData.social_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error("Update failed:", error);
        throw error;
      }

      console.log("Update response:", data);

      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('full_name, social_url, avatar_url')
        .eq('id', userId)
        .single();

      if (verifyError) {
        console.error("Verification failed:", verifyError);
        throw verifyError;
      }

      console.log("Verified data:", verifyData);

      if (verifyData.full_name !== formData.full_name) {
        throw new Error('Update verification failed: name mismatch');
      }

      // Update local storage and UI
      localStorage.setItem('userName', formData.full_name);
      toast.success('Profile and associated rides updated successfully');
      
      // Force refresh to update UI everywhere
      router.refresh();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!supabase) {
      toast.error("No database connection available")
      return
    }
    
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      if (!userId) {
        throw new Error('No user ID found')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB")
      }

      if (!["jpg", "jpeg", "png", "gif"].includes(fileExt?.toLowerCase() || "")) {
        throw new Error("File type not supported")
      }
      
      // Create a temporary local preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      
      toast.info("Uploading image...", { duration: 3000 })

      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      
      console.log("Uploading file to:", filePath)
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)
      
      const publicUrl = data.publicUrl

      console.log("Public URL generated:", publicUrl)

      // Update form data with the permanent URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setPreviewUrl(publicUrl)

      // CRITICAL CHANGE: Make a direct update to ensure data is saved remotely
      console.log("Updating user profile in database with avatar_url:", publicUrl)
      
      // First attempt - direct SQL update
      try {
        // Execute a direct SQL update
        const { data: updateData, error: updateError } = await supabase.rpc(
          'update_user_avatar',
          { 
            user_id: userId,
            avatar_url_param: publicUrl 
          }
        )
        
        if (updateError) {
          console.error("RPC update error:", updateError)
          throw updateError
        }
        
        console.log("Avatar updated successfully:", updateData)
        localStorage.setItem('userAvatarUrl', publicUrl)
        toast.success("Avatar updated successfully!")
      } catch (directError) {
        console.error("Direct update error:", directError)
        
        // Fallback to regular update
        try {
          const { error: fallbackError } = await supabase
            .from("users")
            .update({ 
              avatar_url: publicUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (fallbackError) {
            console.error("Fallback update error:", fallbackError)
            throw fallbackError
          }
          
          console.log("Avatar updated through fallback method")
          localStorage.setItem('userAvatarUrl', publicUrl)
          toast.success("Avatar updated successfully!")
        } catch (fallbackError) {
          console.error("All update methods failed:", fallbackError)
          throw new Error("Failed to save avatar to database")
        }
      }
    } catch (error) {
      console.error("File upload error:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Error uploading avatar")
      }
      
      // Revert preview on error
      setPreviewUrl(formData.avatar_url || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {!supabase && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <h3 className="font-medium">Database Connection Error</h3>
              </div>
              <p className="mt-1">Cannot connect to the database. Some features may not work.</p>
              <Button 
                className="mt-2" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={previewUrl || formData.avatar_url}
                    style={!(previewUrl || formData.avatar_url) ? { background: getAvatarGradient(formData.full_name) } : undefined}
                  />
                  <AvatarFallback
                    style={{ background: getAvatarGradient(formData.full_name) }}
                  >
                    {formData.full_name?.[0]}
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
                <div className="pt-2">
                  <Label htmlFor="avatar_url">Or use an Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, avatar_url: e.target.value }))
                      setPreviewUrl(e.target.value || null)
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={!supabase}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData(prev => ({ ...prev, full_name: newName }));
                  // Update avatar fallback immediately
                  if (!formData.avatar_url) {
                    setPreviewUrl(null);
                  }
                }}
                required
                disabled={!supabase}
                placeholder="Enter your full name"
                className="transition-all duration-200"
              />
              <p className="text-sm text-gray-500">
                This name will be displayed on ride cards and in participant lists
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_url">Social Profile URL</Label>
              <Input
                id="social_url"
                type="url"
                value={formData.social_url}
                onChange={(e) => setFormData(prev => ({ ...prev, social_url: e.target.value }))}
                disabled={!supabase}
                placeholder="https://twitter.com/yourusername"
                className="transition-all duration-200"
              />
              <p className="text-sm text-gray-500">
                Add a link to your social media profile (optional)
              </p>
            </div>

            <Button type="submit" disabled={isLoading || uploading || !supabase}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
            <h3 className="font-medium mb-2">How to upload your avatar:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click &quot;Choose File&quot; to select an image (JPG, PNG, or GIF) from your device</li>
              <li>Your image will upload automatically and appear in the avatar preview</li>
              <li>Alternatively, paste an image URL in the &quot;Avatar URL&quot; field</li>
              <li>Click &quot;Save Changes&quot; to permanently save your profile settings</li>
            </ol>
            <p className="mt-3 text-gray-500">Your avatar will appear throughout the app, including on ride cards and participant lists.</p>
          </div>
          {dbStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${dbStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${dbStatus.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Database status:</span> {dbStatus.message}
              </div>
              {!dbStatus.success && (
                <p className="mt-2">
                  Try refreshing the page or check your Supabase configuration.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 