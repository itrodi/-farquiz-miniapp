"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizResults } from "@/components/quiz-results"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { shuffleArray } from "@/lib/array-utils"
import Image from "next/image"
import type { Tables } from "@/lib/supabase/database.types"

type QuizProps = {
  quiz: Tables<"quizzes"> & {
    categories: Tables<"categories"> | null
    profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null
  }
  questions: Tables<"questions">[]
}

export function ImageQuiz({ quiz, questions: originalQuestions }: QuizProps) {
  // Shuffle questions on component mount
  const [questions] = useState(() => shuffleArray(originalQuestions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit)
  const [isFinished, setIsFinished] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState<number>(Date.now())

  const { user } = useAuth()
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

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

  const handleSubmitAnswer = () => {
    if (isAnswered || !answer.trim()) return

    setIsAnswered(true)
    const normalizedAnswer = answer.trim().toLowerCase()
    const normalizedCorrectAnswer = currentQuestion.correct_answer?.toLowerCase() || ""

    const correct = normalizedAnswer === normalizedCorrectAnswer
    setIsCorrect(correct)

    if (correct) {
      setScore((prev) => prev + 1)
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))

    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setAnswer("")
        setIsAnswered(false)
        setIsCorrect(false)
      } else {
        handleFinish()
      }
    }, 1500)
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
          max_score: questions.length,
          percentage: Math.round((score / questions.length) * 100),
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
    if (e.key === "Enter" && !isAnswered) {
      handleSubmitAnswer()
    }
  }

  if (isFinished) {
    return (
      <QuizResults
        score={score}
        totalQuestions={questions.length}
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
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="text-sm font-medium">Time left: {timeLeft}s</div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

        <div className="flex flex-col items-center mb-6">
          {currentQuestion.image_url && (
            <div className="relative w-full max-w-md h-64 mb-4">
              <Image
                src={currentQuestion.image_url || "/placeholder.svg"}
                alt="Quiz image"
                fill
                className="object-contain"
              />
            </div>
          )}

          <div className="w-full max-w-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600"
                disabled={isAnswered}
              />
              <Button onClick={handleSubmitAnswer} disabled={isAnswered || !answer.trim()}>
                Submit
              </Button>
            </div>

            {isAnswered && (
              <div className={`mt-4 p-3 rounded-md ${isCorrect ? "bg-green-900/30" : "bg-red-900/30"}`}>
                {isCorrect ? (
                  <p className="text-green-400">Correct!</p>
                ) : (
                  <p className="text-red-400">
                    Incorrect. The correct answer is:{" "}
                    <span className="font-semibold">{currentQuestion.correct_answer}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
