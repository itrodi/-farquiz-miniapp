"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-kit-context"
import Link from "next/link"

export function NotificationsDropdown() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only run if the user is authenticated
    if (!isAuthenticated) {
      return
    }

    // Create the Supabase client inside the effect to ensure it's only created in the browser
    const supabase = createClient()

    const fetchNotificationCount = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          return
        }

        // Get friend requests count
        const { count: friendRequestsCount, error: friendsError } = await supabase
          .from("friends")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", session.user.id)
          .eq("status", "pending")

        if (friendsError) {
          console.error("Error fetching friend requests count:", friendsError)
        }

        // Get pending challenges count
        const { count: pendingChallengesCount, error: pendingChallengesError } = await supabase
          .from("challenges")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", session.user.id)
          .eq("status", "pending")

        if (pendingChallengesError) {
          console.error("Error fetching pending challenges count:", pendingChallengesError)
        }

        // Get completed challenges count (that haven't been seen)
        const { count: completedChallengesCount, error: completedChallengesError } = await supabase
          .from("challenges")
          .select("*", { count: "exact", head: true })
          .or(`challenger_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .eq("status", "completed")
          .eq("seen", false)

        if (completedChallengesError) {
          console.error("Error fetching completed challenges count:", completedChallengesError)
        }

        // Calculate total unread count
        const totalUnread = (friendRequestsCount || 0) + (pendingChallengesCount || 0) + (completedChallengesCount || 0)
        setUnreadCount(totalUnread)
      } catch (error) {
        console.error("Error fetching notification count:", error)
      }
    }

    // Initial fetch
    fetchNotificationCount()

    // Set up polling instead of real-time subscriptions
    const pollingInterval = setInterval(fetchNotificationCount, 10000) // Poll every 10 seconds

    return () => {
      clearInterval(pollingInterval)
    }
  }, [isAuthenticated])

  // If not authenticated, don't show the notifications button
  if (!isAuthenticated) {
    return null
  }

  return (
    <Link href="/notifications" passHref>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
