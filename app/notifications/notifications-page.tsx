"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/simplified-auth-context"

import { Spinner } from "@/components/ui/spinner"

export default function NotificationsPage() {
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Only run if the user is authenticated
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    // Create the Supabase client inside the effect to ensure it's only created in the browser
    const supabase = createClient()

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setLoading(false)
          return
        }

        // Store the current user ID for later use in the component
        setCurrentUserId(session.user.id)

        // Get friend requests - using separate queries instead of joins
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("*")
          .eq("recipient_id", session.user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (friendsError) {
          console.error("Error fetching friend requests:", friendsError)
        }

        // If we have friend requests, fetch the sender profiles
        let enrichedFriendRequests: any[] = []
        if (friendsData && friendsData.length > 0) {
          // Get all sender IDs
          const senderIds = friendsData.map((request) => request.sender_id)

          // Fetch profiles for these senders
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", senderIds)

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
          }

          // Combine the data
          if (profilesData) {
            enrichedFriendRequests = friendsData.map((request) => {
              const senderProfile = profilesData.find((profile) => profile.id === request.sender_id)
              return {
                ...request,
                sender_profile: senderProfile || { username: "Unknown", display_name: "Unknown User" },
              }
            })
          }
        }

        // Get challenge notifications
        const { data: challengeData, error: challengesError } = await supabase
          .from("challenges")
          .select(`
            id,
            status,
            challenger_id,
            recipient_id,
            quiz_id,
            challenger_score,
            recipient_score,
            created_at
          `)
          .or(`challenger_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false })
          .limit(20)

        if (challengesError) {
          console.error("Error fetching challenges:", challengesError)
        }

        // Enrich challenge data with profiles and quiz info
        let enrichedChallenges: any[] = []
        if (challengeData && challengeData.length > 0) {
          // Get all user IDs involved in challenges
          const userIds = new Set<string>()
          challengeData.forEach((challenge) => {
            userIds.add(challenge.challenger_id)
            userIds.add(challenge.recipient_id)
          })

          // Get all quiz IDs
          const quizIds = challengeData.map((challenge) => challenge.quiz_id)

          // Fetch profiles
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", Array.from(userIds))

          if (profilesError) {
            console.error("Error fetching profiles for challenges:", profilesError)
          }

          // Fetch quizzes
          const { data: quizzesData, error: quizzesError } = await supabase
            .from("quizzes")
            .select("id, title, emoji")
            .in("id", quizIds)

          if (quizzesError) {
            console.error("Error fetching quizzes:", quizzesError)
          }

          // Combine the data
          if (profilesData && quizzesData) {
            enrichedChallenges = challengeData.map((challenge) => {
              const challengerProfile = profilesData.find((profile) => profile.id === challenge.challenger_id)
              const recipientProfile = profilesData.find((profile) => profile.id === challenge.recipient_id)
              const quiz = quizzesData.find((quiz) => quiz.id === challenge.quiz_id)

              return {
                ...challenge,
                challenger: challengerProfile || { username: "Unknown", display_name: "Unknown User" },
                recipient: recipientProfile || { username: "Unknown", display_name: "Unknown User" },
                quiz: quiz || { title: "Unknown Quiz", emoji: "❓" },
              }
            })
          }
        }

        setFriendRequests(enrichedFriendRequests || [])
        setChallenges(enrichedChallenges || [])
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchNotifications()

    // Set up polling instead of real-time subscriptions
    const pollingInterval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds

    return () => {
      clearInterval(pollingInterval)
    }
  }, [isAuthenticated])

  const handleFriendRequestAction = async (requestId: string, action: "accept" | "decline") => {
    const supabase = createClient()
    try {
      if (action === "accept") {
        await fetch(`/api/friends/${requestId}/accept`, { method: "POST" })
      } else {
        await fetch(`/api/friends/${requestId}/decline`, { method: "POST" })
      }

      // Refresh the friend requests
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const { data, error } = await supabase
          .from("friends")
          .select("*")
          .eq("recipient_id", session.user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error refreshing friend requests:", error)
          return
        }

        // Update the friend requests
        let enrichedFriendRequests: any[] = []
        if (data && data.length > 0) {
          const senderIds = data.map((request) => request.sender_id)
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", senderIds)

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
            return
          }

          if (profilesData) {
            enrichedFriendRequests = data.map((request) => {
              const senderProfile = profilesData.find((profile) => profile.id === request.sender_id)
              return {
                ...request,
                sender_profile: senderProfile || { username: "Unknown", display_name: "Unknown User" },
              }
            })
          }
        }

        setFriendRequests(enrichedFriendRequests)
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error)
    }
  }

  const handleChallengeAction = async (challengeId: string, action: "accept" | "decline" | "view") => {
    if (action === "view") {
      router.push(`/quiz/challenge-result/${challengeId}`)
      return
    }

    try {
      if (action === "accept") {
        await fetch(`/api/challenges/${challengeId}/accept`, { method: "POST" })
        router.push(`/quiz/${challengeId}?mode=challenge`)
      } else {
        await fetch(`/api/challenges/${challengeId}/decline`, { method: "POST" })

        // Refresh the challenges
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          const { data, error } = await supabase
            .from("challenges")
            .select(`
              id,
              status,
              challenger_id,
              recipient_id,
              quiz_id,
              challenger_score,
              recipient_score,
              created_at
            `)
            .or(`challenger_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
            .order("created_at", { ascending: false })
            .limit(20)

          if (error) {
            console.error("Error refreshing challenges:", error)
            return
          }

          // Update the challenges
          setChallenges(data || [])
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing challenge:`, error)
    }
  }

  // If not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Please sign in to view your notifications.</p>
        </CardContent>
      </Card>
    )
  }

  // Filter notifications based on active tab
  const filteredFriendRequests = activeTab === "all" || activeTab === "friends" ? friendRequests : []
  const filteredChallenges = activeTab === "all" || activeTab === "challenges" ? challenges : []

  return (
    <div>
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="friends">Friend Requests</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {filteredFriendRequests.length === 0 && filteredChallenges.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">No notifications to display.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredFriendRequests.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Friend Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {filteredFriendRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-start justify-between p-4 bg-slate-800 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0"></div>
                              <div>
                                <p className="font-medium">
                                  {request.sender_profile.display_name || request.sender_profile.username} sent you a
                                  friend request
                                </p>
                                <p className="text-sm text-gray-400">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleFriendRequestAction(request.id, "accept")}>
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFriendRequestAction(request.id, "decline")}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {filteredChallenges.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Challenges</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {filteredChallenges.map((challenge) => {
                          const isChallenger = challenge.challenger_id === currentUserId
                          const otherUser = isChallenger ? challenge.recipient : challenge.challenger

                          let statusText = ""
                          let statusBadge = ""
                          let showAcceptDecline = false

                          if (challenge.status === "pending") {
                            if (isChallenger) {
                              statusText = "waiting for response"
                              statusBadge = "pending"
                            } else {
                              statusText = "challenged you"
                              statusBadge = "pending"
                              showAcceptDecline = true
                            }
                          } else if (challenge.status === "accepted") {
                            if (isChallenger) {
                              statusText = "accepted your challenge"
                              statusBadge = "accepted"
                            } else {
                              statusText = "challenge accepted"
                              statusBadge = "accepted"
                            }
                          } else if (challenge.status === "completed") {
                            const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
                            const otherScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

                            if (userScore > otherScore) {
                              statusText = "you won"
                              statusBadge = "won"
                            } else if (userScore < otherScore) {
                              statusText = "you lost"
                              statusBadge = "lost"
                            } else {
                              statusText = "it's a draw"
                              statusBadge = "draw"
                            }
                          }

                          return (
                            <div
                              key={challenge.id}
                              className="flex items-start justify-between p-4 bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0"></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {otherUser?.display_name || otherUser?.username || "User"}
                                    </p>
                                    <Badge
                                      variant={
                                        statusBadge === "won"
                                          ? "success"
                                          : statusBadge === "lost"
                                            ? "destructive"
                                            : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {statusBadge}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">
                                    {statusText} - {challenge.quiz?.emoji || "🎮"} {challenge.quiz?.title || "Quiz"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(challenge.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {showAcceptDecline ? (
                                  <>
                                    <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "accept")}>
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleChallengeAction(challenge.id, "decline")}
                                    >
                                      Decline
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "view")}>
                                    View
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {filteredFriendRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">No friend requests to display.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Friend Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredFriendRequests.map((request) => (
                      <div key={request.id} className="flex items-start justify-between p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium">
                              {request.sender_profile.display_name || request.sender_profile.username} sent you a friend
                              request
                            </p>
                            <p className="text-sm text-gray-400">{new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleFriendRequestAction(request.id, "accept")}>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFriendRequestAction(request.id, "decline")}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {filteredChallenges.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">No challenges to display.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Challenges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredChallenges.map((challenge) => {
                      const isChallenger = challenge.challenger_id === currentUserId
                      const otherUser = isChallenger ? challenge.recipient : challenge.challenger

                      let statusText = ""
                      let statusBadge = ""
                      let showAcceptDecline = false

                      if (challenge.status === "pending") {
                        if (isChallenger) {
                          statusText = "waiting for response"
                          statusBadge = "pending"
                        } else {
                          statusText = "challenged you"
                          statusBadge = "pending"
                          showAcceptDecline = true
                        }
                      } else if (challenge.status === "accepted") {
                        if (isChallenger) {
                          statusText = "accepted your challenge"
                          statusBadge = "accepted"
                        } else {
                          statusText = "challenge accepted"
                          statusBadge = "accepted"
                        }
                      } else if (challenge.status === "completed") {
                        const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
                        const otherScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

                        if (userScore > otherScore) {
                          statusText = "you won"
                          statusBadge = "won"
                        } else if (userScore < otherScore) {
                          statusText = "you lost"
                          statusBadge = "lost"
                        } else {
                          statusText = "it's a draw"
                          statusBadge = "draw"
                        }
                      }

                      return (
                        <div
                          key={challenge.id}
                          className="flex items-start justify-between p-4 bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0"></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {otherUser?.display_name || otherUser?.username || "User"}
                                </p>
                                <Badge
                                  variant={
                                    statusBadge === "won"
                                      ? "success"
                                      : statusBadge === "lost"
                                        ? "destructive"
                                        : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {statusBadge}
                                </Badge>
                              </div>
                              <p className="text-sm">
                                {statusText} - {challenge.quiz?.emoji || "🎮"} {challenge.quiz?.title || "Quiz"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(challenge.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {showAcceptDecline ? (
                              <>
                                <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "accept")}>
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChallengeAction(challenge.id, "decline")}
                                >
                                  Decline
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "view")}>
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
