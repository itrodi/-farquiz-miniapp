'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/database.types'

interface QuizWithDetails extends Tables<"quizzes"> {
  categories: Tables<"categories"> | null
  questions: Tables<"questions">[]
}

export default function QuizSharePage() {
  const params = useParams()
  const [quiz, setQuiz] = useState<QuizWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchQuiz() {
      try {
        // Get the quiz with category and questions
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(name, emoji),
            questions(*)
          `)
          .eq("id", params.id)
          .single()

        if (quizError) throw quizError
        setQuiz(quizData)
      } catch (error) {
        console.error('Error fetching quiz:', error)
      } finally {
        setLoading(false)
        sdk.actions.ready()
      }
    }

    if (params.id) {
      fetchQuiz()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Quiz not found</h1>
      </div>
    )
  }

  const estimatedTime = `${quiz.time_limit} minutes`

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {quiz.emoji && <span className="text-2xl">{quiz.emoji}</span>}
      </div>
      <div className="flex flex-col gap-2 text-lg">
        <p>Category: {quiz.categories?.name || 'General'} {quiz.categories?.emoji}</p>
        <p>Difficulty: {quiz.difficulty || 'Mixed'}</p>
        <p>Time to complete: {estimatedTime}</p>
        <p>{quiz.questions.length} Questions</p>
      </div>
      <button 
        onClick={() => sdk.actions.openUrl('https://warpcast.com/~/compose')}
        className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
      >
        Share on Farcaster
      </button>
    </div>
  )
} 