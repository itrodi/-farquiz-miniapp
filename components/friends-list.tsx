"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Swords } from "lucide-react"
import Link from "next/link"
import { ChallengeModal } from "@/components/challenge-modal"
import { createClient } from "@/lib/supabase/client"

export function FriendsList() {
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [challengeUser, setChallengeUser] = useState<{ id: string; name: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true)
      try {
        // Get the current user's ID
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }

        // Get all accepted friendships where the user is either sender or recipient
        const { data: friendships, error: friendshipsError } = await supabase
          .from("friends")
          .select("id, created_at, sender_id, recipient_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false })

        if (friendshipsError) {
          console.error("Error fetching friendships:", friendshipsError)
          setLoading(false)
          return
        }

        if (!friendships || friendships.length === 0) {
          setFriends([])
          setLoading(false)
          return
        }

        // Get all friend IDs (the other user in each friendship)
        const friendIds = friendships.map((friendship) =>
          friendship.sender_id === session.user.id ? friendship.recipient_id : friendship.sender_id,
        )

        // Get all friend profiles
        const { data: friendProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", friendIds)

        if (profilesError) {
          console.error("Error fetching friend profiles:", profilesError)
          setLoading(false)
          return
        }

        // Combine the data
        const enrichedFriends = friendships.map((friendship) => {
          const friendId = friendship.sender_id === session.user.id ? friendship.recipient_id : friendship.sender_id
          const friendProfile = friendProfiles?.find((profile) => profile.id === friendId)

          return {
            id: friendship.id,
            created_at: friendship.created_at,
            friend: friendProfile || { id: friendId, username: "Unknown", display_name: "Unknown User" },
          }
        })

        setFriends(enrichedFriends)
      } catch (error) {
        console.error("Error fetching friends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()

    // Set up a subscription to refresh the data when friendships change
    const friendsSubscription = supabase
      .channel("friends-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          fetchFriends()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(friendsSubscription)
    }
  }, [])

  const handleChallenge = (userId: string, name: string) => {
    setChallengeUser({ id: userId, name })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p>You don't have any friends yet.</p>
            <p className="mt-2">Search for users in the Social tab to add friends.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friendship) => (
              <div key={friendship.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friendship.friend.avatar_url || undefined} />
                    <AvatarFallback>
                      {friendship.friend.display_name?.charAt(0) || friendship.friend.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{friendship.friend.display_name || friendship.friend.username}</div>
                    {friendship.friend.username && (
                      <div className="text-sm text-gray-400">@{friendship.friend.username}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleChallenge(
                        friendship.friend.id,
                        friendship.friend.display_name || friendship.friend.username,
                      )
                    }
                  >
                    <Swords className="h-4 w-4 mr-1" />
                    Challenge
                  </Button>

                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/social/profile/${friendship.friend.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {challengeUser && (
        <ChallengeModal
          isOpen={!!challengeUser}
          onClose={() => setChallengeUser(null)}
          recipientId={challengeUser.id}
          recipientName={challengeUser.name}
        />
      )}
    </>
  )
}
