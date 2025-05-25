"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Clock, Share2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-kit-context"

interface ChallengeResultsProps {
  score: number
  totalQuestions: number
  timeTaken: number
  quizId: string
  quizTitle: string
  challengeId: string
}

export function ChallengeResults({
  score,
  totalQuestions,
  timeTaken,
  quizId,
  quizTitle,
  challengeId,
}: ChallengeResultsProps) {
  const [challenge, setChallenge] = useState<any>(null)
  const [opponent, setOpponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const percentage = Math.round((score / totalQuestions) * 100)
  const minutes = Math.floor(timeTaken / 60)
  const seconds = timeTaken % 60

  useEffect(() => {
    if (!isAuthenticated || !challengeId) {
      setLoading(false)
      return
    }

    const fetchChallengeData = async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        // Get the current user's ID
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }

        // Get the challenge data
        const { data: challengeData, error: challengeError } = await supabase
          .from("challenges")
          .select(`
            *,
            challenger:profiles!challenger_id(id, username, display_name, avatar_url),
            recipient:profiles!recipient_id(id, username, display_name, avatar_url)
          `)
          .eq("id", challengeId)
          .single()

        if (challengeError) {
          console.error("Error fetching challenge:", challengeError)
          setError("Failed to load challenge data")
          setLoading(false)
          return
        }

        setChallenge(challengeData)

        // Determine if the current user is the challenger or recipient
        const isChallenger = challengeData.challenger_id === session.user.id
        const opponentProfile = isChallenger ? challengeData.recipient : challengeData.challenger
        setOpponent(opponentProfile)

        // Submit the score if it hasn't been submitted yet
        if (
          (isChallenger && challengeData.challenger_score === null) ||
          (!isChallenger && challengeData.recipient_score === null)
        ) {
          await submitScore(session.user.id, score, challengeData)
        }
      } catch (error) {
        console.error("Error in challenge results:", error)
        setError("An error occurred while loading challenge results")
      } finally {
        setLoading(false)
      }
    }

    fetchChallengeData()
  }, [challengeId, score, isAuthenticated])

  const submitScore = async (userId: string, userScore: number, challengeData: any) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/challenges/${challengeId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ score: userScore }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit challenge score")
      }

      // Update the local challenge data with the new score
      const isChallenger = challengeData.challenger_id === userId
      if (isChallenger) {
        setChallenge({
          ...challengeData,
          challenger_score: userScore,
        })
      } else {
        setChallenge({
          ...challengeData,
          recipient_score: userScore,
        })
      }
    } catch (error) {
      console.error("Error submitting score:", error)
      setError("Failed to submit your score")
    } finally {
      setSubmitting(false)
    }
  }

  const getResultMessage = () => {
    if (!challenge) return "Challenge results"

    const supabase = createClient()
    const {
      data: { session },
    } = supabase.auth.getSession()
    if (!session?.user) return "Challenge results"

    const isChallenger = challenge.challenger_id === session.user.id
    const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
    const opponentScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

    if (opponentScore === null) {
      return `Waiting for ${opponent?.display_name || opponent?.username || "opponent"} to complete the challenge`
    }

    if (userScore > opponentScore) {
      return "Congratulations! You won the challenge!"
    } else if (userScore < opponentScore) {
      return "You lost the challenge. Better luck next time!"
    } else {
      return "It's a draw! Great minds think alike."
    }
  }

  const getResultStatus = () => {
    if (!challenge) return null

    const supabase = createClient()
    const {
      data: { session },
    } = supabase.auth.getSession()
    if (!session?.user) return null

    const isChallenger = challenge.challenger_id === session.user.id
    const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
    const opponentScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

    if (opponentScore === null) {
      return <Badge variant="outline">Waiting</Badge>
    }

    if (userScore > opponentScore) {
      return <Badge variant="success">Won</Badge>
    } else if (userScore < opponentScore) {
      return <Badge variant="destructive">Lost</Badge>
    } else {
      return <Badge variant="outline">Draw</Badge>
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button asChild>
            <Link href="/explore">Browse More Quizzes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">Challenge Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {score}/{totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-purple-400">{percentage}%</div>
            <p className="mt-2 text-gray-400">{getResultMessage()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Clock className="h-5 w-5 text-blue-400 mb-1" />
              <div className="text-sm text-gray-400">Time Taken</div>
              <div className="font-semibold">{formatTime(timeTaken)}</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
              <div className="text-sm text-gray-400">Status</div>
              <div className="font-semibold">{getResultStatus()}</div>
            </div>
          </div>

          {opponent && (
            <div className="mt-6 bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Challenge Details</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={opponent.avatar_url || undefined} />
                    <AvatarFallback>
                      {opponent.display_name?.charAt(0) || opponent.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{opponent.display_name || opponent.username}</div>
                    {opponent.username && <div className="text-sm text-gray-400">@{opponent.username}</div>}
                  </div>
                </div>
                <div>
                  {challenge && challenge.challenger_id === opponent.id && challenge.challenger_score !== null && (
                    <div className="text-right">
                      <div className="font-bold">
                        {challenge.challenger_score}/{totalQuestions}
                      </div>
                      <div className="text-sm text-gray-400">
                        {Math.round((challenge.challenger_score / totalQuestions) * 100)}%
                      </div>
                    </div>
                  )}
                  {challenge && challenge.recipient_id === opponent.id && challenge.recipient_score !== null && (
                    <div className="text-right">
                      <div className="font-bold">
                        {challenge.recipient_score}/{totalQuestions}
                      </div>
                      <div className="text-sm text-gray-400">
                        {Math.round((challenge.recipient_score / totalQuestions) * 100)}%
                      </div>
                    </div>
                  )}
                  {((challenge && challenge.challenger_id === opponent.id && challenge.challenger_score === null) ||
                    (challenge && challenge.recipient_id === opponent.id && challenge.recipient_score === null)) && (
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Waiting for result</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() =>
            navigator
              .share({
                title: `My ${quizTitle} Challenge Result`,
                text: `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz!`,
                url: window.location.href,
              })
              .catch(() => {
                navigator.clipboard.writeText(
                  `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz! Try it yourself: ${window.location.href}`,
                )
                alert("Result copied to clipboard!")
              })
          }
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Result
        </Button>
        <Button asChild className="flex-1">
          <Link href="/explore">
            Try More Quizzes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
