"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Types for leaderboard data
type LeaderboardUser = {
  id: string
  username?: string
  display_name?: string
  avatar_url?: string
  total_score?: number
  quizzes_taken?: number
  achievement_count?: number
  challenge_points?: number
}

export default function LeaderboardClient() {
  // State for each leaderboard type
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardUser[]>([])
  const [challengeLeaderboard, setChallengeLeaderboard] = useState<LeaderboardUser[]>([])
  const [achievementLeaderboard, setAchievementLeaderboard] = useState<LeaderboardUser[]>([])

  // Loading states
  const [globalLoading, setGlobalLoading] = useState(true)
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  const [challengeLoading, setChallengeLoading] = useState(true)
  const [achievementLoading, setAchievementLoading] = useState(true)

  // Error states
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [weeklyError, setWeeklyError] = useState<string | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [achievementError, setAchievementError] = useState<string | null>(null)

  // Active tab state
  const [activeTab, setActiveTab] = useState("global")

  // Fetch global leaderboard data
  useEffect(() => {
    async function fetchGlobalLeaderboard() {
      try {
        setGlobalLoading(true)
        setGlobalError(null)

        // Use placeholder data for now to avoid rate limiting
        const placeholderData = [
          { id: "1", display_name: "User 1", total_score: 1250, quizzes_taken: 42 },
          { id: "2", display_name: "User 2", total_score: 1100, quizzes_taken: 38 },
          { id: "3", display_name: "User 3", total_score: 950, quizzes_taken: 35 },
          { id: "4", display_name: "User 4", total_score: 820, quizzes_taken: 30 },
          { id: "5", display_name: "User 5", total_score: 780, quizzes_taken: 28 },
        ]

        setGlobalLeaderboard(placeholderData)
      } catch (error) {
        console.error("Error fetching global leaderboard:", error)
        setGlobalError("Failed to load global leaderboard data")
      } finally {
        setGlobalLoading(false)
      }
    }

    fetchGlobalLeaderboard()
  }, [])

  // Fetch weekly leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "weekly" && weeklyLeaderboard.length === 0) {
      async function fetchWeeklyLeaderboard() {
        try {
          setWeeklyLoading(true)
          setWeeklyError(null)

          // Use placeholder data for now to avoid rate limiting
          const placeholderData = [
            { id: "1", display_name: "User 1", total_score: 450, quizzes_taken: 15 },
            { id: "2", display_name: "User 3", total_score: 380, quizzes_taken: 12 },
            { id: "3", display_name: "User 7", total_score: 320, quizzes_taken: 10 },
            { id: "4", display_name: "User 2", total_score: 290, quizzes_taken: 9 },
            { id: "5", display_name: "User 9", total_score: 240, quizzes_taken: 8 },
          ]

          setWeeklyLeaderboard(placeholderData)
        } catch (error) {
          console.error("Error fetching weekly leaderboard:", error)
          setWeeklyError("Failed to load weekly leaderboard data")
        } finally {
          setWeeklyLoading(false)
        }
      }

      fetchWeeklyLeaderboard()
    }
  }, [activeTab, weeklyLeaderboard])

  // Fetch challenge leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "challenges" && challengeLeaderboard.length === 0) {
      async function fetchChallengeLeaderboard() {
        try {
          setChallengeLoading(true)
          setChallengeError(null)

          // Use placeholder data for now to avoid rate limiting
          const placeholderData = [
            { id: "1", display_name: "User 5", challenge_points: 27 },
            { id: "2", display_name: "User 2", challenge_points: 24 },
            { id: "3", display_name: "User 8", challenge_points: 21 },
            { id: "4", display_name: "User 1", challenge_points: 18 },
            { id: "5", display_name: "User 4", challenge_points: 15 },
          ]

          setChallengeLeaderboard(placeholderData)
        } catch (error) {
          console.error("Error fetching challenge leaderboard:", error)
          setChallengeError("Failed to load challenge leaderboard data")
        } finally {
          setChallengeLoading(false)
        }
      }

      fetchChallengeLeaderboard()
    }
  }, [activeTab, challengeLeaderboard])

  // Fetch achievement leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "achievements" && achievementLeaderboard.length === 0) {
      async function fetchAchievementLeaderboard() {
        try {
          setAchievementLoading(true)
          setAchievementError(null)

          // Use placeholder data for now to avoid rate limiting
          const placeholderData = [
            { id: "1", display_name: "User 3", achievement_count: 12 },
            { id: "2", display_name: "User 7", achievement_count: 10 },
            { id: "3", display_name: "User 1", achievement_count: 8 },
            { id: "4", display_name: "User 9", achievement_count: 7 },
            { id: "5", display_name: "User 4", achievement_count: 6 },
          ]

          setAchievementLeaderboard(placeholderData)
        } catch (error) {
          console.error("Error fetching achievement leaderboard:", error)
          setAchievementError("Failed to load achievement leaderboard data")
        } finally {
          setAchievementLoading(false)
        }
      }

      fetchAchievementLeaderboard()
    }
  }, [activeTab, achievementLeaderboard])

  // Render a leaderboard entry
  const renderLeaderboardEntry = (user: any, index: number, type: string) => {
    return (
      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg mb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 md:w-8 text-center font-bold text-gray-400">{index + 1}</div>
          <Avatar className="h-8 w-8 md:h-10 md:w-10">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-sm md:text-base">
              {user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-full">
              {user.display_name || user.username || "Anonymous"}
            </div>
            {type === "global" || type === "weekly" ? (
              <div className="text-xs md:text-sm text-gray-400 hidden md:block">{user.quizzes_taken} quizzes taken</div>
            ) : null}
          </div>
        </div>
        <div className="font-bold text-base md:text-xl whitespace-nowrap">
          {type === "global" || type === "weekly"
            ? user.total_score
            : type === "challenges"
              ? `${user.challenge_points}`
              : `${user.achievement_count}`}
          {type === "challenges" && (
            <span className="text-xs md:text-sm font-normal ml-1 hidden md:inline">points</span>
          )}
          {type === "achievements" && (
            <span className="text-xs md:text-sm font-normal ml-1 hidden md:inline">achievements</span>
          )}
        </div>
      </div>
    )
  }

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-6 md:w-8 text-center font-bold text-gray-400">{i + 1}</div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-600 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-600 rounded animate-pulse w-20 md:w-24"></div>
              <div className="h-3 bg-slate-600 rounded animate-pulse w-24 md:w-32 hidden md:block"></div>
            </div>
          </div>
          <div className="h-6 w-10 md:w-12 bg-slate-600 rounded animate-pulse"></div>
        </div>
      ))
  }

  return (
    <>
      <Alert className="mb-4 md:mb-6 bg-amber-900/20 border-amber-700 text-amber-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Temporary Leaderboard Data</AlertTitle>
        <AlertDescription>
          We're currently showing placeholder data while we optimize our leaderboard system. Real data will be available
          soon.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="global" className="mb-6 md:mb-8" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4 md:mb-6 w-full">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {globalError && <div className="text-center py-4 text-red-400">{globalError}</div>}

              {globalLoading ? (
                renderLoadingSkeleton()
              ) : (
                <>
                  {globalLeaderboard.map((user, index) => renderLeaderboardEntry(user, index, "global"))}

                  {(!globalLeaderboard || globalLeaderboard.length === 0) && !globalLoading && (
                    <div className="text-center py-6 md:py-8 text-gray-400">No data available yet</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Weekly Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {weeklyError && <div className="text-center py-4 text-red-400">{weeklyError}</div>}

              {weeklyLoading ? (
                renderLoadingSkeleton()
              ) : (
                <>
                  {weeklyLeaderboard.map((user, index) => renderLeaderboardEntry(user, index, "weekly"))}

                  {(!weeklyLeaderboard || weeklyLeaderboard.length === 0) && !weeklyLoading && (
                    <div className="text-center py-6 md:py-8 text-gray-400">No data available for this week yet</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Challenge Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {challengeError && <div className="text-center py-4 text-red-400">{challengeError}</div>}

              {challengeLoading ? (
                renderLoadingSkeleton()
              ) : (
                <>
                  {challengeLeaderboard.map((user, index) => renderLeaderboardEntry(user, index, "challenges"))}

                  {(!challengeLeaderboard || challengeLeaderboard.length === 0) && !challengeLoading && (
                    <div className="text-center py-6 md:py-8 text-gray-400">No challenge data available yet</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Achievement Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {achievementError && <div className="text-center py-4 text-red-400">{achievementError}</div>}

              {achievementLoading ? (
                renderLoadingSkeleton()
              ) : (
                <>
                  {achievementLeaderboard.map((user, index) => renderLeaderboardEntry(user, index, "achievements"))}

                  {(!achievementLeaderboard || achievementLeaderboard.length === 0) && !achievementLoading && (
                    <div className="text-center py-6 md:py-8 text-gray-400">No achievements unlocked yet</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-lg md:text-xl">Weekly Challenge</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 md:px-6 md:py-4">
            <div className="text-center py-3 md:py-4">
              <p className="mb-3 md:mb-4 text-sm md:text-base">Complete 5 quizzes this week to earn bonus points!</p>
              <div className="w-full bg-slate-700 h-3 md:h-4 rounded-full overflow-hidden mb-2">
                <div className="bg-green-500 h-full" style={{ width: "40%" }}></div>
              </div>
              <p className="text-xs md:text-sm text-gray-400">2 of 5 quizzes completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-lg md:text-xl">Your Rank</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 md:px-6 md:py-4">
            <div className="text-center py-3 md:py-4">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                #5 <span className="text-xs md:text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <p className="text-xs md:text-sm text-slate-400">Keep playing to improve your rank!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
