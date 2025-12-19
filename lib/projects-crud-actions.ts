"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Project {
  id: string
  name: string
  status: "active" | "inactive" | "completed"
  created_at: string
  updated_at: string
}

export async function getAllProjects() {
  try {
    console.log("[v0] Fetching all projects...")

    const { data, error } = await supabase.from("projects").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching projects:", error)
      return { success: false, error: error.message, data: [] }
    }

    console.log("[v0] Projects fetched successfully:", data?.length)
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception fetching projects:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function createProject(projectName: string) {
  try {
    console.log("[v0] Creating project:", projectName)

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating project:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Project created successfully:", data)
    revalidatePath("/admin/projects")
    revalidatePath("/branch-report-officer/forms")

    return { success: true, project: data }
  } catch (error: any) {
    console.error("[v0] Exception creating project:", error)
    return { success: false, error: error.message }
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  try {
    console.log("[v0] Updating project:", projectId, updates)

    const { data, error } = await supabase.from("projects").update(updates).eq("id", projectId).select().single()

    if (error) {
      console.error("[v0] Error updating project:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Project updated successfully:", data)
    revalidatePath("/admin/projects")
    revalidatePath("/branch-report-officer/forms")

    return { success: true, project: data }
  } catch (error: any) {
    console.error("[v0] Exception updating project:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteProject(projectId: string) {
  try {
    console.log("[v0] Deleting project:", projectId)

    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (error) {
      console.error("[v0] Error deleting project:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Project deleted successfully")
    revalidatePath("/admin/projects")
    revalidatePath("/branch-report-officer/forms")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Exception deleting project:", error)
    return { success: false, error: error.message }
  }
}
