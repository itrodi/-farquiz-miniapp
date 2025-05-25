"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, ArrowRight, Share2, Check, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface QuizResultsProps {
  score: number
  totalQuestions: number
  timeTaken: number
  quizId: string
  quizTitle: string
  quiz?: any
  questions?: any[]
  answers?: string[]
  results?: boolean[]
}

export function QuizResults({
  score,
  totalQuestions,
  timeTaken,
  quizId,
  quizTitle,
  quiz,
  questions,
  answers,
  results,
}: QuizResultsProps) {
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const percentage = Math.round((score / totalQuestions) * 100)

  useEffect(() => {
    async function checkLeaderboard() {
      setIsLoading(true)
      try {
        // Get all scores for this quiz
        const { data: scores } = await supabase
          .from("user_scores")
          .select("score, percentage")
          .eq("quiz_id", quizId)
          .order("percentage", { ascending: false })

        if (scores && scores.length > 0) {
          // Find position of current score
          const position = scores.findIndex((s) => s.percentage < percentage) + 1
          setLeaderboardPosition(position > 0 ? position : scores.length + 1)
        }
      } catch (error) {
        console.error("Error checking leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkLeaderboard()
  }, [quizId, percentage, supabase])

  const getResultMessage = () => {
    if (percentage >= 90) return "Excellent! You're a master!"
    if (percentage >= 70) return "Great job! You know your stuff!"
    if (percentage >= 50) return "Good effort! Keep practicing!"
    return "Nice try! Study up and try again!"
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${quizTitle} Quiz Result`,
        text: `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz!`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(
        `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz! Try it yourself: ${window.location.href}`,
      )
      alert("Result copied to clipboard!")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Helper function to get the correct answer text for display
  const getCorrectAnswerText = (question: any) => {
    // For multiple choice questions with structured options
    if (question.options && Array.isArray(question.options) && typeof question.options[0] === "object") {
      const correctOption = question.options.find((opt: any) => opt.id === question.correctAnswer)
      if (correctOption) return correctOption.text
    }

    // For other formats
    return (
      question.correctAnswer ||
      question.correct_answer ||
      (question.correctAnswers && question.correctAnswers[0]) ||
      (question.correct_answers && question.correct_answers[0]) ||
      "N/A"
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {score}/{totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-purple-400">{percentage}%</div>
            <p className="mt-2 text-gray-400">{getResultMessage()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Clock className="h-5 w-5 text-blue-400 mb-1" />
              <div className="text-sm text-gray-400">Time Taken</div>
              <div className="font-semibold">{formatTime(timeTaken)}</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
              <div className="text-sm text-gray-400">Rank</div>
              <div className="font-semibold">
                {isLoading ? "..." : leaderboardPosition ? `#${leaderboardPosition}` : "N/A"}
              </div>
            </div>
          </div>

          {questions && answers && results && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Question Summary</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md text-sm ${
                      results[index]
                        ? "bg-green-900/30 border border-green-800/50"
                        : "bg-red-900/30 border border-red-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {results[index] ? (
                        <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-1">{question.text}</p>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <div>
                            <span className="text-gray-400">Your answer: </span>
                            <span className={results[index] ? "text-green-400" : "text-red-400"}>
                              {answers[index] || "No answer"}
                            </span>
                          </div>
                          {!results[index] && (
                            <div>
                              <span className="text-gray-400">Correct: </span>
                              <span className="text-green-400">{getCorrectAnswerText(question)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Result
        </Button>
        <Button asChild className="flex-1">
          <Link href="/explore">
            Try More Quizzes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
