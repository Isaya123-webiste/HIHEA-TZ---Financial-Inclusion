"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  type Notification,
} from "@/lib/notification-actions"

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadNotifications()
      loadUnreadCount()

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        if (!loading) {
          loadUnreadCount()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [userId, loading])

  const loadNotifications = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const result = await getUserNotifications(userId)
      if (result.success) {
        setNotifications(result.data || [])
      } else {
        console.warn("Failed to load notifications:", result.error)
        setError(result.error || "Failed to load notifications")
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!userId) return

    try {
      const result = await getUnreadNotificationCount(userId)
      if (result.success) {
        setUnreadCount(result.data || 0)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
      // Don't show error for unread count, just keep it at current value
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && userId && !loading) {
      loadNotifications()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Unknown"
      }

      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 1) {
        return "Just now"
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
      } else if (diffInHours < 168) {
        // 7 days
        return `${Math.floor(diffInHours / 24)}d ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch {
      return "Unknown"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  // Don't render if no userId
  if (!userId) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
              style={{ backgroundColor: "#009edb" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 mx-auto mb-2"
                    style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
                  ></div>
                  Loading notifications...
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-500 mb-2">Unable to load notifications</p>
                  <Button variant="outline" size="sm" onClick={() => loadNotifications()}>
                    Try Again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">You'll see updates here when they arrive</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      } ${index !== notifications.length - 1 ? "border-b" : ""}`}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                            <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                            {!notification.read && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: "#009edb" }}
                              ></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    // Mark all as read
                    notifications.forEach((n) => {
                      if (!n.read) {
                        handleMarkAsRead(n.id)
                      }
                    })
                  }}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
