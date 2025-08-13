"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// AI-Powered Email Service (Generation Only)
export class AIEmailService {
  private model = openai("gpt-4o")

  // Generate intelligent invitation emails
  async generateInvitationEmail(data: {
    userName: string
    userEmail: string
    branchName: string
    adminName: string
    userRole: string
    setupUrl: string
    organizationContext?: string
  }) {
    try {
      const { text } = await generateText({
        model: this.model,
        system: `You are an expert email content generator for HIH Financial Inclusion. Create professional, welcoming, and personalized invitation emails.`,
        prompt: `
          Generate a professional invitation email for HIH Financial Inclusion:
          
          - User Name: ${data.userName}
          - User Role: ${data.userRole}
          - Branch: ${data.branchName}
          - Admin Name: ${data.adminName}
          - Setup URL: ${data.setupUrl}
          
          Requirements:
          1. Professional and welcoming tone
          2. Clear explanation of HIH Financial Inclusion's mission
          3. Role-specific welcome message
          4. Clear call-to-action for account setup
          5. HTML format with good styling
          
          Return ONLY the HTML email content.
        `,
      })

      return { success: true, emailContent: text }
    } catch (error) {
      console.error("AI email generation error:", error)
      return { error: "Failed to generate email content" }
    }
  }

  // Log generated email instead of sending
  async logGeneratedEmail(to: string, subject: string, htmlContent: string) {
    console.log("📧 AI-GENERATED EMAIL:")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("Content Preview:", htmlContent.substring(0, 200) + "...")
    console.log("---")

    return {
      success: true,
      mode: "local",
      message: "AI-generated email logged to console",
    }
  }
}

// Export singleton instance
export const aiEmailService = new AIEmailService()

// Simplified AI email functions
export async function generateAIInvitationEmail(
  userEmail: string,
  userName: string,
  invitationToken: string,
  branchName: string,
  adminName: string,
  userRole: string,
  baseUrl?: string,
) {
  try {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const setupUrl = `${siteUrl}/setup-account?token=${invitationToken}`

    // Generate AI-powered email content
    const emailResult = await aiEmailService.generateInvitationEmail({
      userName,
      userEmail,
      branchName,
      adminName,
      userRole,
      setupUrl,
      organizationContext: "HIH Financial Inclusion provides microfinance services",
    })

    if (emailResult.error) {
      return { error: emailResult.error }
    }

    // Log the generated email
    const logResult = await aiEmailService.logGeneratedEmail(
      userEmail,
      `Welcome to HIH Financial Inclusion - Complete Your ${userRole} Account Setup`,
      emailResult.emailContent!,
    )

    return {
      success: true,
      setupUrl,
      mode: "local",
      message: "AI email generated and logged",
      emailContent: emailResult.emailContent,
    }
  } catch (error) {
    console.error("Generate AI invitation email error:", error)
    return { error: "Failed to generate AI invitation email" }
  }
}
