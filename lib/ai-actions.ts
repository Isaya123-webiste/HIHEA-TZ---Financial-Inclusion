"use server"

import {
  generateFinancialReport,
  analyzeUserBehavior,
  getChatbotResponse,
  generateEmailContent,
  validateAndSuggestFormData,
  generatePredictions,
} from "./v0-api-service"

// Re-export all AI service functions
export {
  generateFinancialReport,
  analyzeUserBehavior,
  getChatbotResponse,
  generateEmailContent,
  validateAndSuggestFormData,
  generatePredictions,
}

// Additional AI-powered actions specific to the platform
export async function generateBranchReport(branchId: string, period: string) {
  try {
    // This would typically fetch real data from the database
    const mockMetrics = [
      { name: "Total Members", value: 150, change: "+12%" },
      { name: "Active Loans", value: 45, change: "+8%" },
      { name: "Savings Balance", value: 25000, change: "+15%" },
      { name: "Default Rate", value: 2.1, change: "-0.5%" },
    ]

    const result = await generateFinancialReport({
      branchId,
      period,
      metrics: mockMetrics,
      userRole: "branch_manager",
    })

    return result
  } catch (error) {
    console.error("Branch report generation error:", error)
    return { error: "Failed to generate branch report" }
  }
}

export async function getAIAssistance(message: string, userContext: any) {
  try {
    const result = await getChatbotResponse(message, {
      userRole: userContext.role || "user",
      branchName: userContext.branchName || "Unknown Branch",
      recentActivity: userContext.recentActivity || [],
    })

    return result
  } catch (error) {
    console.error("AI assistance error:", error)
    return { error: "Failed to get AI assistance" }
  }
}

export async function validateFormSubmission(formType: string, formData: any) {
  try {
    const result = await validateAndSuggestFormData(formType, formData)
    return result
  } catch (error) {
    console.error("Form validation error:", error)
    return { error: "Failed to validate form" }
  }
}
