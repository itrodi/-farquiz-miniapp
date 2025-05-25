"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, BarChart2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface QuizGridProps {
  filter?: string
  category?: string | null
  searchQuery?: string
}

export function QuizGrid({ filter = "all", category = null, searchQuery = "" }: QuizGridProps) {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true)
      try {
        let query = supabase
          .from("quizzes")
          .select(`
            *,
            categories(id, name, emoji)
          `)
          .eq("is_published", true)

        // Apply category filter
        if (category) {
          query = query.eq("category_id", category)
        }

        // Apply sorting based on filter
        if (filter === "popular") {
          query = query.order("plays", { ascending: false })
        } else if (filter === "new") {
          query = query.order("created_at", { ascending: false })
        }

        // Apply search query if provided
        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`)
        }

        // Limit results
        query = query.limit(20)

        const { data, error } = await query

        if (error) throw error
        setQuizzes(data || [])
      } catch (error) {
        console.error("Error fetching quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [supabase, filter, category, searchQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-800 border-slate-700 overflow-hidden">
            <div className="flex h-24 animate-pulse">
              <div className="w-20 bg-slate-700"></div>
              <div className="flex-grow p-3">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="mb-2">No quizzes found</p>
        <p className="text-sm">Try a different category or search term</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="bg-slate-800 border-slate-700 overflow-hidden">
          <Link href={`/quiz/preview/${quiz.id}`} className="flex hover:bg-slate-750 transition-colors">
            <div className="w-20 h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-2xl">{quiz.emoji}</span>
            </div>
            <CardContent className="p-3 flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold line-clamp-1">{quiz.title}</h3>
                <div className="flex gap-1">
                  {quiz.categories && (
                    <Badge variant="outline" className="shrink-0">
                      {quiz.categories.name}
                    </Badge>
                  )}
                  {quiz.difficulty && (
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {quiz.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2 line-clamp-2">{quiz.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex text-xs text-slate-500">
                  <div className="flex items-center mr-3">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{quiz.time_limit}s</span>
                  </div>
                  <div className="flex items-center mr-3">
                    <Users className="mr-1 h-3 w-3" />
                    <span>{quiz.plays} plays</span>
                  </div>
                  {quiz.quiz_type && quiz.quiz_type !== "standard" && (
                    <div className="flex items-center">
                      <BarChart2 className="mr-1 h-3 w-3" />
                      <span className="capitalize">{quiz.quiz_type.replace(/-/g, " ")}</span>
                    </div>
                  )}
                </div>
                <Link href={`/quiz/preview/${quiz.id}`}>
                  <Button size="sm">View Quiz</Button>
                </Link>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
}
