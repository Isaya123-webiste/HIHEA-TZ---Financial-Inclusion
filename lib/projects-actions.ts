"use server"

import { supabaseAdmin } from "./supabase-admin"

export interface Project {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

// Get all active projects
export async function getProjects() {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching projects:", error)
      return { success: false, error: error.message, data: [] }
    }

    console.log("[v0] Projects fetched:", data?.length || 0)
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception fetching projects:", error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get project by ID
export async function getProjectById(projectId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error) {
      console.error("[v0] Error fetching project:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Exception fetching project:", error)
    return { success: false, error: error.message }
  }
}
