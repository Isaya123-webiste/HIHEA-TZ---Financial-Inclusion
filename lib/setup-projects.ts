"use server"

import { createClient } from "@supabase/supabase-js"

export async function setupProjectsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log("[v0] Setting up projects table...")

    // Insert the 7 NGO projects directly
    const projects = [
      { name: "Empower Young Generations", description: "Youth empowerment and development program", status: "active" },
      { name: "Bridging the Gender Gap", description: "Gender equality and women empowerment initiative", status: "active" },
      { name: "Chemchem", description: "Community development and sustainability project", status: "active" },
      { name: "Enterprise Scaling Up", description: "Business growth and entrepreneurship support", status: "active" },
      { name: "INUA", description: "Community support and welfare program", status: "active" },
      { name: "Working Together for Change", description: "Collaborative community transformation initiative", status: "active" },
      { name: "TAD", description: "Technology and development program", status: "active" },
    ]

    const results = []
    for (const project of projects) {
      const { data, error } = await supabase.from("projects").upsert(project, { onConflict: "name" }).select()

      if (error) {
        results.push({ name: project.name, success: false, error: error.message })
      } else {
        results.push({ name: project.name, success: true })
      }
    }

    // Verify
    const { data: allProjects, error: fetchError } = await supabase.from("projects").select("*").order("name")

    if (fetchError) {
      return {
        success: false,
        message: `Table created but verification failed: ${fetchError.message}`,
        details: results,
      }
    }

    return {
      success: true,
      message: `Successfully set up projects table with ${allProjects?.length || 0} projects`,
      projects: allProjects,
      details: results,
    }
  } catch (error: any) {
    console.error("[v0] Setup error:", error)
    return {
      success: false,
      message: `Setup failed: ${error.message}`,
      error: error.message,
    }
  }
}
