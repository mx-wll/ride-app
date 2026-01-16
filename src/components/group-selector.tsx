'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Users, Bike, Mountain, Zap, Trophy, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  created_at: string | null
}

interface GroupSelectorProps {
  userId: string
  userGroups: string[]
  onGroupsChange?: (groupIds: string[]) => void
}

const GROUP_ICONS: Record<string, React.ElementType> = {
  'road': Bike,
  'mountain': Mountain,
  'speed': Zap,
  'race': Trophy,
  'casual': Heart,
  'default': Users,
}

const GROUP_COLORS: Record<string, string> = {
  'road': 'from-blue-500 to-blue-600',
  'mountain': 'from-green-500 to-green-600',
  'speed': 'from-orange-500 to-orange-600',
  'race': 'from-purple-500 to-purple-600',
  'casual': 'from-pink-500 to-pink-600',
  'default': 'from-slate-500 to-slate-600',
}

function getGroupIcon(name: string): React.ElementType {
  const lowerName = name.toLowerCase()
  for (const key of Object.keys(GROUP_ICONS)) {
    if (lowerName.includes(key)) return GROUP_ICONS[key]
  }
  return GROUP_ICONS.default
}

function getGroupColor(name: string): string {
  const lowerName = name.toLowerCase()
  for (const key of Object.keys(GROUP_COLORS)) {
    if (lowerName.includes(key)) return GROUP_COLORS[key]
  }
  return GROUP_COLORS.default
}

export function GroupSelector({ userId, userGroups: initialGroups, onGroupsChange }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(initialGroups))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    setSelectedGroups(new Set(initialGroups))
  }, [initialGroups])

  const fetchGroups = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const saveGroups = async () => {
    const supabase = createClient()
    if (!supabase) return

    setIsSaving(true)
    try {
      // First, remove all existing memberships
      const { error: deleteError } = await supabase
        .from('user_group')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Then add new memberships
      if (selectedGroups.size > 0) {
        const memberships = Array.from(selectedGroups).map(groupId => ({
          user_id: userId,
          group_id: groupId,
        }))

        const { error: insertError } = await supabase
          .from('user_group')
          .insert(memberships)

        if (insertError) throw insertError
      }

      toast.success('Teams updated!')
      onGroupsChange?.(Array.from(selectedGroups))
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving groups:', error)
      toast.error('Failed to update teams')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = selectedGroups.size

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          My Teams
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Choose Your Teams
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 py-4">
              {groups.map((group) => {
                const Icon = getGroupIcon(group.name)
                const colorClass = getGroupColor(group.name)
                const isSelected = selectedGroups.has(group.id)

                return (
                  <Card
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:scale-105',
                      'border-2 relative overflow-hidden',
                      isSelected
                        ? 'border-primary shadow-lg'
                        : 'border-transparent hover:border-muted-foreground/20'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 opacity-10 bg-gradient-to-br',
                        colorClass
                      )}
                    />
                    <CardContent className="p-4 relative">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full bg-gradient-to-br text-white',
                            colorClass
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                        </div>
                        {isSelected && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No teams available yet
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedCount} team{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <Button onClick={saveGroups} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Teams'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
