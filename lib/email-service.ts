"use server"

// Simple email service without external APIs
export async function sendInvitationEmail(
  userEmail: string,
  userName: string,
  invitationToken: string,
  branchName: string,
  adminName: string,
  baseUrl?: string,
) {
  try {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const setupUrl = `${siteUrl}/setup-account?token=${invitationToken}`

    // Log email details instead of sending
    console.log("📧 INVITATION EMAIL:")
    console.log("To:", userEmail)
    console.log("User:", userName)
    console.log("Branch:", branchName)
    console.log("Admin:", adminName)
    console.log("Setup URL:", setupUrl)
    console.log("---")

    return {
      success: true,
      setupUrl,
      mode: "local",
      message: "Email logged to console (no external API)",
    }
  } catch (error) {
    console.error("Email service error:", error)
    return { error: "Failed to process invitation email" }
  }
}

export async function sendBulkInvitationEmails(
  users: Array<{
    email: string
    full_name: string
    invitationToken: string
  }>,
  branchName: string,
  adminName: string,
  baseUrl?: string,
) {
  const results = {
    successful: [] as string[],
    failed: [] as string[],
  }

  for (const user of users) {
    const result = await sendInvitationEmail(
      user.email,
      user.full_name,
      user.invitationToken,
      branchName,
      adminName,
      baseUrl,
    )

    if (result.success) {
      results.successful.push(user.email)
    } else {
      results.failed.push(user.email)
    }
  }

  return results
}
