"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Plus, Search, Trash2, Edit, Eye, Upload } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  async function fetchQuizzes() {
    setIsLoading(true)
    try {
      let query = supabase
        .from("quizzes")
        .select(`
          *,
          categories(name, emoji),
          profiles(username, display_name)
        `)
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setQuizzes(data || [])
    } catch (error) {
      console.error("Error fetching quizzes:", error)
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchQuizzes()
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return

    try {
      // First delete questions
      const { error: questionsError } = await supabase.from("questions").delete().eq("quiz_id", id)
      if (questionsError) throw questionsError

      // Then delete the quiz
      const { error: quizError } = await supabase.from("quizzes").delete().eq("id", id)
      if (quizError) throw quizError

      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted",
      })

      // Refresh the list
      fetchQuizzes()
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild>
            <Link href="/admin/quizzes/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/quizzes/import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search quizzes..."
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
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
          <p className="text-slate-400 mb-6">Get started by creating your first quiz</p>
          <Button asChild>
            <Link href="/admin/quizzes/create">Create Quiz</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-16 h-16 sm:h-auto bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl">{quiz.emoji || "🎮"}</span>
                  </div>
                  <div className="p-4 flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold">{quiz.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>
                            {quiz.categories?.name ? (
                              <Badge variant="outline">{quiz.categories.name}</Badge>
                            ) : (
                              "Uncategorized"
                            )}
                          </span>
                          <span>•</span>
                          <span>{quiz.time_limit}s</span>
                          <span>•</span>
                          <span>{quiz.plays} plays</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/quiz/${quiz.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/quizzes/edit/${quiz.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{quiz.description}</p>
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
