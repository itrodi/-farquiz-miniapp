"use client"

import { Clock, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function TrendingQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTrendingQuizzes() {
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
        console.error("Error fetching trending quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingQuizzes()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0"></div>
            <div className="flex-grow">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400">No trending quizzes available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz, index) => (
        <Link
          key={quiz.id}
          href={`/quiz/preview/${quiz.id}`}
          className="flex items-start gap-3 hover:bg-slate-700 p-2 rounded-md"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 font-bold text-sm shrink-0">
            {index + 1}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{quiz.title}</h3>
            <div className="flex text-xs text-slate-400 mt-1">
              <div className="flex items-center mr-3">
                <Clock className="mr-1 h-3 w-3" />
                <span>{quiz.time_limit}s</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                <span>{quiz.plays} plays</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
