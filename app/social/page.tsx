"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, UserPlus, Swords } from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { ChallengeModal } from "@/components/challenge-modal"
import { FriendRequests } from "@/components/friend-requests"
import { FriendsList } from "@/components/friends-list"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/simplified-auth-context"


export default function SocialPage() {
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Record<string, string>>({}) // id -> status
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [challengeUser, setChallengeUser] = useState<{ id: string; name: string } | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()
  const { profile } = useAuth()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, total_score")
          .order("total_score", { ascending: false })
          .limit(20)

        if (debouncedSearchQuery) {
          query = query.or(`username.ilike.%${debouncedSearchQuery}%,display_name.ilike.%${debouncedSearchQuery}%`)
        }

        const { data, error } = await query

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [debouncedSearchQuery])

  useEffect(() => {
    const fetchFriendStatus = async () => {
      if (!profile) return

      try {
        // Get all friend relationships (pending, sent, and accepted)
        const [pendingRes, sentRes, acceptedRes] = await Promise.all([
          fetch("/api/friends?status=pending"),
          fetch("/api/friends?status=sent"),
          fetch("/api/friends?status=accepted"),
        ])

        const pending = await pendingRes.json()
        const sent = await sentRes.json()
        const accepted = await acceptedRes.json()

        const friendStatus: Record<string, string> = {}

        // Mark pending friend requests
        pending.forEach((request: any) => {
          friendStatus[request.sender.id] = "pending"
        })

        // Mark sent friend requests
        sent.forEach((request: any) => {
          friendStatus[request.recipient.id] = "sent"
        })

        // Mark accepted friends
        accepted.forEach((friendship: any) => {
          friendStatus[friendship.friend.id] = "accepted"
        })

        setFriends(friendStatus)
      } catch (error) {
        console.error("Error fetching friend status:", error)
      }
    }

    fetchFriendStatus()
  }, [profile])

  const handleAddFriend = async (userId: string) => {
    if (!profile) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to add friends.",
        variant: "destructive",
      })
      return
    }

    setActionLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send friend request")
      }

      setFriends((prev) => ({ ...prev, [userId]: "sent" }))

      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent.",
      })
    } catch (error: any) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleChallenge = (userId: string, name: string) => {
    setChallengeUser({ id: userId, name })
  }

  return (
    <div className="container max-w-md md:max-w-4xl mx-auto px-4 py-4 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Social</h1>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-0 pt-2">
          <div className="mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                type="search"
                placeholder="Search users by name or username..."
                className="bg-slate-800 border-slate-700 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Users</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {loading ? (
                <div className="flex justify-center py-6 md:py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {users.map((user) => {
                    const isCurrentUser = profile?.id === user.id
                    const friendStatus = friends[user.id]

                    return (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-700 rounded-lg gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {user.display_name || user.username || "Anonymous"}
                            </div>
                            {user.username && <div className="text-sm text-gray-400 truncate">@{user.username}</div>}
                            <div className="text-sm font-semibold sm:hidden mt-1">{user.total_score} points</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <div className="text-right mr-2 hidden sm:block">
                            <div className="font-bold">{user.total_score} points</div>
                          </div>

                          {!isCurrentUser && (
                            <div className="flex flex-wrap gap-2 justify-end">
                              {friendStatus !== "accepted" && (
                                <Button
                                  size="sm"
                                  variant={friendStatus ? "outline" : "default"}
                                  onClick={() => handleAddFriend(user.id)}
                                  disabled={!!friendStatus || actionLoading[user.id] || isCurrentUser}
                                  className="w-full sm:w-auto"
                                >
                                  {actionLoading[user.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      {friendStatus === "sent"
                                        ? "Sent"
                                        : friendStatus === "pending"
                                          ? "Respond"
                                          : "Add"}
                                    </>
                                  )}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChallenge(user.id, user.display_name || user.username || "User")}
                                className="w-full sm:w-auto"
                              >
                                <Swords className="h-4 w-4 mr-1" />
                                Challenge
                              </Button>

                              <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
                                <Link href={`/social/profile/${user.id}`}>View</Link>
                              </Button>
                            </div>
                          )}

                          {isCurrentUser && (
                            <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
                              <Link href="/profile">View</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {users.length === 0 && <div className="text-center py-6 md:py-8 text-gray-400">No users found</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="mt-0 pt-2">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests" className="mt-0 pt-2">
          <FriendRequests />
        </TabsContent>
      </Tabs>

      {challengeUser && (
        <ChallengeModal
          isOpen={!!challengeUser}
          onClose={() => setChallengeUser(null)}
          recipientId={challengeUser.id}
          recipientName={challengeUser.name}
        />
      )}
    </div>
  )
}
