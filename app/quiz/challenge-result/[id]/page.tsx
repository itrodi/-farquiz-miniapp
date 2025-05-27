"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Clock, Share2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/simplified-auth-context"
import { toast } from "@/components/ui/use-toast"

export default function ChallengeResultPage({ params }: { params: { id: string } }) {
  const [challenge, setChallenge] = useState<any>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [opponent, setOpponent] = useState<any>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()
  const supabase = createClient()
  const challengeId = params.id

  useEffect(() => {
    const fetchChallengeData = async () => {
      setLoading(true)
      try {
        console.log("Fetching challenge data for ID:", challengeId)

        // Get the current user's ID
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          console.error("No session found")
          setError("You must be logged in to view challenge results")
          setLoading(false)
          return
        }

        console.log("User authenticated:", session.user.id)

        // Get the challenge data - don't select questions directly from quizzes
        const { data: challengeData, error: challengeError } = await supabase
          .from("challenges")
          .select(`
            *,
            challenger:profiles!challenger_id(id, username, display_name, avatar_url),
            recipient:profiles!recipient_id(id, username, display_name, avatar_url),
            quiz:quizzes(id, title, emoji, description)
          `)
          .eq("id", challengeId)
          .single()

        if (challengeError) {
          console.error("Error fetching challenge:", challengeError)
          setError("Failed to load challenge data")
          setLoading(false)
          return
        }

        console.log("Challenge data retrieved:", challengeData)

        setChallenge(challengeData)
        setQuiz(challengeData.quiz)

        // Determine if the current user is the challenger or recipient
        const isChallenger = challengeData.challenger_id === session.user.id
        const opponentProfile = isChallenger ? challengeData.recipient : challengeData.challenger
        setOpponent(opponentProfile)

        console.log("Opponent set:", opponentProfile)

        // Fetch the number of questions for this quiz in a separate query
        if (challengeData.quiz) {
          const { count, error: countError } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", challengeData.quiz.id)

          if (countError) {
            console.error("Error counting questions:", countError)
          } else {
            console.log("Total questions:", count)
            setTotalQuestions(count || 0)
          }
        }
      } catch (error) {
        console.error("Error in challenge results:", error)
        setError("An error occurred while loading challenge results")
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchChallengeData()
    }
  }, [challengeId, supabase])

  const getResultMessage = () => {
    if (!challenge || !profile) return "Challenge results"

    const isChallenger = challenge.challenger_id === profile.id
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
    if (!challenge || !profile) return null

    const isChallenger = challenge.challenger_id === profile.id
    const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
    const opponentScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

    if (opponentScore === null) {
      return <Badge variant="outline">Waiting</Badge>
    }

    if (userScore > opponentScore) {
      return <Badge className="bg-green-500 hover:bg-green-600">Won</Badge>
    } else if (userScore < opponentScore) {
      return <Badge className="bg-red-500 hover:bg-red-600">Lost</Badge>
    } else {
      return <Badge variant="outline">Draw</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container max-w-md md:max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-md md:max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button asChild>
              <Link href="/explore">Browse Quizzes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!challenge || !profile) {
    return (
      <div className="container max-w-md md:max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Challenge not found or still loading</p>
            <Button asChild>
              <Link href="/explore">Browse Quizzes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isChallenger = challenge.challenger_id === profile.id
  const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
  const opponentScore = isChallenger ? challenge.recipient_score : challenge.challenger_score
  const userPercentage = totalQuestions > 0 ? Math.round((userScore / totalQuestions) * 100) : 0
  const opponentPercentage =
    opponentScore !== null && totalQuestions > 0 ? Math.round((opponentScore / totalQuestions) * 100) : null

  return (
    <div className="container max-w-md md:max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Challenge Results</h1>

      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">
              {quiz?.emoji && <span className="mr-2">{quiz.emoji}</span>}
              {quiz?.title || "Quiz Challenge"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">
                {userScore}/{totalQuestions}
              </div>
              <div className="text-2xl font-semibold text-purple-400">{userPercentage}%</div>
              <p className="mt-2 text-gray-400">{getResultMessage()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
                <Clock className="h-5 w-5 text-blue-400 mb-1" />
                <div className="text-sm text-gray-400">Challenge Status</div>
                <div className="font-semibold mt-1">{getResultStatus()}</div>
              </div>
              <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
                <div className="text-sm text-gray-400">Points Earned</div>
                <div className="font-semibold">
                  {challenge.status === "completed"
                    ? userScore > opponentScore
                      ? "+3"
                      : userScore === opponentScore
                        ? "+1"
                        : "0"
                    : "Pending"}
                </div>
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
                    {opponentScore !== null ? (
                      <div className="text-right">
                        <div className="font-bold">
                          {opponentScore}/{totalQuestions}
                        </div>
                        <div className="text-sm text-gray-400">{opponentPercentage}%</div>
                      </div>
                    ) : (
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
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: `My ${quiz?.title || "Quiz"} Challenge Result`,
                    text: `I scored ${userScore}/${totalQuestions} (${userPercentage}%) on the ${
                      quiz?.title || "Quiz"
                    } challenge!`,
                    url: window.location.href,
                  })
                  .catch(() => {
                    navigator.clipboard.writeText(
                      `I scored ${userScore}/${totalQuestions} (${userPercentage}%) on the ${
                        quiz?.title || "Quiz"
                      } challenge! Try it yourself: ${window.location.href}`,
                    )
                    toast({
                      title: "Result copied to clipboard!",
                      description: "Share it with your friends!",
                    })
                  })
              } else {
                navigator.clipboard.writeText(
                  `I scored ${userScore}/${totalQuestions} (${userPercentage}%) on the ${
                    quiz?.title || "Quiz"
                  } challenge! Try it yourself: ${window.location.href}`,
                )
                toast({
                  title: "Result copied to clipboard!",
                  description: "Share it with your friends!",
                })
              }
            }}
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
    </div>
  )
}
