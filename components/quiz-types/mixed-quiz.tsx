"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizResults } from "@/components/quiz-results"
import { useRouter, useSearchParams } from "next/navigation"

export function MixedQuiz({ quiz, questions }: { quiz: any; questions: any[] }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isChallenge = searchParams.get("challenge") !== null
  const challengeId = searchParams.get("challenge")

  useEffect(() => {
    // Initialize answers array
    setAnswers(questions.map(() => ({ answer: null, isCorrect: false, points: 0 })))

    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!quizCompleted) {
            setQuizCompleted(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [questions, quizCompleted])

  const handleAnswer = (answer: any, isCorrect: boolean, points = 1) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = { answer, isCorrect, points }
    setAnswers(newAnswers)

    // Move to next question or complete quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const calculateScore = () => {
    return answers.reduce((total, answer) => total + (answer.isCorrect ? answer.points : 0), 0)
  }

  const handleSaveScore = async () => {
    setLoading(true)
    try {
      const score = calculateScore()
      const maxScore = questions.length
      const timeTaken = quiz.time_limit - timeLeft

      // Save score to database
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: quiz.id,
          score,
          max_score: maxScore,
          time_taken: timeTaken,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save score")
      }

      // If this is a challenge, update the challenge
      if (isChallenge && challengeId) {
        await fetch(`/api/challenges/${challengeId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score,
          }),
        })
      }

      // Redirect to results page
      router.push(`/quiz/${quiz.id}/results?score=${score}&max=${maxScore}&time=${timeTaken}`)
    } catch (error) {
      console.error("Error saving score:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (quizCompleted) {
    return (
      <div>
        <QuizResults
          quiz={quiz}
          questions={questions}
          answers={answers}
          timeLeft={timeLeft}
          onSaveScore={handleSaveScore}
          loading={loading}
        />
      </div>
    )
  }

  // Render appropriate question type
  const renderQuestion = () => {
    const questionType = currentQuestion.question_type || currentQuestion.type

    // This is a simplified version - you would need to implement the actual question rendering
    // based on the question type
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">{currentQuestion.text}</h2>
        <div className="space-y-2">
          {/* Render options based on question type */}
          {currentQuestion.options &&
            JSON.parse(currentQuestion.options).map((option: any, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  const isCorrect = option === currentQuestion.correct_answer
                  handleAnswer(option, isCorrect)
                }}
              >
                {option}
              </Button>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm text-gray-400">Time left: {timeLeft}s</div>
        </div>
        <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">{renderQuestion()}</CardContent>
      </Card>
    </div>
  )
}
