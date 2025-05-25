"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-kit-context"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

export function UserChallenges({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<any[]>([])
  const [sentChallenges, setSentChallenges] = useState<any[]>([])
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useAuth()
  const isCurrentUser = profile?.id === userId

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true)
      try {
        console.log("Fetching challenges for user:", userId)

        // Fetch active challenges (pending challenges where the user is the recipient)
        const { data: activeChallenges, error: activeError } = await supabase
          .from("challenges")
          .select(`
            *,
            challenger:profiles!challenger_id(id, username, display_name, avatar_url),
            quiz:quizzes(id, title, emoji)
          `)
          .eq("recipient_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (activeError) {
          console.error("Error fetching active challenges:", activeError)
        } else {
          console.log("Active challenges:", activeChallenges)
        }

        // Fetch sent challenges (challenges where the user is the challenger)
        const { data: userSentChallenges, error: sentError } = await supabase
          .from("challenges")
          .select(`
            *,
            recipient:profiles!recipient_id(id, username, display_name, avatar_url),
            quiz:quizzes(id, title, emoji)
          `)
          .eq("challenger_id", userId)
          .order("created_at", { ascending: false })

        if (sentError) {
          console.error("Error fetching sent challenges:", sentError)
        } else {
          console.log("Sent challenges:", userSentChallenges)
        }

        // Fetch completed challenges
        const { data: userCompletedChallenges, error: completedError } = await supabase
          .from("challenges")
          .select(`
            *,
            challenger:profiles!challenger_id(id, username, display_name, avatar_url),
            recipient:profiles!recipient_id(id, username, display_name, avatar_url),
            quiz:quizzes(id, title, emoji)
          `)
          .or(`challenger_id.eq.${userId},recipient_id.eq.${userId}`)
          .eq("status", "completed")
          .order("created_at", { ascending: false })

        if (completedError) {
          console.error("Error fetching completed challenges:", completedError)
        } else {
          console.log("Completed challenges:", userCompletedChallenges)
        }

        setChallenges(activeChallenges || [])
        setSentChallenges(userSentChallenges || [])
        setCompletedChallenges(userCompletedChallenges || [])
      } catch (error) {
        console.error("Error fetching challenges:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchChallenges()
    }

    // Set up a subscription to refresh the data when challenges change
    const challengesSubscription = supabase
      .channel("challenges-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
        },
        () => {
          if (userId) {
            fetchChallenges()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(challengesSubscription)
    }
  }, [userId])

  const handleAcceptChallenge = async (challengeId: string, quizId: string) => {
    if (!isCurrentUser) {
      toast({
        title: "Permission denied",
        description: "You can only accept challenges sent to you.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      // Update the challenge status directly
      const { error } = await supabase.from("challenges").update({ status: "accepted" }).eq("id", challengeId)

      if (error) throw error

      toast({
        title: "Challenge accepted!",
        description: "Take the quiz now to complete the challenge.",
      })

      // Redirect to the quiz with the challenge ID
      router.push(`/quiz/${quizId}?challenge=${challengeId}`)
    } catch (error) {
      console.error("Error accepting challenge:", error)
      toast({
        title: "Failed to accept challenge",
        description: "There was an error accepting the challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeclineChallenge = async (challengeId: string) => {
    if (!isCurrentUser) {
      toast({
        title: "Permission denied",
        description: "You can only decline challenges sent to you.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      // Update the challenge status directly
      const { error } = await supabase.from("challenges").update({ status: "declined" }).eq("id", challengeId)

      if (error) throw error

      // Remove the challenge from the list
      setChallenges(challenges.filter((challenge) => challenge.id !== challengeId))

      toast({
        title: "Challenge declined",
        description: "The challenge has been declined.",
      })
    } catch (error) {
      console.error("Error declining challenge:", error)
      toast({
        title: "Failed to decline challenge",
        description: "There was an error declining the challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="sent">Sent</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-0 pt-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Challenges</CardTitle>
            <CardDescription>Challenges that have been sent to {isCurrentUser ? "you" : "this user"}</CardDescription>
          </CardHeader>
          <CardContent>
            {challenges.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No active challenges</div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={challenge.challenger.avatar_url || undefined} />
                        <AvatarFallback>
                          {challenge.challenger.display_name?.charAt(0) ||
                            challenge.challenger.username?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {challenge.challenger.display_name || challenge.challenger.username} challenged{" "}
                          {isCurrentUser ? "you" : "this user"}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {challenge.quiz.emoji && <span className="mr-1">{challenge.quiz.emoji}</span>}
                          {challenge.quiz.title}
                        </div>
                      </div>
                    </div>

                    {isCurrentUser && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleAcceptChallenge(challenge.id, challenge.quiz_id)}
                          disabled={actionLoading}
                          className="flex-1"
                          size="sm"
                        >
                          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeclineChallenge(challenge.id)}
                          disabled={actionLoading}
                          className="flex-1"
                          size="sm"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sent" className="mt-0 pt-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sent Challenges</CardTitle>
            <CardDescription>
              Challenges that {isCurrentUser ? "you have" : "this user has"} sent to others
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentChallenges.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No sent challenges</div>
            ) : (
              <div className="space-y-3">
                {sentChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={challenge.recipient.avatar_url || undefined} />
                        <AvatarFallback>
                          {challenge.recipient.display_name?.charAt(0) ||
                            challenge.recipient.username?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {isCurrentUser ? "You" : "This user"} challenged{" "}
                          {challenge.recipient.display_name || challenge.recipient.username}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {challenge.quiz.emoji && <span className="mr-1">{challenge.quiz.emoji}</span>}
                          {challenge.quiz.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={challenge.status === "pending" ? "outline" : "default"}>
                        {challenge.status === "pending" ? "Pending" : challenge.status}
                      </Badge>
                      {challenge.challenger_score !== null && (
                        <div className="text-sm">
                          Your score: <span className="font-bold">{challenge.challenger_score}</span>
                        </div>
                      )}
                      {challenge.challenger_score !== null && isCurrentUser && (
                        <Button size="sm" variant="outline" asChild className="ml-2">
                          <Link href={`/quiz/challenge-result/${challenge.id}`}>View Result</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="completed" className="mt-0 pt-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Challenges</CardTitle>
            <CardDescription>Challenges that have been completed</CardDescription>
          </CardHeader>
          <CardContent>
            {completedChallenges.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No completed challenges</div>
            ) : (
              <div className="space-y-3">
                {completedChallenges.map((challenge) => {
                  const isChallenger = challenge.challenger_id === userId
                  const opponent = isChallenger ? challenge.recipient : challenge.challenger
                  const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
                  const opponentScore = isChallenger ? challenge.recipient_score : challenge.challenger_score
                  const userWon = userScore > opponentScore
                  const isDraw = userScore === opponentScore

                  return (
                    <div key={challenge.id} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={opponent.avatar_url || undefined} />
                          <AvatarFallback>
                            {opponent.display_name?.charAt(0) || opponent.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {isChallenger
                              ? `You challenged ${opponent.display_name || opponent.username}`
                              : `${opponent.display_name || opponent.username} challenged you`}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {challenge.quiz.emoji && <span className="mr-1">{challenge.quiz.emoji}</span>}
                            {challenge.quiz.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={userWon ? "success" : isDraw ? "outline" : "destructive"}>
                          {userWon ? "Won" : isDraw ? "Draw" : "Lost"}
                        </Badge>
                        <div className="text-sm">
                          {userScore} - {opponentScore}
                        </div>
                        {isCurrentUser && (
                          <Button size="sm" variant="outline" asChild className="ml-2">
                            <Link href={`/quiz/challenge-result/${challenge.id}`}>View Details</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
