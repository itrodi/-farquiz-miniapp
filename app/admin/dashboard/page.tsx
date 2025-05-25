"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Award, BarChart3, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    totalPlays: 0,
    totalAchievements: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      try {
        // Fetch quiz count
        const { count: quizCount, error: quizError } = await supabase
          .from("quizzes")
          .select("*", { count: "exact", head: true })

        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })

        // Fetch total plays
        const { data: playsData, error: playsError } = await supabase.from("quizzes").select("plays")

        const totalPlays = playsData?.reduce((sum, quiz) => sum + (quiz.plays || 0), 0) || 0

        // Fetch achievement count
        const { count: achievementCount, error: achievementError } = await supabase
          .from("achievements")
          .select("*", { count: "exact", head: true })

        setStats({
          totalQuizzes: quizCount || 0,
          totalUsers: userCount || 0,
          totalPlays: totalPlays,
          totalAchievements: achievementCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/quizzes/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Quizzes</p>
                <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : stats.totalQuizzes}</h3>
              </div>
              <div className="bg-purple-500/20 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : stats.totalUsers}</h3>
              </div>
              <div className="bg-blue-500/20 p-2 rounded-full">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Plays</p>
                <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : stats.totalPlays}</h3>
              </div>
              <div className="bg-green-500/20 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Achievements</p>
                <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : stats.totalAchievements}</h3>
              </div>
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/quizzes">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Quizzes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/achievements">
                <Award className="mr-2 h-4 w-4" />
                Manage Achievements
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/quizzes/import">
                <Plus className="mr-2 h-4 w-4" />
                Import Quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">No recent activity to display.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
