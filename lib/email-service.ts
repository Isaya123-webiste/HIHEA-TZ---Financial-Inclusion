"use server"

// Email service for sending invitation emails
// In production, you would integrate with services like:
// - SendGrid, Mailgun, AWS SES, or Resend

export async function sendInvitationEmail(
  userEmail: string,
  userName: string,
  invitationToken: string,
  branchName: string,
  adminName: string,
  baseUrl?: string,
) {
  try {
    // Use provided baseUrl or default to localhost for development
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const setupUrl = `${siteUrl}/setup-account?token=${invitationToken}`

    // For now, we'll log the email content (in production, send actual email)
    const emailContent = {
      to: userEmail,
      subject: "Welcome to HIH Financial Inclusion - Complete Your Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0d9488; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">HIH Financial Inclusion</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Welcome to HIH Financial Inclusion, ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              You have been invited by <strong>${adminName}</strong> to join the HIH Financial Inclusion platform 
              as a member of <strong>${branchName}</strong>.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              To complete your account setup and create your password, please click the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" 
                 style="background-color: #0d9488; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Complete Account Setup
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${setupUrl}" style="color: #0d9488;">${setupUrl}</a>
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              <strong>Important:</strong> This invitation link will expire in 7 days. 
              If you don't complete your setup within this time, please contact your administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This email was sent by HIH Financial Inclusion. 
              If you received this email by mistake, please ignore it.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to HIH Financial Inclusion, ${userName}!
        
        You have been invited by ${adminName} to join the HIH Financial Inclusion platform 
        as a member of ${branchName}.
        
        To complete your account setup and create your password, please visit:
        ${setupUrl}
        
        This invitation link will expire in 7 days.
        
        If you received this email by mistake, please ignore it.
      `,
    }

    // Log the email for development (replace with actual email sending in production)
    console.log("📧 INVITATION EMAIL TO SEND:")
    console.log("To:", emailContent.to)
    console.log("Subject:", emailContent.subject)
    console.log("Setup URL:", setupUrl)
    console.log("Base URL used:", siteUrl)
    console.log("---")

    // TODO: Replace with actual email service
    // Example with SendGrid:
    // await sgMail.send(emailContent)

    // Example with Resend:
    // await resend.emails.send(emailContent)

    return { success: true, setupUrl }
  } catch (error) {
    console.error("Send invitation email error:", error)
    return { error: "Failed to send invitation email" }
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
