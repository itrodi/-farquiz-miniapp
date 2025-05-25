"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Award, Plus, Search, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchAchievements()
  }, [])

  async function fetchAchievements() {
    setIsLoading(true)
    try {
      let query = supabase.from("achievements").select("*").order("id", { ascending: true })

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setAchievements(data || [])
    } catch (error) {
      console.error("Error fetching achievements:", error)
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAchievements()
  }

  const handleDeleteAchievement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return

    try {
      // First check if any users have this achievement
      const { count, error: countError } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("achievement_id", id)

      if (countError) throw countError

      if (count && count > 0) {
        if (!confirm(`This achievement is earned by ${count} users. Are you sure you want to delete it?`)) return

        // Delete user achievements first
        const { error: userAchievementsError } = await supabase
          .from("user_achievements")
          .delete()
          .eq("achievement_id", id)

        if (userAchievementsError) throw userAchievementsError
      }

      // Then delete the achievement
      const { error: achievementError } = await supabase.from("achievements").delete().eq("id", id)

      if (achievementError) throw achievementError

      toast({
        title: "Achievement deleted",
        description: "The achievement has been successfully deleted",
      })

      // Refresh the list
      fetchAchievements()
    } catch (error) {
      console.error("Error deleting achievement:", error)
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <Button asChild>
          <Link href="/admin/achievements/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Achievement
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-0">
                <div className="h-24 animate-pulse bg-slate-700"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <Award className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No achievements found</h3>
          <p className="text-slate-400 mb-6">Get started by creating your first achievement</p>
          <Button asChild>
            <Link href="/admin/achievements/create">Create Achievement</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-16 h-16 sm:h-auto bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center">
                    <span className="text-2xl">{achievement.emoji || "🏆"}</span>
                  </div>
                  <div className="p-4 flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold">{achievement.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Badge variant="outline">ID: {achievement.id}</Badge>
                          <span>•</span>
                          <span>Created: {new Date(achievement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/achievements/edit/${achievement.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAchievement(achievement.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{achievement.description}</p>
                    {achievement.criteria && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {achievement.criteria.type}: {achievement.criteria.count || achievement.criteria.value || ""}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
