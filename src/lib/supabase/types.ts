export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      ride_participants: {
        Row: {
          ride_id: string
          user_id: string
          status: 'pending' | 'accepted' | 'declined'
        }
        Insert: {
          ride_id: string
          user_id: string
          status?: 'pending' | 'accepted' | 'declined'
        }
        Update: {
          ride_id?: string
          user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
        }
      }
      rides: {
        Row: {
          id: string
          ride_time: string
          distance: number
          avg_speed: number
          created_by: string
          group_id: string
          created_at: string
        }
        Insert: {
          id?: string
          ride_time: string
          distance: number
          avg_speed: number
          created_by: string
          group_id: string
          created_at?: string
        }
        Update: {
          id?: string
          ride_time?: string
          distance?: number
          avg_speed?: number
          created_by?: string
          group_id?: string
          created_at?: string
        }
      }
      user_group: {
        Row: {
          user_id: string
          group_id: string
        }
        Insert: {
          user_id: string
          group_id: string
        }
        Update: {
          user_id?: string
          group_id?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          is_admin: boolean
          created_at: string
          avatar_url?: string
          full_name?: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          is_admin?: boolean
          created_at?: string
          avatar_url?: string
          full_name?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_admin?: boolean
          created_at?: string
          avatar_url?: string
          full_name?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 