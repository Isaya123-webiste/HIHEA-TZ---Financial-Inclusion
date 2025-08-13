"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  branch_id: string
  branch_name?: string
  created_at: string
  updated_at: string
}

export interface ActionResult {
  success: boolean
  profile?: UserProfile
  data?: any
  error?: string
  code?: string
  isAdmin?: boolean
  branches?: any[]
  users?: any[]
}

// Enhanced error handling with retry logic
function handleError(error: any, operation: string): ActionResult {
  console.error(`${operation} error:`, error)

  // Handle rate limiting
  if (error?.message?.includes("Too Many Requests") || error?.message?.includes("rate limit")) {
    return {
      success: false,
      error: "Service is temporarily busy. Please try again in a moment.",
      code: "RATE_LIMIT",
    }
  }

  // Handle network errors
  if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
    return {
      success: false,
      error: "Network connection error. Please check your internet connection.",
      code: "NETWORK_ERROR",
    }
  }

  // Handle JSON parsing errors
  if (error?.message?.includes("Unexpected token") || error?.message?.includes("not valid JSON")) {
    return {
      success: false,
      error: "Server response error. Please try again.",
      code: "PARSE_ERROR",
    }
  }

  // Handle Supabase specific errors
  if (error?.code === "PGRST116") {
    return {
      success: false,
      error: "No data found.",
      code: "NOT_FOUND",
    }
  }

  if (error?.code === "23505") {
    return {
      success: false,
      error: "A record with this data already exists.",
      code: "DUPLICATE",
    }
  }

  if (error?.code === "23503") {
    return {
      success: false,
      error: "Invalid reference. Please check the data.",
      code: "FOREIGN_KEY",
    }
  }

  if (error?.message?.includes("permission denied") || error?.message?.includes("insufficient_privilege")) {
    return {
      success: false,
      error: "You don't have permission to perform this action.",
      code: "PERMISSION_DENIED",
    }
  }

  return {
    success: false,
    error: error?.message || `Failed to ${operation.toLowerCase()}`,
    code: "UNKNOWN",
  }
}

// Retry function with exponential backoff
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on certain errors
      if (error?.code === "PGRST116" || error?.message?.includes("permission denied")) {
        throw error
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export async function getUserProfile(userId: string): Promise<ActionResult> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
        code: "INVALID_INPUT",
      }
    }

    const result = await retryOperation(async () => {
      // First try to get profile with branch info
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          branch_id,
          created_at,
          updated_at,
          branches (
            id,
            name
          )
        `)
        .eq("id", userId)
        .single()

      if (error) {
        throw error
      }

      return profile
    })

    if (!result) {
      return {
        success: false,
        error: "User profile not found",
        code: "NOT_FOUND",
      }
    }

    // Format the response
    const formattedProfile: UserProfile = {
      id: result.id,
      full_name: result.full_name || "",
      email: result.email || "",
      role: result.role || "",
      status: result.status || "inactive",
      branch_id: result.branch_id || "",
      branch_name: result.branches?.name || null,
      created_at: result.created_at || "",
      updated_at: result.updated_at || "",
    }

    return {
      success: true,
      profile: formattedProfile,
    }
  } catch (error) {
    return handleError(error, "Get user profile")
  }
}

export async function getUserProfileSimple(userId: string): Promise<ActionResult> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
        code: "INVALID_INPUT",
      }
    }

    const result = await retryOperation(async () => {
      // Simplified query without joins
      const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        throw error
      }

      return profile
    })

    if (!result) {
      return {
        success: false,
        error: "User profile not found",
        code: "NOT_FOUND",
      }
    }

    // Get branch name separately if needed
    let branchName = null
    if (result.branch_id) {
      try {
        const { data: branch } = await supabaseAdmin.from("branches").select("name").eq("id", result.branch_id).single()

        branchName = branch?.name || null
      } catch (error) {
        console.warn("Could not fetch branch name:", error)
      }
    }

    const formattedProfile: UserProfile = {
      id: result.id,
      full_name: result.full_name || "",
      email: result.email || "",
      role: result.role || "",
      status: result.status || "inactive",
      branch_id: result.branch_id || "",
      branch_name: branchName,
      created_at: result.created_at || "",
      updated_at: result.updated_at || "",
    }

    return {
      success: true,
      profile: formattedProfile,
    }
  } catch (error) {
    return handleError(error, "Get user profile (simple)")
  }
}

export async function checkAdminRole(userId: string): Promise<ActionResult> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
        code: "INVALID_INPUT",
        isAdmin: false,
      }
    }

    const result = await retryOperation(async () => {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("role, email, status")
        .eq("id", userId)
        .single()

      if (error) {
        throw error
      }

      return profile
    })

    // Special handling for isayaamos123@gmail.com - always grant admin access
    const isSpecialAdmin = result?.email === "isayaamos123@gmail.com"
    const isAdmin = result?.role === "admin" || isSpecialAdmin

    return {
      success: true,
      isAdmin,
      data: {
        isAdmin,
        role: result?.role,
        email: result?.email,
        status: result?.status,
        isSpecialAdmin,
      },
    }
  } catch (error) {
    // If there's an error but the user ID corresponds to isayaamos123@gmail.com, still grant access
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authUser?.user?.email === "isayaamos123@gmail.com") {
        return {
          success: true,
          isAdmin: true,
          data: {
            isAdmin: true,
            isSpecialAdmin: true,
            email: "isayaamos123@gmail.com",
          },
        }
      }
    } catch (authError) {
      console.error("Auth check error:", authError)
    }

    return {
      success: false,
      isAdmin: false,
      error: "Failed to check admin role",
      code: "CHECK_FAILED",
    }
  }
}

export async function getAllUsers(): Promise<ActionResult> {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(`
          *,
          branches (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return data
    })

    // Format the data to include branch names
    const formattedUsers =
      result?.map((user) => ({
        ...user,
        branch_name: user.branches?.name || null,
      })) || []

    return {
      success: true,
      users: formattedUsers,
    }
  } catch (error) {
    return handleError(error, "Get all users")
  }
}

export async function getAllBranches(): Promise<ActionResult> {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await supabaseAdmin.from("branches").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return data
    })

    return {
      success: true,
      branches: result || [],
    }
  } catch (error) {
    return handleError(error, "Get all branches")
  }
}

export async function createUser(userData: {
  email: string
  password: string
  full_name: string
  role: string
  branch_id?: string
}): Promise<ActionResult> {
  try {
    if (!userData.email || !userData.password || !userData.full_name || !userData.role) {
      return {
        success: false,
        error: "All required fields must be provided",
        code: "INVALID_INPUT",
      }
    }

    const result = await retryOperation(async () => {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      })

      if (authError) {
        throw authError
      }

      // Create profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          branch_id: userData.branch_id || null,
          status: "active",
        })
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      return profile
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return handleError(error, "Create user")
  }
}

export async function updateUser(
  userId: string,
  updates: {
    full_name?: string
    role?: string
    branch_id?: string
  },
): Promise<ActionResult> {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return handleError(error, "Update user")
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    await retryOperation(async () => {
      // Delete user profile first
      const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

      if (profileError) {
        throw profileError
      }

      // Delete user from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        throw authError
      }
    })

    revalidatePath("/admin/users")
    return {
      success: true,
    }
  } catch (error) {
    return handleError(error, "Delete user")
  }
}
