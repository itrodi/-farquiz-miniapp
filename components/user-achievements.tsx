"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserAchievementsProps {
  userId: string
}

export function UserAchievements({ userId }: UserAchievementsProps) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAchievements() {
      try {
        // First get all achievements
        const { data: allAchievements, error: achievementsError } = await supabase
          .from("achievements")
          .select("*")
          .order("id")

        if (achievementsError) throw achievementsError

        // Then get user's achievements
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", userId)

        if (userAchievementsError) throw userAchievementsError

        // Combine the data
        const combinedAchievements = allAchievements.map((achievement) => {
          const userAchievement = userAchievements.find((ua) => ua.achievement_id === achievement.id)
          return {
            ...achievement,
            progress: userAchievement?.progress || 0,
            max_progress: userAchievement?.max_progress || 100,
            unlocked: userAchievement?.unlocked || false,
            progressText: userAchievement ? `${userAchievement.progress}%` : "0%",
          }
        })

        setAchievements(combinedAchievements)
      } catch (error) {
        console.error("Error fetching achievements:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchAchievements()
    }
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800 rounded-lg overflow-hidden animate-pulse">
            <div className="h-16 bg-slate-700"></div>
            <div className="p-3">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-2 bg-slate-700 rounded w-full mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No achievements available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {achievements.map((achievement) => (
        <Card
          key={achievement.id}
          className={`bg-slate-800 border-slate-700 overflow-hidden ${achievement.unlocked ? "" : "opacity-60"}`}
        >
          <div className="h-16 flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600">
            <span className="text-3xl">{achievement.emoji}</span>
          </div>
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-sm">{achievement.name}</h3>
              {achievement.unlocked ? (
                <Badge variant="default" className="bg-green-600 text-[10px]">
                  Unlocked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{achievement.description}</p>
            <div className="mt-2">
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${achievement.progress}%` }}></div>
              </div>
              <div className="text-xs text-slate-400 text-right">{achievement.progressText}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
