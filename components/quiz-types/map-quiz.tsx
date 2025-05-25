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
import Image from "next/image"
import type { Tables } from "@/lib/supabase/database.types"

type QuizProps = {
  quiz: Tables<"quizzes"> & {
    categories: Tables<"categories"> | null
    profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null
  }
  questions: Tables<"questions">[]
}

type Coordinates = {
  x: number
  y: number
}

export function MapQuiz({ quiz, questions: originalQuestions }: QuizProps) {
  // Shuffle questions on component mount
  const [questions] = useState(() => shuffleArray(originalQuestions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState<number>(Date.now())

  const { user } = useAuth()
  const supabase = createClient()
  const mapRef = useRef<HTMLDivElement>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const correctCoordinates = currentQuestion?.map_coordinates as Coordinates
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

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnswered || !mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setSelectedCoordinates({ x, y })
  }

  const handleSubmitAnswer = () => {
    if (isAnswered || !selectedCoordinates) return

    setIsAnswered(true)

    // Calculate distance between selected and correct coordinates
    const distance = calculateDistance(selectedCoordinates, correctCoordinates)
    const isCorrect = distance <= 10 // Allow some margin of error (10% of the map)
    setIsCorrect(isCorrect)

    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setSelectedCoordinates(null)
        setIsAnswered(false)
        setIsCorrect(false)
      } else {
        handleFinish()
      }
    }, 2000)
  }

  const calculateDistance = (a: Coordinates, b: Coordinates) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
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
          <div
            ref={mapRef}
            className="relative w-full max-w-2xl h-64 md:h-96 mb-4 cursor-crosshair"
            onClick={handleMapClick}
          >
            {currentQuestion.map_url && (
              <Image src={currentQuestion.map_url || "/placeholder.svg"} alt="Map" fill className="object-contain" />
            )}

            {selectedCoordinates && (
              <div
                className={`absolute w-6 h-6 rounded-full -ml-3 -mt-3 border-2 ${
                  isAnswered
                    ? isCorrect
                      ? "bg-green-500/50 border-green-500"
                      : "bg-red-500/50 border-red-500"
                    : "bg-blue-500/50 border-blue-500"
                }`}
                style={{
                  left: `${selectedCoordinates.x}%`,
                  top: `${selectedCoordinates.y}%`,
                }}
              />
            )}

            {isAnswered && !isCorrect && (
              <div
                className="absolute w-6 h-6 rounded-full -ml-3 -mt-3 bg-green-500/50 border-2 border-green-500"
                style={{
                  left: `${correctCoordinates.x}%`,
                  top: `${correctCoordinates.y}%`,
                }}
              />
            )}
          </div>

          <div className="w-full max-w-md flex justify-center">
            <Button onClick={handleSubmitAnswer} disabled={isAnswered || !selectedCoordinates} className="px-8">
              Submit
            </Button>
          </div>

          {isAnswered && (
            <div className={`mt-4 p-3 rounded-md ${isCorrect ? "bg-green-900/30" : "bg-red-900/30"}`}>
              {isCorrect ? (
                <p className="text-green-400">Correct!</p>
              ) : (
                <p className="text-red-400">Incorrect. The correct location is shown in green.</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
