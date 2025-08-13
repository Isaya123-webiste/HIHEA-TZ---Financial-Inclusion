"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  related_form_id?: string
  created_at: string
  updated_at: string
}

export interface NotificationResult {
  success: boolean
  data?: any
  error?: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error" = "info",
  relatedFormId?: string,
): Promise<NotificationResult> {
  try {
    // Check if notifications table exists
    const { error: tableCheckError } = await supabaseAdmin.from("notifications").select("id").limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist yet")
      return { success: false, error: "Notifications table not initialized" }
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_form_id: relatedFormId,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Create notification error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Create notification exception:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

export async function getUserNotifications(userId: string): Promise<NotificationResult> {
  try {
    // Check if notifications table exists
    const { error: tableCheckError } = await supabaseAdmin.from("notifications").select("id").limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist yet")
      return { success: true, data: [] }
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Get notifications error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get notifications exception:", error)
    return { success: true, data: [] } // Return empty array instead of error
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<NotificationResult> {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) {
      console.error("Mark notification read error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Mark notification read exception:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<NotificationResult> {
  try {
    // Check if notifications table exists
    const { error: tableCheckError } = await supabaseAdmin.from("notifications").select("id").limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist yet")
      return { success: true, data: 0 }
    }

    const { count, error } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      console.error("Get unread count error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error("Get unread count exception:", error)
    return { success: true, data: 0 } // Return 0 instead of error
  }
}
