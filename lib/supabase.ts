import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

// Client-side Supabase client (singleton pattern)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: string
          branch_id: string | null
          phone: string | null
          status: string
          temp_password: string | null
          invitation_token: string | null
          invitation_expiry: string | null
          invitation_sent: boolean
          invitation_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: string
          branch_id?: string | null
          phone?: string | null
          status?: string
          temp_password?: string | null
          invitation_token?: string | null
          invitation_expiry?: string | null
          invitation_sent?: boolean
          invitation_status?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          role?: string
          branch_id?: string | null
          phone?: string | null
          status?: string
          temp_password?: string | null
          invitation_token?: string | null
          invitation_expiry?: string | null
          invitation_sent?: boolean
          invitation_status?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          postal_code: string
          phone: string
          email: string
          manager_name: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          address?: string
          city?: string
          state?: string
          postal_code?: string
          phone?: string
          email?: string
          manager_name?: string
          status?: string
        }
        Update: {
          name?: string
          address?: string
          city?: string
          state?: string
          postal_code?: string
          phone?: string
          email?: string
          manager_name?: string
          status?: string
          updated_at?: string
        }
      }
      user_management: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_user_id: string | null
          target_user_email: string | null
          details: any
          created_at: string
        }
        Insert: {
          admin_id: string
          action: string
          target_user_id?: string | null
          target_user_email?: string | null
          details?: any
        }
      }
    }
  }
}

// Types for our application
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Branch = Database["public"]["Tables"]["branches"]["Row"]
export type UserManagement = Database["public"]["Tables"]["user_management"]["Row"]

export type User = {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
  created_at: string
}

// Re-export createClient for other modules to use
export { createSupabaseClient as createClient }
