"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserQuizzesProps {
  userId: string
}

export function UserQuizzes({ userId }: UserQuizzesProps) {
  const [takenQuizzes, setTakenQuizzes] = useState<any[]>([])
  const [createdQuizzes, setCreatedQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadQuizzes() {
      setLoading(true)
      try {
        // Load quizzes taken by the user
        const { data: scores, error: scoresError } = await supabase
          .from("user_scores")
          .select(`
            *,
            quiz:quizzes(id, title, description, emoji, plays)
          `)
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })

        if (scoresError) throw scoresError

        // Load quizzes created by the user
        const { data: createdQuizzesData, error: createdError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("creator_id", userId)
          .order("created_at", { ascending: false })

        if (createdError) throw createdError

        // Format the data
        const taken = scores.map((score: any) => ({
          id: score.quiz.id,
          title: score.quiz.title,
          description: score.quiz.description,
          score: score.percentage,
          date: new Date(score.completed_at).toLocaleDateString(),
          plays: score.quiz.plays,
        }))

        const created = createdQuizzesData.map((quiz: any) => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          status: quiz.is_published ? "Published" : "Draft",
          date: new Date(quiz.created_at).toLocaleDateString(),
          plays: quiz.plays,
        }))

        setTakenQuizzes(taken)
        setCreatedQuizzes(created)
      } catch (error) {
        console.error("Error loading quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadQuizzes()
    }
  }, [userId, supabase])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <Tabs defaultValue="taken">
      <TabsList className="grid grid-cols-2 mb-4 bg-slate-800">
        <TabsTrigger value="taken">Taken</TabsTrigger>
        <TabsTrigger value="created">Created</TabsTrigger>
      </TabsList>

      <TabsContent value="taken">
        <div className="space-y-3">
          {takenQuizzes.length > 0 ? (
            takenQuizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm">{quiz.title}</h3>
                    <Badge>{quiz.score}%</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex text-xs text-slate-500">
                      <div className="flex items-center mr-3">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{quiz.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        <span>{quiz.plays} plays</span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/quiz/${quiz.id}`}>Play Again</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>You haven't taken any quizzes yet</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/explore">Explore Quizzes</Link>
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="created">
        <div className="space-y-3">
          {createdQuizzes.length > 0 ? (
            createdQuizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm">{quiz.title}</h3>
                    <Badge variant="outline">{quiz.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex text-xs text-slate-500">
                      <div className="flex items-center mr-3">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{quiz.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        <span>{quiz.plays} plays</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/quiz/${quiz.id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/create?edit=${quiz.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>You haven't created any quizzes yet</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/create">Create Quiz</Link>
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
