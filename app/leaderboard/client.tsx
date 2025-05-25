"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-kit-context"

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
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([])

  // Loading states
  const [globalLoading, setGlobalLoading] = useState(true)
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  const [challengeLoading, setChallengeLoading] = useState(true)
  const [achievementLoading, setAchievementLoading] = useState(true)
  const [friendsLoading, setFriendsLoading] = useState(true)

  // Error states
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [weeklyError, setWeeklyError] = useState<string | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [achievementError, setAchievementError] = useState<string | null>(null)
  const [friendsError, setFriendsError] = useState<string | null>(null)

  // Active tab state
  const [activeTab, setActiveTab] = useState("global")

  // User state
  const [userRank, setUserRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const { user } = useAuth()

  // Fetch global leaderboard data
  useEffect(() => {
    async function fetchGlobalLeaderboard() {
      try {
        setGlobalLoading(true)
        setGlobalError(null)

        const supabase = createClient()

        // Fetch top users by total score
        const { data, error, count } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, total_score, quizzes_taken", { count: "exact" })
          .order("total_score", { ascending: false })
          .limit(20)

        if (error) {
          console.error("Error fetching global leaderboard:", error)
          setGlobalError("Failed to load global leaderboard data")
          setGlobalLoading(false)
          return
        }

        setGlobalLeaderboard(data || [])
        setTotalUsers(count || 0)

        // If user is logged in, find their rank
        if (user?.id) {
          const { data: rankData, error: rankError } = await supabase.rpc("get_user_rank", { user_id: user.id })

          if (rankError) {
            console.error("Error fetching user rank:", rankError)
          } else if (rankData) {
            setUserRank(rankData)
          }
        }
      } catch (error) {
        console.error("Error fetching global leaderboard:", error)
        setGlobalError("Failed to load global leaderboard data")
      } finally {
        setGlobalLoading(false)
      }
    }

    fetchGlobalLeaderboard()
  }, [user?.id])

  // Fetch weekly leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "weekly") {
      async function fetchWeeklyLeaderboard() {
        try {
          setWeeklyLoading(true)
          setWeeklyError(null)

          const supabase = createClient()

          // Get the date from 7 days ago
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

          // Fetch scores from the last week
          const { data, error } = await supabase
            .from("scores")
            .select("user_id, score, created_at, profiles(id, username, display_name, avatar_url)")
            .gte("created_at", oneWeekAgo.toISOString())
            .order("score", { ascending: false })

          if (error) {
            console.error("Error fetching weekly leaderboard:", error)
            setWeeklyError("Failed to load weekly leaderboard data")
            setWeeklyLoading(false)
            return
          }

          // Aggregate scores by user
          const userScores: Record<
            string,
            {
              id: string
              username?: string
              display_name?: string
              avatar_url?: string
              total_score: number
              quizzes_taken: number
            }
          > = {}

          data?.forEach((score) => {
            const userId = score.user_id
            const profile = score.profiles as any

            if (!userScores[userId]) {
              userScores[userId] = {
                id: userId,
                username: profile?.username,
                display_name: profile?.display_name,
                avatar_url: profile?.avatar_url,
                total_score: 0,
                quizzes_taken: 0,
              }
            }

            userScores[userId].total_score += score.score
            userScores[userId].quizzes_taken += 1
          })

          // Convert to array and sort
          const weeklyData = Object.values(userScores)
            .sort((a, b) => b.total_score - a.total_score)
            .slice(0, 20)

          setWeeklyLeaderboard(weeklyData)
        } catch (error) {
          console.error("Error fetching weekly leaderboard:", error)
          setWeeklyError("Failed to load weekly leaderboard data")
        } finally {
          setWeeklyLoading(false)
        }
      }

      fetchWeeklyLeaderboard()
    }
  }, [activeTab])

  // Fetch challenge leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "challenges") {
      async function fetchChallengeLeaderboard() {
        try {
          setChallengeLoading(true)
          setChallengeError(null)

          const supabase = createClient()

          // Fetch completed challenges
          const { data, error } = await supabase
            .from("challenges")
            .select(`
              id, 
              challenger_id, 
              recipient_id, 
              challenger_score, 
              recipient_score,
              challenger:profiles!challenger_id(id, username, display_name, avatar_url),
              recipient:profiles!recipient_id(id, username, display_name, avatar_url)
            `)
            .eq("status", "completed")

          if (error) {
            console.error("Error fetching challenge leaderboard:", error)
            setChallengeError("Failed to load challenge leaderboard data")
            setChallengeLoading(false)
            return
          }

          // Calculate challenge points (3 for win, 1 for draw, 0 for loss)
          const userPoints: Record<
            string,
            {
              id: string
              username?: string
              display_name?: string
              avatar_url?: string
              challenge_points: number
              challenges_completed: number
            }
          > = {}

          data?.forEach((challenge) => {
            // Process challenger
            const challengerId = challenge.challenger_id
            const challenger = challenge.challenger as any

            if (!userPoints[challengerId]) {
              userPoints[challengerId] = {
                id: challengerId,
                username: challenger?.username,
                display_name: challenger?.display_name,
                avatar_url: challenger?.avatar_url,
                challenge_points: 0,
                challenges_completed: 0,
              }
            }

            // Process recipient
            const recipientId = challenge.recipient_id
            const recipient = challenge.recipient as any

            if (!userPoints[recipientId]) {
              userPoints[recipientId] = {
                id: recipientId,
                username: recipient?.username,
                display_name: recipient?.display_name,
                avatar_url: recipient?.avatar_url,
                challenge_points: 0,
                challenges_completed: 0,
              }
            }

            // Award points
            userPoints[challengerId].challenges_completed += 1
            userPoints[recipientId].challenges_completed += 1

            if (challenge.challenger_score > challenge.recipient_score) {
              // Challenger wins
              userPoints[challengerId].challenge_points += 3
            } else if (challenge.challenger_score < challenge.recipient_score) {
              // Recipient wins
              userPoints[recipientId].challenge_points += 3
            } else {
              // Draw
              userPoints[challengerId].challenge_points += 1
              userPoints[recipientId].challenge_points += 1
            }
          })

          // Convert to array and sort
          const challengeData = Object.values(userPoints)
            .sort((a, b) => b.challenge_points - a.challenge_points)
            .slice(0, 20)

          setChallengeLeaderboard(challengeData)
        } catch (error) {
          console.error("Error fetching challenge leaderboard:", error)
          setChallengeError("Failed to load challenge leaderboard data")
        } finally {
          setChallengeLoading(false)
        }
      }

      fetchChallengeLeaderboard()
    }
  }, [activeTab])

  // Fetch achievement leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "achievements") {
      async function fetchAchievementLeaderboard() {
        try {
          setAchievementLoading(true)
          setAchievementError(null)

          const supabase = createClient()

          // Fetch user achievements
          const { data, error } = await supabase.from("user_achievements").select(`
              user_id,
              profiles(id, username, display_name, avatar_url)
            `)

          if (error) {
            console.error("Error fetching achievement leaderboard:", error)
            setAchievementError("Failed to load achievement leaderboard data")
            setAchievementLoading(false)
            return
          }

          // Count achievements by user
          const userAchievements: Record<
            string,
            {
              id: string
              username?: string
              display_name?: string
              avatar_url?: string
              achievement_count: number
            }
          > = {}

          data?.forEach((achievement) => {
            const userId = achievement.user_id
            const profile = achievement.profiles as any

            if (!userAchievements[userId]) {
              userAchievements[userId] = {
                id: userId,
                username: profile?.username,
                display_name: profile?.display_name,
                avatar_url: profile?.avatar_url,
                achievement_count: 0,
              }
            }

            userAchievements[userId].achievement_count += 1
          })

          // Convert to array and sort
          const achievementData = Object.values(userAchievements)
            .sort((a, b) => b.achievement_count - a.achievement_count)
            .slice(0, 20)

          setAchievementLeaderboard(achievementData)
        } catch (error) {
          console.error("Error fetching achievement leaderboard:", error)
          setAchievementError("Failed to load achievement leaderboard data")
        } finally {
          setAchievementLoading(false)
        }
      }

      fetchAchievementLeaderboard()
    }
  }, [activeTab])

  // Fetch friends leaderboard data when that tab is selected
  useEffect(() => {
    if (activeTab === "friends" && user?.id) {
      async function fetchFriendsLeaderboard() {
        try {
          setFriendsLoading(true)
          setFriendsError(null)

          const supabase = createClient()

          // Fetch user's friends
          const { data: friendsData, error: friendsError } = await supabase
            .from("friends")
            .select("sender_id, recipient_id")
            .eq("status", "accepted")
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

          if (friendsError) {
            console.error("Error fetching friends:", friendsError)
            setFriendsError("Failed to load friends leaderboard data")
            setFriendsLoading(false)
            return
          }

          // Extract friend IDs
          const friendIds =
            friendsData?.map((friend) => (friend.sender_id === user.id ? friend.recipient_id : friend.sender_id)) || []

          // Add current user to the list
          friendIds.push(user.id)

          // Fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, total_score, quizzes_taken")
            .in("id", friendIds)
            .order("total_score", { ascending: false })

          if (profilesError) {
            console.error("Error fetching friend profiles:", profilesError)
            setFriendsError("Failed to load friends leaderboard data")
            setFriendsLoading(false)
            return
          }

          setFriendsLeaderboard(profilesData || [])
        } catch (error) {
          console.error("Error fetching friends leaderboard:", error)
          setFriendsError("Failed to load friends leaderboard data")
        } finally {
          setFriendsLoading(false)
        }
      }

      fetchFriendsLeaderboard()
    }
  }, [activeTab, user?.id])

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
            {(type === "global" || type === "weekly" || type === "friends") && (
              <div className="text-xs md:text-sm text-gray-400 hidden md:block">
                {user.quizzes_taken || 0} quizzes taken
              </div>
            )}
          </div>
        </div>
        <div className="font-bold text-base md:text-xl whitespace-nowrap">
          {type === "global" || type === "weekly" || type === "friends"
            ? user.total_score || 0
            : type === "challenges"
              ? `${user.challenge_points || 0}`
              : `${user.achievement_count || 0}`}
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
      <Tabs defaultValue="global" className="mb-8" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8 w-full">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="friends" disabled={!user?.id}>
            Friends
          </TabsTrigger>
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

        <TabsContent value="friends">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-lg md:text-xl">Friends Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              {friendsError && <div className="text-center py-4 text-red-400">{friendsError}</div>}

              {friendsLoading ? (
                renderLoadingSkeleton()
              ) : (
                <>
                  {friendsLeaderboard.map((user, index) => renderLeaderboardEntry(user, index, "friends"))}

                  {(!friendsLeaderboard || friendsLeaderboard.length === 0) && !friendsLoading && (
                    <div className="text-center py-6 md:py-8 text-gray-400">
                      {user?.id ? "No friends added yet" : "Please sign in to view your friends leaderboard"}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-lg md:text-xl">Weekly Challenge</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 md:px-6 md:py-4">
            <div className="text-center py-4">
              <p className="mb-4 text-base">Complete 5 quizzes this week to earn bonus points!</p>
              <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden mb-2">
                <div className="bg-green-500 h-full" style={{ width: "40%" }}></div>
              </div>
              <p className="text-sm text-gray-400">2 of 5 quizzes completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-lg md:text-xl">Your Rank</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 md:px-6 md:py-4">
            <div className="text-center py-4">
              {user?.id ? (
                <>
                  <div className="text-4xl font-bold mb-2">
                    #{userRank || "?"} <span className="text-sm font-normal text-slate-400">/ {totalUsers || "?"}</span>
                  </div>
                  <p className="text-sm text-slate-400">Keep playing to improve your rank!</p>
                </>
              ) : (
                <p className="text-base text-slate-400">Sign in to see your rank</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
