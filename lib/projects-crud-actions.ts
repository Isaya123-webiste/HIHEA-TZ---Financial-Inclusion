"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Project {
  id: string
  name: string
  status: "active" | "inactive" | "completed"
  branch_id: string | null
  created_at: string
  updated_at: string
}

export async function getAllProjects() {
  try {
    const { data, error } = await supabaseAdmin.from("projects").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching projects:", error.message)
      return { success: false, error: `Failed to load projects: ${error.message}`, data: [] }
    }

    // Map the response to ensure branch_id is included
    const projects = (data || []).map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      branch_id: project.branch_id || null,
      created_at: project.created_at,
      updated_at: project.updated_at,
    }))

    return { success: true, data: projects }
  } catch (error: any) {
    console.error("[v0] Exception fetching projects:", error.message)
    return { success: false, error: `Failed to load projects: ${error.message}`, data: [] }
  }
}

export async function createProject(projectName: string, branchId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        name: projectName,
        status: "active",
        branch_id: branchId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating project:", error.message)
      return { success: false, error: `Failed to create project: ${error.message}` }
    }

    revalidatePath("/admin/projects")
    return { success: true, project: data }
  } catch (error: any) {
    console.error("[v0] Exception creating project:", error.message)
    return { success: false, error: `Failed to create project: ${error.message}` }
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  try {
    const { data, error } = await supabaseAdmin.from("projects").update(updates).eq("id", projectId).select().single()

    if (error) {
      console.error("[v0] Error updating project:", error.message)
      return { success: false, error: `Failed to update project: ${error.message}` }
    }

    revalidatePath("/admin/projects")
    return { success: true, project: data }
  } catch (error: any) {
    console.error("[v0] Exception updating project:", error.message)
    return { success: false, error: `Failed to update project: ${error.message}` }
  }
}

export async function checkProjectUsageInBranchReports(projectId: string) {
  try {
    const response = await supabaseAdmin
      .from("branch_reports")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)

    const { error, count } = response

    if (error) {
      console.error("[v0] Error checking project usage:", error.message)
      return { success: false, error: error.message, isUsed: false }
    }

    const isUsed = (count ?? 0) > 0
    console.log("[v0] Project usage check - projectId:", projectId, "count:", count, "isUsed:", isUsed)
    return { success: true, isUsed }
  } catch (error: any) {
    console.error("[v0] Exception checking project usage:", error.message)
    return { success: false, error: error.message, isUsed: false }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", projectId)

    if (error) {
      console.error("[v0] Error deleting project:", error.message)
      return { success: false, error: `Failed to delete project: ${error.message}` }
    }

    revalidatePath("/admin/projects")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Exception deleting project:", error.message)
    return { success: false, error: `Failed to delete project: ${error.message}` }
  }
}

export async function getAllBranches() {
  try {
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select("id, name, status")
      .eq("status", "active")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching branches:", error.message)
      return { success: false, error: error.message, data: [] }
    }

    console.log("[v0] Branches loaded successfully:", data?.length || 0)
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception fetching branches:", error.message)
    return { success: false, error: error.message, data: [] }
  }
}
