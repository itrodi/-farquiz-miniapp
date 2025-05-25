"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizResults } from "@/components/quiz-results"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { shuffleArray } from "@/lib/array-utils"
import { Badge } from "@/components/ui/badge"
import type { Tables } from "@/lib/supabase/database.types"

type QuizProps = {
  quiz: Tables<"quizzes"> & {
    categories: Tables<"categories"> | null
    profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null
  }
  questions: Tables<"questions">[]
}

export function ListQuiz({ quiz, questions: originalQuestions }: QuizProps) {
  // Shuffle questions on component mount
  const [questions] = useState(() => shuffleArray(originalQuestions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState<number>(Date.now())

  const { user } = useAuth()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const allAnswers = currentQuestion?.correct_answers || []
  const remainingAnswers = allAnswers.filter((a) => !correctAnswers.includes(a.toLowerCase()))
  const progress = (correctAnswers.length / allAnswers.length) * 100

  // Timer effect
  useEffect(() => {
    if (isFinished) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isFinished])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentQuestionIndex])

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return

    const normalizedAnswer = answer.trim().toLowerCase()
    const isCorrect = remainingAnswers.some((a) => a.toLowerCase() === normalizedAnswer)

    if (isCorrect) {
      setCorrectAnswers((prev) => [...prev, normalizedAnswer])
      setScore((prev) => prev + 1)
    }

    setAnswer("")

    // Check if all answers are found or time is up
    if (correctAnswers.length + (isCorrect ? 1 : 0) === allAnswers.length) {
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1)
          setCorrectAnswers([])
        }, 1000)
      } else {
        handleFinish()
      }
    }
  }

  const handleFinish = async () => {
    setIsFinished(true)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    // Save score to database if user is logged in
    if (user) {
      try {
        await supabase.from("user_scores").insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score: score,
          max_score: allAnswers.length,
          percentage: Math.round((score / allAnswers.length) * 100),
          time_taken: timeTaken,
        })

        // Update user stats
        await supabase
          .from("profiles")
          .update({
            total_score: supabase.rpc("increment", { x: score }),
            quizzes_taken: supabase.rpc("increment", { x: 1 }),
          })
          .eq("id", user.id)
      } catch (error) {
        console.error("Error saving score:", error)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitAnswer()
    }
  }

  const handleGiveUp = () => {
    handleFinish()
  }

  if (isFinished) {
    return (
      <QuizResults
        score={score}
        totalQuestions={allAnswers.length}
        timeTaken={quiz.time_limit - timeLeft}
        quizId={quiz.id}
        quizTitle={quiz.title}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium">
          {correctAnswers.length} of {allAnswers.length} answers found
        </div>
        <div className="text-sm font-medium">Time left: {timeLeft}s</div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {correctAnswers.map((answer, index) => (
            <Badge key={index} variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
              {answer}
            </Badge>
          ))}

          {remainingAnswers.map((_, index) => (
            <Badge key={`empty-${index}`} variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
              ?????
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an answer..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
          <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
            Submit
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={handleGiveUp}>
            Give Up
          </Button>
        </div>
      </Card>
    </div>
  )
}
