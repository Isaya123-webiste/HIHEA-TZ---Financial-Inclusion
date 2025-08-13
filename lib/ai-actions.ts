"use server"

import { v0Api } from "./v0-api-service"
import { supabaseAdmin } from "./supabase-admin"
// Declare the supabaseAdmin variable

// Server actions for AI-powered features

export async function generateBranchReport(userId: string, branchId: string, period: string, metrics: any[]) {
  try {
    // Get user role for context
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single()

    const result = await v0Api.generateFinancialReport({
      branchId,
      period,
      metrics,
      userRole: profile?.role || "user",
    })

    return result
  } catch (error) {
    console.error("Generate report error:", error)
    return { error: "Failed to generate report" }
  }
}

export async function getAiInsights(userId: string, dataType: string, data: any) {
  try {
    const result = await v0Api.analyzeUserBehavior({
      userActivity: data.userActivity || [],
      branchMetrics: data.branchMetrics || [],
      timeframe: data.timeframe || "30days",
    })

    return result
  } catch (error) {
    console.error("Get insights error:", error)
    return { error: "Failed to get insights" }
  }
}

export async function chatWithAi(userId: string, message: string, context: any) {
  try {
    const result = await v0Api.getChatbotResponse(message, context)
    return result
  } catch (error) {
    console.error("Chat error:", error)
    return { error: "Failed to get response" }
  }
}
