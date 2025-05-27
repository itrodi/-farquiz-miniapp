"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/simplified-auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Trophy, Medal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuizLeaderboardProps {
  quizId: string
  isOpen: boolean
  onClose: () => void
}

export function QuizLeaderboard({ quizId, isOpen, onClose }: QuizLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [userBestScore, setUserBestScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()
  const supabase = createClient()
  const [allScores, setAllScores] = useState<any[] | null>(null)

  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (isOpen && quizId) {
      fetchLeaderboard()
    }
  }, [isOpen, quizId])

  const fetchLeaderboard = async () => {
    if (!quizId) return

    setLoading(true)
    setError(null)

    try {
      console.log("Fetching leaderboard for quiz:", quizId)

      // Get ALL scores for this quiz
      const { data: allScoresData, error: scoresError } = await supabase
        .from("user_scores")
        .select("*")
        .eq("quiz_id", quizId)
        .order("percentage", { ascending: false })
        .order("time_taken", { ascending: true })

      if (scoresError) throw scoresError

      console.log("All scores for quiz:", allScoresData)

      if (!allScoresData || allScoresData.length === 0) {
        setLeaderboardData([])
        setAllScores([])
        setLoading(false)
        return
      }

      setAllScores(allScoresData)

      // Group scores by user and get the best score for each user
      const bestScoresByUser = new Map()

      allScoresData.forEach((score) => {
        // Skip anonymous scores (no user_id)
        if (!score.user_id) return

        const existingBest = bestScoresByUser.get(score.user_id)

        // If no existing score or this score is better
        if (
          !existingBest ||
          score.percentage > existingBest.percentage ||
          (score.percentage === existingBest.percentage && score.time_taken < existingBest.time_taken)
        ) {
          bestScoresByUser.set(score.user_id, score)
        }
      })

      // Convert map to array and sort
      const bestScores = Array.from(bestScoresByUser.values()).sort((a, b) => {
        // Sort by percentage (descending)
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage
        }
        // If percentage is the same, sort by time (ascending)
        return a.time_taken - b.time_taken
      })

      console.log("Best scores by user:", bestScores)

      // Get user IDs for profile fetching
      const userIds = bestScores.map((score) => score.user_id)

      // Fetch profiles for all users
      let profiles = []
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds)

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
        } else {
          profiles = profilesData || []
          console.log("Profiles data:", profiles)
        }
      }

      // Combine best scores with profiles
      const leaderboard = bestScores.map((score, index) => {
        const userProfile = profiles.find((p) => p.id === score.user_id)
        return {
          ...score,
          profile: userProfile || null,
          rank: index + 1,
        }
      })

      // Take only top 50
      setLeaderboardData(leaderboard.slice(0, 50))

      // Find the current user's best score and rank
      if (profile?.id) {
        const userScore = leaderboard.find((score) => score.user_id === profile.id)
        if (userScore) {
          setUserBestScore(userScore)
        } else {
          setUserBestScore(null)
        }
      }
    } catch (err: any) {
      console.error("Error fetching leaderboard:", err)
      setError(err.message || "Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex justify-between items-center">
            <span>Quiz Leaderboard</span>
            <Button variant="outline" size="sm" onClick={fetchLeaderboard} disabled={loading}>
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User's best score */}
          {userBestScore && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/30">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Your Best Score</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold">
                    #{userBestScore.rank}
                  </div>
                  <div>
                    <div className="font-medium">You</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(userBestScore.time_taken)}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold">{userBestScore.percentage}%</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-400">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchLeaderboard}>
                Try Again
              </Button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No scores recorded for this quiz yet.</div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((score) => (
                <div
                  key={`${score.user_id}-${score.id}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    score.user_id === profile?.id ? "bg-slate-700/70 border border-purple-500/30" : "bg-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8">
                      <div className="bg-slate-600 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {score.rank <= 3 ? getMedalIcon(score.rank) : score.rank}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={score.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {score.profile?.display_name?.charAt(0) || score.profile?.username?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {score.profile?.display_name || score.profile?.username || "User"}
                          {score.user_id === profile?.id && " (You)"}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(score.time_taken)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold">{score.percentage}%</div>
                </div>
              ))}
            </div>
          )}

          {/* Debug info for development */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-gray-400">Debug Info</summary>
              <pre className="mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-40">
                {JSON.stringify(
                  {
                    totalScores: allScores?.length || 0,
                    uniqueUsers: leaderboardData.length,
                    currentUserId: profile?.id,
                    userBestScore: userBestScore,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
