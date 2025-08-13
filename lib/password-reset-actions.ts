"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function resetUserPassword(email: string, newPassword: string) {
  try {
    console.log("Resetting password for user:", email)

    // Use admin client to update user password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      // First get the user ID
      (await supabaseAdmin.auth.admin.listUsers()).data.users.find((u) => u.email === email)?.id || "",
      {
        password: newPassword,
      },
    )

    if (error) {
      console.error("Password reset error:", error)
      return { error: error.message }
    }

    console.log("Password reset successful for:", email)
    return { success: true, message: "Password reset successfully" }
  } catch (error) {
    console.error("Password reset error:", error)
    return { error: "An unexpected error occurred during password reset" }
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
      console.error("Password reset email error:", error)
      return { error: error.message }
    }

    return { success: true, message: "Password reset email sent" }
  } catch (error) {
    console.error("Password reset email error:", error)
    return { error: "An unexpected error occurred" }
  }
}
