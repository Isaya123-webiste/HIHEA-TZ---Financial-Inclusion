"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function createAdminAccount() {
  try {
    // Create admin user with a temporary password
    const tempPassword = "AdminTemp123!" // Change this immediately after login

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@hihfinancial.com",
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "System Administrator",
        role: "admin",
      },
    })

    if (authError) {
      console.error("Auth user creation error:", authError)
      return { error: authError.message }
    }

    // Create admin profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authUser.user.id,
      full_name: "System Administrator",
      email: "admin@hihfinancial.com",
      role: "admin",
      status: "active",
      temp_password: tempPassword,
      invitation_status: "completed",
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return { error: profileError.message }
    }

    return {
      success: true,
      credentials: {
        email: "admin@hihfinancial.com",
        password: tempPassword,
        message: "Admin account created. Please change password after first login.",
      },
    }
  } catch (error) {
    console.error("Create admin account error:", error)
    return { error: "Failed to create admin account" }
  }
}
