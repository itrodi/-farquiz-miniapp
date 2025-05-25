"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function FeaturedQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchFeaturedQuizzes() {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(id, name, emoji)
          `)
          .eq("is_published", true)
          .order("plays", { ascending: false })
          .limit(5)

        if (error) throw error
        setQuizzes(data || [])
      } catch (error) {
        console.error("Error fetching featured quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedQuizzes()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-3 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex-shrink-0 w-60 bg-slate-800 border-slate-700 animate-pulse">
            <div className="h-24 bg-slate-700"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-slate-400">No featured quizzes available</p>
      </div>
    )
  }

  return (
    <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-3 scrollbar-hide">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="flex-shrink-0 w-60 bg-slate-800 border-slate-700">
          <div className="h-24 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-4xl">{quiz.emoji}</span>
          </div>
          <CardContent className="p-3">
            <h3 className="font-bold mb-1 line-clamp-1">{quiz.title}</h3>
            <p className="text-xs text-slate-400 mb-2 line-clamp-2">{quiz.description}</p>
            <div className="flex justify-between text-xs text-slate-500 mb-3">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>{quiz.time_limit}s</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                <span>{quiz.plays} plays</span>
              </div>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href={`/quiz/${quiz.id}`}>Play</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
